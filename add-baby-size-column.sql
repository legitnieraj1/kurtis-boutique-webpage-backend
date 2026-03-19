-- ============================================
-- Add baby_size column to cart_items and order_items
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add baby_size to cart_items
ALTER TABLE public.cart_items
ADD COLUMN IF NOT EXISTS baby_size TEXT;

-- 2. Add baby_size to order_items
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS baby_size TEXT;

-- ============================================
-- Done! Now baby_size can be stored in both
-- cart items and order items for Mom & Baby
-- and Family combo products.
-- ============================================
