-- ============================================
-- ONE-OFF STOCK RECONCILIATION
--
-- Stock never decremented on any order before 2026-08-12 (see
-- migration-stock-notifications.sql for why), so every product's
-- stock_remaining overstated reality by whatever had sold.
--
-- STATUS: applied to production on 2026-08-12. Results:
--   Munbe Vaa Kurti+Dupatta Set    10 -> 5   (-5)
--   Pista Green Butterfly Dresses  10 -> 6   (-4)
--   Cotton Green Dancing Doll      30 -> 28  (-2)
--
-- This is a ONE-OFF. Do not run it again — the application now decrements
-- stock on every order, so a second run would double-count.
--
-- Why "sold since last edit" rather than all-time sales:
-- orders go back to 2026-03-23, and subtracting five months of sales from
-- today's numbers assumes stock was never restocked or hand-corrected in
-- the admin panel. It plainly was — that assumption would have driven
-- "Raw Silk Maxi" to 0 and made a sellable product unsellable. Whatever
-- number the owner last typed into the admin form was correct at the moment
-- they typed it, so only sales after products.updated_at are missing from it.
--
-- Known conservative bias: updated_at moves on ANY product edit, not just a
-- stock edit. A product whose photo was changed after a sale looks
-- reconciled when it is not. Under-correcting (stock slightly high) beats
-- over-correcting (stock at zero, product unbuyable).
-- ============================================


-- Preview first. Run this alone and read it before the UPDATE below.
SELECT p.name,
       p.stock_remaining AS current_stock,
       p.updated_at::date AS last_edited,
       SUM(oi.quantity * CASE oi.combo_type
             WHEN 'mom_baby' THEN 2
             WHEN 'family' THEN 3
             ELSE 1 END) FILTER (WHERE o.created_at > p.updated_at) AS sold_since_edit,
       SUM(oi.quantity * CASE oi.combo_type
             WHEN 'mom_baby' THEN 2
             WHEN 'family' THEN 3
             ELSE 1 END) AS sold_all_time
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
JOIN public.products p ON p.id = oi.product_id
WHERE o.status <> 'cancelled'
GROUP BY p.id, p.name, p.stock_remaining, p.updated_at
HAVING SUM(oi.quantity) FILTER (WHERE o.created_at > p.updated_at) > 0
ORDER BY sold_since_edit DESC;


-- The correction that was applied.
WITH sold AS (
  SELECT oi.product_id,
         SUM(oi.quantity * CASE oi.combo_type
               WHEN 'mom_baby' THEN 2
               WHEN 'family' THEN 3
               ELSE 1 END) AS units
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  JOIN public.products p ON p.id = oi.product_id
  WHERE o.status <> 'cancelled'
    AND o.created_at > p.updated_at
  GROUP BY oi.product_id
)
UPDATE public.products p
SET stock_remaining = GREATEST(p.stock_remaining - sold.units, 0)
FROM sold
WHERE sold.product_id = p.id
RETURNING p.name, p.stock_remaining AS new_stock, sold.units AS subtracted;


-- Products the owner may still want to correct by hand: sold all-time far
-- exceeds what was subtracted above, so if these were never restocked their
-- stock is still too high.
--   Munbe Vaa Kurti+Dupatta Set   9 sold all-time
--   Raw Silk Maxi                 8 sold all-time, showing 2
--   Classic Black Cotton Maxi     5 sold all-time, showing 19
--   NP01 Narayanpet Family combo  3 sold all-time, showing 97
--   Red Elephant Print Maxi       3 sold all-time, showing 47
-- Only the owner knows what was restocked, so this is left to the admin UI.


-- Health check to run occasionally: orders whose stock clearly never moved.
-- Should stay empty now that decrement_stock resolves.
SELECT o.order_number, o.created_at::date, p.name, oi.quantity, p.stock_remaining
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
JOIN public.products p ON p.id = oi.product_id
WHERE o.created_at > now() - interval '7 days'
ORDER BY o.created_at DESC;
