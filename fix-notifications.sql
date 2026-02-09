-- ==============================================
-- FIX: Notifications RLS Violation
-- Run this in Supabase SQL Editor
-- ==============================================

-- 1. Fix notify_new_order (Make it SECURITY DEFINER)
-- This allows the trigger to insert into 'notifications' even if the user doesn't have permission
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (type, title, message, reference_id)
  VALUES (
    'new_order',
    'New Order Received',
    format('Order %s placed for ₹%s', NEW.order_number, NEW.total),
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix notify_new_query (Make it SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.notify_new_query()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (type, title, message, reference_id)
  VALUES (
    'new_query',
    'New Customisation Query',
    format('New customisation request for "%s"', COALESCE(NEW.product_name, 'General Query')),
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix check_low_stock (Make it SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock_remaining <= NEW.low_stock_threshold AND OLD.stock_remaining > OLD.low_stock_threshold THEN
    INSERT INTO public.notifications (type, title, message, reference_id)
    VALUES (
      'low_stock',
      'Low Stock Alert',
      format('Product "%s" is running low on stock (%s remaining)', NEW.name, NEW.stock_remaining),
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ensure RLS allows Admin to view/manage notifications
DROP POLICY IF EXISTS "Admin can view notifications" ON public.notifications;
CREATE POLICY "Admin can view notifications" ON public.notifications
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admin can update notifications" ON public.notifications;
CREATE POLICY "Admin can update notifications" ON public.notifications
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
