-- One-time repair for product photo ordering.
--
-- Photos uploaded before positions were normalised can share a display_order
-- (the column defaults to 0). When two rows tie, PostgREST returns them in
-- whatever order it likes, so the storefront could show a photo other than the
-- cover the admin set. This renumbers every product's photos 0..n-1, keeping
-- the order they currently sort in and using the upload time to break ties.
--
-- Safe to re-run: rows already numbered correctly are updated to the same value.

WITH ranked AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY product_id
            ORDER BY COALESCE(display_order, 0), created_at, id
        ) - 1 AS new_order
    FROM public.product_images
)
UPDATE public.product_images AS pi
SET display_order = ranked.new_order
FROM ranked
WHERE pi.id = ranked.id
  AND pi.display_order IS DISTINCT FROM ranked.new_order;

-- Verify: every product should list 0,1,2,... with no repeats.
-- SELECT product_id, array_agg(display_order ORDER BY display_order)
-- FROM public.product_images GROUP BY product_id;
