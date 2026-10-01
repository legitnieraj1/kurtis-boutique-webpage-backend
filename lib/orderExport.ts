import ExcelJS from 'exceljs';

// Builds the accounting workbook behind /api/admin/orders/export.
//
// Two sheets, because the two readers want different shapes:
//   * "Order Details"  — one row per product line (customer, product, size,
//     address...), so a product/size can be filtered or pivoted directly.
//   * "Order Summary"  — one row per order carrying the money columns
//     (subtotal, shipping, discount, total). Order-level amounts live only
//     here, so summing the Details sheet never double-counts a shipping fee.

export interface ExportOrderItem {
    product_name: string | null;
    size: string | null;
    color: string | null;
    combo_type: string | null;
    baby_size: string | null;
    quantity: number | null;
    unit_price: number | null;
    total_price: number | null;
}

export interface ExportOrder {
    id: string;
    order_number: string | null;
    created_at: string;
    status: string;
    subtotal: number | null;
    shipping_cost: number | null;
    discount_amount: number | null;
    total: number | null;
    shipping_name: string | null;
    shipping_phone: string | null;
    shipping_address_line1: string | null;
    shipping_address_line2: string | null;
    shipping_city: string | null;
    shipping_state: string | null;
    shipping_pincode: string | null;
    awb_id: string | null;
    courier_name: string | null;
    razorpay_order_id: string | null;
    customer_email: string | null;
    items: ExportOrderItem[] | null;
    profile: { email: string | null; full_name: string | null; phone: string | null } | null;
}

// A customised item is stored by appending the note to the product name
// (see the admin order detail page, which splits on the same marker).
const CUSTOM_MARKER = ' ✂ CUSTOM — ';

const COMBO_LABELS: Record<string, string> = {
    single: 'Single',
    mom_baby: 'Mom & Baby combo',
    family: 'Family combo',
    couple: 'Couple combo',
};

const BRAND_FILL = 'FF801848';
const MONEY_FORMAT = '#,##0.00';
const DATE_FORMAT = 'dd-mmm-yyyy';

const istParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
});

/** Order timestamp as the shop owner sees it: the IST calendar day, plus HH:mm. */
function istDateTime(iso: string): { date: Date; time: string } {
    const parts = Object.fromEntries(istParts.formatToParts(new Date(iso)).map(p => [p.type, p.value]));
    // Excel dates carry no time zone. Writing the IST calendar day as a UTC
    // midnight makes the cell show that same day regardless of server zone.
    const date = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
    return { date, time: `${parts.hour}:${parts.minute}` };
}

const num = (value: number | string | null | undefined) => Number(value) || 0;

function titleCase(status: string) {
    return status
        .split('_')
        .map(w => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(' ');
}

/** Colours are stored as "Name|#hex"; accounting only wants the name. */
function colourName(color: string | null) {
    if (!color) return '';
    return color.includes('|') ? color.split('|')[0] : color;
}

function customerEmail(order: ExportOrder) {
    if (order.customer_email) return order.customer_email;
    const profileEmail = order.profile?.email || '';
    // Guest checkouts get a synthetic profile address that cannot receive mail.
    return /@checkout\./i.test(profileEmail) ? '' : profileEmail;
}

function fullAddress(order: ExportOrder) {
    return [order.shipping_address_line1, order.shipping_address_line2]
        .map(part => (part || '').trim())
        .filter(Boolean)
        .join(', ');
}

function styleHeader(sheet: ExcelJS.Worksheet) {
    const header = sheet.getRow(1);
    header.height = 22;
    header.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_FILL } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

/**
 * Appends a TOTAL row. SUBTOTAL(109) rather than SUM so that when the reader
 * filters the sheet in Excel (say, to one status) the totals follow the
 * visible rows.
 */
function addTotalsRow(sheet: ExcelJS.Worksheet, lastDataRow: number, sums: Record<string, number>, labelKey: string) {
    const row = sheet.addRow({ [labelKey]: 'TOTAL' });
    for (const [key, result] of Object.entries(sums)) {
        const column = sheet.getColumn(key);
        const letter = column.letter;
        row.getCell(key).value = {
            formula: `SUBTOTAL(109,${letter}2:${letter}${lastDataRow})`,
            result,
        };
    }
    row.font = { bold: true };
    row.eachCell({ includeEmpty: true }, cell => {
        cell.border = { top: { style: 'thin' } };
    });
}

export function buildOrdersWorkbook(orders: ExportOrder[]): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Kurtis Boutique';
    workbook.created = new Date();

    // ── Sheet 1: one row per product line ──────────────────────────────────
    const details = workbook.addWorksheet('Order Details');
    details.columns = [
        { header: 'Order No', key: 'orderNo', width: 18 },
        { header: 'Order Date', key: 'date', width: 13, style: { numFmt: DATE_FORMAT } },
        { header: 'Time (IST)', key: 'time', width: 10 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Customer Name', key: 'customer', width: 24 },
        { header: 'Phone', key: 'phone', width: 14, style: { numFmt: '@' } },
        { header: 'Product Name', key: 'product', width: 34 },
        { header: 'Size', key: 'size', width: 9 },
        { header: 'Colour', key: 'colour', width: 14 },
        { header: 'Type', key: 'type', width: 18 },
        { header: 'Baby Size', key: 'babySize', width: 10 },
        { header: 'Customisation', key: 'custom', width: 30 },
        { header: 'Qty', key: 'qty', width: 6 },
        { header: 'Unit Price (₹)', key: 'unit', width: 14, style: { numFmt: MONEY_FORMAT } },
        { header: 'Line Total (₹)', key: 'line', width: 15, style: { numFmt: MONEY_FORMAT } },
        { header: 'Address', key: 'address', width: 44 },
        { header: 'City', key: 'city', width: 16 },
        { header: 'State', key: 'state', width: 16 },
        { header: 'Pincode', key: 'pincode', width: 10, style: { numFmt: '@' } },
    ];

    let totalQty = 0;
    let totalLines = 0;

    for (const order of orders) {
        const { date, time } = istDateTime(order.created_at);
        const orderNo = order.order_number || order.id.slice(0, 8).toUpperCase();
        const orderFields = {
            orderNo,
            date,
            time,
            status: titleCase(order.status),
            customer: order.shipping_name || order.profile?.full_name || '',
            phone: order.shipping_phone || order.profile?.phone || '',
            address: fullAddress(order),
            city: order.shipping_city || '',
            state: order.shipping_state || '',
            pincode: order.shipping_pincode || '',
        };

        const items = order.items?.length ? order.items : null;
        if (!items) {
            // Keep the order visible so this sheet reconciles with the summary.
            details.addRow({ ...orderFields, product: '(no items recorded)' });
            continue;
        }

        for (const item of items) {
            const rawName = item.product_name || '';
            const [product, note] = rawName.includes(CUSTOM_MARKER)
                ? rawName.split(CUSTOM_MARKER)
                : [rawName, ''];
            const qty = num(item.quantity);
            const line = num(item.total_price);
            totalQty += qty;
            totalLines += line;

            details.addRow({
                ...orderFields,
                product,
                size: item.size && item.size !== 'N/A' ? item.size : '',
                colour: colourName(item.color),
                type: COMBO_LABELS[item.combo_type || 'single'] || item.combo_type || '',
                babySize: item.baby_size || '',
                custom: note,
                qty,
                unit: num(item.unit_price),
                line,
            });
        }
    }

    styleHeader(details);
    const detailsLast = details.rowCount;
    if (detailsLast > 1) {
        details.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: details.columnCount } };
        addTotalsRow(details, detailsLast, { qty: totalQty, line: totalLines }, 'orderNo');
    }

    // ── Sheet 2: one row per order ─────────────────────────────────────────
    const summary = workbook.addWorksheet('Order Summary');
    summary.columns = [
        { header: 'Order No', key: 'orderNo', width: 18 },
        { header: 'Order Date', key: 'date', width: 13, style: { numFmt: DATE_FORMAT } },
        { header: 'Time (IST)', key: 'time', width: 10 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Customer Name', key: 'customer', width: 24 },
        { header: 'Phone', key: 'phone', width: 14, style: { numFmt: '@' } },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Address', key: 'address', width: 44 },
        { header: 'City', key: 'city', width: 16 },
        { header: 'State', key: 'state', width: 16 },
        { header: 'Pincode', key: 'pincode', width: 10, style: { numFmt: '@' } },
        { header: 'Units', key: 'units', width: 7 },
        { header: 'Subtotal (₹)', key: 'subtotal', width: 14, style: { numFmt: MONEY_FORMAT } },
        { header: 'Shipping (₹)', key: 'shipping', width: 13, style: { numFmt: MONEY_FORMAT } },
        { header: 'Discount (₹)', key: 'discount', width: 13, style: { numFmt: MONEY_FORMAT } },
        { header: 'Order Total (₹)', key: 'total', width: 15, style: { numFmt: MONEY_FORMAT } },
        { header: 'Courier', key: 'courier', width: 16 },
        { header: 'AWB', key: 'awb', width: 18 },
        { header: 'Razorpay Order ID', key: 'razorpay', width: 24 },
    ];

    const sums = { units: 0, subtotal: 0, shipping: 0, discount: 0, total: 0 };

    for (const order of orders) {
        const { date, time } = istDateTime(order.created_at);
        const units = (order.items || []).reduce((n, item) => n + num(item.quantity), 0);
        const row = {
            units,
            subtotal: num(order.subtotal),
            shipping: num(order.shipping_cost),
            discount: num(order.discount_amount),
            total: num(order.total),
        };
        sums.units += row.units;
        sums.subtotal += row.subtotal;
        sums.shipping += row.shipping;
        sums.discount += row.discount;
        sums.total += row.total;

        summary.addRow({
            orderNo: order.order_number || order.id.slice(0, 8).toUpperCase(),
            date,
            time,
            status: titleCase(order.status),
            customer: order.shipping_name || order.profile?.full_name || '',
            phone: order.shipping_phone || order.profile?.phone || '',
            email: customerEmail(order),
            address: fullAddress(order),
            city: order.shipping_city || '',
            state: order.shipping_state || '',
            pincode: order.shipping_pincode || '',
            ...row,
            courier: order.courier_name || '',
            awb: order.awb_id || '',
            razorpay: order.razorpay_order_id || '',
        });
    }

    styleHeader(summary);
    const summaryLast = summary.rowCount;
    if (summaryLast > 1) {
        summary.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: summary.columnCount } };
        addTotalsRow(summary, summaryLast, sums, 'orderNo');
    }

    return workbook;
}
