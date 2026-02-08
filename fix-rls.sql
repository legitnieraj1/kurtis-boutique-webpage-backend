-- ============================================
-- FIX FOR EMPTY PRODUCTS LIST
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check current products (for debugging)
-- SELECT id, name, is_active FROM public.products;

-- Step 2: Fix any products with NULL is_active
UPDATE public.products SET is_active = true WHERE is_active IS NULL;

-- Step 3: Drop existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

-- Step 4: Create simple public SELECT policy
-- This allows ANYONE to read products where is_active = true
CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT
  USING (is_active = true);

-- Step 5: Create admin-only full access policy (for viewing inactive products too)
DROP POLICY IF EXISTS "Admin can view all products" ON public.products;
CREATE POLICY "Admin can view all products" ON public.products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Step 6: Ensure Admin can INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Admin can manage products" ON public.products;
CREATE POLICY "Admin can manage products" ON public.products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================
-- VERIFICATION: Run this to check policies
-- ============================================
-- SELECT * FROM pg_policies WHERE tablename = 'products';

-- ============================================
-- DONE! Refresh your admin panel.
-- ============================================
