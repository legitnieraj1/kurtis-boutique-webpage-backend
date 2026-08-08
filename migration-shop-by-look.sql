-- ============================================
-- SHOP BY LOOK
-- Instagram reels (or hosted videos) linked to a product.
-- Rendered on the homepage between "Find your occasion" and "New Arrivals",
-- each opening /look/<id> with the video + a buy card for the linked product.
-- ============================================

CREATE TABLE IF NOT EXISTS public.shop_by_look (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Optional heading shown on the look page; falls back to the product name.
  title TEXT,
  -- Optional copy shown on the look page; falls back to the product description.
  description TEXT,
  -- Instagram reel permalink, e.g. https://www.instagram.com/reel/XXXX/
  instagram_url TEXT,
  -- Optional direct video file (mp4). When set it plays natively instead of
  -- the Instagram embed, which gives the full-bleed Taneira-style playback.
  video_url TEXT,
  -- Optional poster/tile image. When null the linked product's first image is used.
  thumbnail_url TEXT,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- A look is pointless without something to play.
  CONSTRAINT shop_by_look_needs_media CHECK (
    instagram_url IS NOT NULL OR video_url IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_shop_by_look_active_order
  ON public.shop_by_look (is_active, display_order);

CREATE INDEX IF NOT EXISTS idx_shop_by_look_product
  ON public.shop_by_look (product_id);

-- updated_at trigger (same helper the other tables use)
DROP TRIGGER IF EXISTS set_shop_by_look_updated_at ON public.shop_by_look;
CREATE TRIGGER set_shop_by_look_updated_at
  BEFORE UPDATE ON public.shop_by_look
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ========== RLS (mirrors banners) ==========
ALTER TABLE public.shop_by_look ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active looks" ON public.shop_by_look;
CREATE POLICY "Anyone can view active looks" ON public.shop_by_look
  FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin can manage looks" ON public.shop_by_look;
CREATE POLICY "Admin can manage looks" ON public.shop_by_look
  FOR ALL USING (public.is_admin());

-- ========== SEED: first look ==========
-- Reel: https://www.instagram.com/reel/DbqeDiySLbZ/
-- Product: /product/narayanpet-family-combo-1785949735809
INSERT INTO public.shop_by_look (title, instagram_url, product_id, display_order, is_active)
SELECT
  'Narayanpet Family Combo',
  'https://www.instagram.com/reel/DbqeDiySLbZ/',
  p.id,
  0,
  true
FROM public.products p
WHERE p.slug = 'narayanpet-family-combo-1785949735809'
  AND NOT EXISTS (
    SELECT 1 FROM public.shop_by_look s
    WHERE s.instagram_url = 'https://www.instagram.com/reel/DbqeDiySLbZ/'
  );
