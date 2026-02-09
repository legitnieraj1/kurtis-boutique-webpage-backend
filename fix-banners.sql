-- ============================================
-- FIX BANNERS BACKEND
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create Banners Table
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Allow anyone to view active banners
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.banners;
CREATE POLICY "Anyone can view active banners" ON public.banners
  FOR SELECT USING (is_active = true OR public.is_admin());

-- Allow admins to manage all banners
DROP POLICY IF EXISTS "Admin can manage banners" ON public.banners;
CREATE POLICY "Admin can manage banners" ON public.banners
  FOR ALL USING (public.is_admin());

-- 4. Create Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 5. Create Storage Policies
-- Allow public read access to banner images
DROP POLICY IF EXISTS "Anyone can view banners" ON storage.objects;
CREATE POLICY "Anyone can view banners" ON storage.objects
  FOR SELECT USING (bucket_id = 'banners');

-- Allow admins to upload/update/delete banner images
DROP POLICY IF EXISTS "Admin can upload banners" ON storage.objects;
CREATE POLICY "Admin can upload banners" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'banners' AND public.is_admin());

DROP POLICY IF EXISTS "Admin can update banners" ON storage.objects;
CREATE POLICY "Admin can update banners" ON storage.objects
  FOR UPDATE USING (bucket_id = 'banners' AND public.is_admin());

DROP POLICY IF EXISTS "Admin can delete banners" ON storage.objects;
CREATE POLICY "Admin can delete banners" ON storage.objects
  FOR DELETE USING (bucket_id = 'banners' AND public.is_admin());

-- 6. Trigger for updated_at
DROP TRIGGER IF EXISTS set_banners_updated_at ON public.banners;
CREATE TRIGGER set_banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
