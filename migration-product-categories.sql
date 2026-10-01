-- ============================================
-- Kurtis Boutique - Multiple categories per product
-- Run this in Supabase SQL Editor BEFORE deploying the matching code.
-- Safe to run more than once.
-- ============================================
--
-- A product can now belong to several categories (e.g. a Diwali kurti that
-- also sits in Sarees). They are stored in products.category_ids.
--
-- products.category_id is NOT dropped. It stays as the product's *primary*
-- category (always the first entry of category_ids), because cards,
-- breadcrumbs and SEO schema still show a single label per product.

-- 1. The list of categories
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_ids UUID[] NOT NULL DEFAULT '{}';

-- 2. Every existing product keeps the category it already has
UPDATE public.products
SET category_ids = ARRAY[category_id]
WHERE category_id IS NOT NULL
  AND category_ids = '{}';

-- 3. Fast "products in category X" lookups
CREATE INDEX IF NOT EXISTS idx_products_category_ids
  ON public.products USING GIN (category_ids);

-- 4. Deleting a category
-- An array has no foreign key, so without this a deleted category's id would
-- linger in every product that used it. products.category_id is ON DELETE SET
-- NULL on its own, which would also leave a product that is still in Sarees
-- with no primary category once Diwali is removed. Before the category goes,
-- take it out of each product's list and hand the primary slot to the next
-- category the product has (NULL if it has none).
-- (In an UPDATE, every SET expression reads the row's old values.)
CREATE OR REPLACE FUNCTION public.detach_deleted_category()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET category_ids = array_remove(category_ids, OLD.id),
      category_id  = CASE
                       WHEN category_id = OLD.id
                       THEN (array_remove(category_ids, OLD.id))[1]
                       ELSE category_id
                     END
  WHERE OLD.id = ANY(category_ids)
     OR category_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS detach_deleted_category ON public.categories;
CREATE TRIGGER detach_deleted_category
  BEFORE DELETE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.detach_deleted_category();

-- ============================================
-- Done. Check with:
--   SELECT p.name, p.category_id, p.category_ids FROM products p LIMIT 20;
-- ============================================
