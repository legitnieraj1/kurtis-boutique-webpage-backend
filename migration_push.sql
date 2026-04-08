-- ============================================
-- MIGRATION SCRIPT: Admin Push Notifications
-- Run this in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    subscription JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, subscription)
);

-- Enable RLS
ALTER TABLE public.admin_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own subscriptions
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.admin_push_subscriptions;
CREATE POLICY "Users can view own push subscriptions" ON public.admin_push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON public.admin_push_subscriptions;
CREATE POLICY "Users can insert own push subscriptions" ON public.admin_push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.admin_push_subscriptions;
CREATE POLICY "Users can delete own push subscriptions" ON public.admin_push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Admin has full access
DROP POLICY IF EXISTS "Admins have full access to push subscriptions" ON public.admin_push_subscriptions;
CREATE POLICY "Admins have full access to push subscriptions" ON public.admin_push_subscriptions
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
