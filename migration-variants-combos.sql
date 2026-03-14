-- ============================================
-- Kurtis Boutique - Advanced Variants & Combos Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. FEATURE 1: Product Color Variants
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS colors TEXT[];

-- Add color to cart_items
ALTER TABLE public.cart_items
ADD COLUMN IF NOT EXISTS color TEXT;

-- 2. FEATURE 2: Mom & Baby Combo Products
CREATE TABLE IF NOT EXISTS public.mom_baby_combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  mom_price NUMERIC NOT NULL,
  baby_base_price NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_mom_baby BOOLEAN DEFAULT FALSE;

-- 3. FEATURE 3: Family Combo Products
CREATE TABLE IF NOT EXISTS public.family_combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  mother_price NUMERIC,
  father_price NUMERIC,
  baby_base_price NUMERIC,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_family_combo BOOLEAN DEFAULT FALSE;

-- 4. FEATURE 4: Baby Size Pricing
CREATE TABLE IF NOT EXISTS public.baby_size_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT,
  price NUMERIC
);

-- 5. FEATURE 5: Cart Support for Combos
ALTER TABLE public.cart_items
ADD COLUMN IF NOT EXISTS combo_type TEXT,
ADD COLUMN IF NOT EXISTS selected_size TEXT,
ADD COLUMN IF NOT EXISTS selected_color TEXT;

-- 6. FEATURE 6: Order Items Support
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS combo_type TEXT;
-- Note: 'size' column already exists in order_items

-- 7. FEATURE 7: Inventory Management
-- Update decrement_stock to handle combo multipliers
CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_product_id UUID, 
  p_quantity INT, 
  p_size TEXT DEFAULT NULL, 
  p_color TEXT DEFAULT NULL, 
  p_combo_type TEXT DEFAULT 'single'
)
RETURNS VOID AS $$
DECLARE
  v_multiplier INT := 1;
BEGIN
  -- Determine stock multiplier based on combo type
  IF p_combo_type = 'mom_baby' THEN
    v_multiplier := 2; -- Mom + Baby
  ELSIF p_combo_type = 'family' THEN
    v_multiplier := 3; -- Mother + Father + Baby
  END IF;

  -- Update global stock remaining
  UPDATE public.products
  SET stock_remaining = GREATEST(stock_remaining - (p_quantity * v_multiplier), 0)
  WHERE id = p_product_id;
  
  -- Optionally update variant size stock if size is provided
  IF p_size IS NOT NULL THEN
    UPDATE public.product_sizes
    SET stock_count = GREATEST(stock_count - p_quantity, 0)
    WHERE product_id = p_product_id AND size = p_size;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. FEATURE 9: RLS Security Policies
-- Enable RLS on new tables
ALTER TABLE public.mom_baby_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baby_size_prices ENABLE ROW LEVEL SECURITY;

-- Helper function lookup (assuming public.is_admin() already exists from previous schema)

-- Mom Baby Combos (Public Read, Admin Write)
DROP POLICY IF EXISTS "Anyone can view mom_baby_combos" ON public.mom_baby_combos;
CREATE POLICY "Anyone can view mom_baby_combos" ON public.mom_baby_combos
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage mom_baby_combos" ON public.mom_baby_combos;
CREATE POLICY "Admin can manage mom_baby_combos" ON public.mom_baby_combos
  FOR ALL USING (public.is_admin());

-- Family Combos (Public Read, Admin Write)
DROP POLICY IF EXISTS "Anyone can view family_combos" ON public.family_combos;
CREATE POLICY "Anyone can view family_combos" ON public.family_combos
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage family_combos" ON public.family_combos;
CREATE POLICY "Admin can manage family_combos" ON public.family_combos
  FOR ALL USING (public.is_admin());

-- Baby Size Prices (Public Read, Admin Write)
DROP POLICY IF EXISTS "Anyone can view baby_size_prices" ON public.baby_size_prices;
CREATE POLICY "Anyone can view baby_size_prices" ON public.baby_size_prices
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage baby_size_prices" ON public.baby_size_prices;
CREATE POLICY "Admin can manage baby_size_prices" ON public.baby_size_prices
  FOR ALL USING (public.is_admin());

-- ============================================
-- End of Migration
-- ============================================
