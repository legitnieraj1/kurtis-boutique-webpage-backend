-- ============================================
-- CREATE ADMIN USER SCRIPT
-- Run this in Supabase SQL Editor after a user signs up
-- ============================================

-- Step 1: Find the user you want to make admin
-- Replace 'your-email@example.com' with the actual email
SELECT id, email, role FROM public.profiles 
WHERE email = 'your-email@example.com';

-- Step 2: Make that user an admin
-- Replace 'your-email@example.com' with the actual email
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- ============================================
-- ALTERNATIVE: Create admin user directly
-- This bypasses email confirmation requirements
-- ============================================

-- Option A: If you already have a user, just update their role:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';

-- Option B: View all users to find their emails:
-- SELECT id, email, role, created_at FROM public.profiles ORDER BY created_at DESC;

-- ============================================
-- VERIFY ADMIN STATUS
-- ============================================
-- After updating, verify the user is now admin:
SELECT id, email, role, created_at 
FROM public.profiles 
WHERE role = 'admin';
