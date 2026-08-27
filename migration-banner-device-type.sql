-- ============================================
-- BANNERS: separate mobile / desktop banners
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Which devices a banner is shown on.
--    'all'     -> shown to both mobile and desktop visitors (legacy behaviour)
--    'desktop' -> shown only on viewports >= 768px
--    'mobile'  -> shown only on viewports < 768px (9:16 full-screen banner)
ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS device_type TEXT NOT NULL DEFAULT 'all';

-- 2. Existing rows keep showing everywhere.
UPDATE public.banners SET device_type = 'all' WHERE device_type IS NULL;

-- 3. Guard against typos from the API layer.
ALTER TABLE public.banners DROP CONSTRAINT IF EXISTS banners_device_type_check;
ALTER TABLE public.banners
  ADD CONSTRAINT banners_device_type_check
  CHECK (device_type IN ('all', 'desktop', 'mobile'));

-- 4. The homepage reads active banners ordered per device group.
CREATE INDEX IF NOT EXISTS banners_device_order_idx
  ON public.banners (device_type, display_order)
  WHERE is_active = true;
