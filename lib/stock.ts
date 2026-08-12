/**
 * Stock decrement for placed orders.
 *
 * Both order-creation paths used to call the `decrement_stock` RPC directly
 * and log-and-forget any error, which meant a broken function or a rejected
 * trigger showed up as "stock never moves" with no visible failure.
 */

export interface StockLineItem {
    product_id?: string | null;
    quantity: number;
    size?: string | null;
    color?: string | null;
    combo_type?: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Units of the parent garment consumed per unit ordered. Mirrors the SQL. */
function comboMultiplier(comboType?: string | null): number {
    if (comboType === 'mom_baby') return 2;
    if (comboType === 'family') return 3;
    return 1;
}

/**
 * The size label as it exists in `product_sizes`, pulled out of the composed
 * label the cart stores.
 *
 * Cart sizes are built for display, e.g. "Mom: XL, Baby 1: 3 years (Girl)"
 * or "XL + Feeding Zip". Passing those straight to the RPC matched no size
 * row, so per-size stock only ever moved for plain single-size orders with
 * no add-ons.
 *
 * Returns null when the order consumes no adult size (baby-only).
 */
export function baseSizeForStock(
    size?: string | null,
    comboType?: string | null
): string | null {
    if (!size) return null;

    // Add-ons are appended as " + Name"; they are not part of the size.
    const withoutAddons = size.split(' + ')[0].trim();
    if (!withoutAddons) return null;

    if (comboType === 'baby_only') return null;

    // Combos name each wearer. The adult garment is the one held in stock.
    const labelled = withoutAddons.match(/(?:^|,\s*)(?:Mom|Mother|Women)\s*:\s*([^,]+)/i);
    if (labelled) return labelled[1].trim();

    // A composed label we do not recognise is not a size — better to skip the
    // size row than to decrement the wrong one.
    if (withoutAddons.includes(':') || withoutAddons.includes(',')) return null;

    return withoutAddons;
}

/**
 * Decrements stock for every line of an order.
 *
 * Prefers the `decrement_stock` RPC. If that fails — a missing function, a
 * signature drift, a trigger rejection — it falls back to updating the rows
 * directly so the sale is still reflected, and returns what went wrong so
 * the caller can log it loudly.
 *
 * Never throws.
 */
export async function decrementStockForOrder(
    adminDb: any,
    items: StockLineItem[],
    orderNumber: string
): Promise<{ ok: boolean; failures: string[] }> {
    const failures: string[] = [];

    for (const item of items) {
        const productId = item.product_id;
        if (!productId || !UUID_RE.test(productId)) continue;

        const quantity = Math.max(1, Number(item.quantity) || 1);
        const comboType = item.combo_type || 'single';
        const sizeForStock = baseSizeForStock(item.size, comboType);

        const { error: rpcError } = await adminDb.rpc('decrement_stock', {
            p_product_id: productId,
            p_quantity: quantity,
            p_size: sizeForStock,
            p_color: item.color || null,
            p_combo_type: comboType,
        });

        if (!rpcError) continue;

        console.error(
            `[Stock] ${orderNumber} decrement_stock RPC failed for ${productId}: ${rpcError.message} — falling back to a direct update`
        );

        // Fallback. Read-then-write is racy under concurrent orders, but this
        // only runs when the atomic path is already broken, and understating
        // stock beats never reducing it.
        try {
            const { data: product, error: readError } = await adminDb
                .from('products')
                .select('stock_remaining')
                .eq('id', productId)
                .single();

            if (readError || !product) {
                failures.push(`${productId}: ${readError?.message || 'product not found'}`);
                continue;
            }

            const units = quantity * comboMultiplier(comboType);
            const next = Math.max((Number(product.stock_remaining) || 0) - units, 0);

            const { error: writeError } = await adminDb
                .from('products')
                .update({ stock_remaining: next })
                .eq('id', productId);

            if (writeError) {
                failures.push(`${productId}: ${writeError.message}`);
                continue;
            }

            if (sizeForStock) {
                const { data: sizeRow } = await adminDb
                    .from('product_sizes')
                    .select('id, stock_count')
                    .eq('product_id', productId)
                    .eq('size', sizeForStock)
                    .maybeSingle();

                if (sizeRow) {
                    await adminDb
                        .from('product_sizes')
                        .update({ stock_count: Math.max((Number(sizeRow.stock_count) || 0) - quantity, 0) })
                        .eq('id', sizeRow.id);
                }
            }

            console.log(`[Stock] ${orderNumber} fallback decrement applied for ${productId} (-${units})`);
        } catch (error: any) {
            failures.push(`${productId}: ${error?.message || String(error)}`);
        }
    }

    if (failures.length) {
        console.error(`[Stock] ${orderNumber} could not decrement: ${failures.join(' | ')}`);
    }

    return { ok: failures.length === 0, failures };
}
