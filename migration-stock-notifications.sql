-- ============================================
-- STOCK + NOTIFICATION TRIGGER FIX
--
-- Symptom 1: saving a product in the admin panel fails with
--   "new row violates row-level security policy for table notifications"
-- Symptom 2: stock does not go down when an order is placed.
--
-- Same cause. public.notifications has SELECT and UPDATE policies for
-- admins and no INSERT policy at all, and the three trigger functions that
-- write to it run as the caller. When the caller is anything other than a
-- role that bypasses RLS, the INSERT is rejected — and because the trigger
-- runs inside the caller's transaction, the product UPDATE (or the stock
-- decrement) is rolled back with it.
--
-- Two layers of fix:
--   1. SECURITY DEFINER, so the INSERT runs as the function owner.
--   2. An exception handler around each INSERT, so a notification can never
--      again roll back the write that triggered it. A missed alert is a
--      nuisance; a lost sale or an unsaveable product is not.
--
-- Run in the Supabase SQL editor. Idempotent.
-- ============================================


-- ============================================
-- 1. Low stock alert
-- ============================================

CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock_remaining <= NEW.low_stock_threshold
     AND OLD.stock_remaining > OLD.low_stock_threshold THEN
    BEGIN
      INSERT INTO public.notifications (type, title, message, reference_id)
      VALUES (
        'low_stock',
        'Low Stock Alert',
        format('Product "%s" is running low on stock (%s remaining)', NEW.name, NEW.stock_remaining),
        NEW.id
      );
    EXCEPTION WHEN OTHERS THEN
      -- Never let the alert break the stock update that caused it.
      RAISE WARNING 'check_low_stock: notification insert failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 2. New order alert
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.notifications (type, title, message, reference_id)
    VALUES (
      'new_order',
      'New Order Received',
      format('Order %s placed for ₹%s', NEW.order_number, NEW.total),
      NEW.id
    );
  EXCEPTION WHEN OTHERS THEN
    -- An order must never fail because its notification did.
    RAISE WARNING 'notify_new_order: notification insert failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 3. New customisation query alert
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_new_query()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.notifications (type, title, message, reference_id)
    VALUES (
      'new_query',
      'New Customisation Query',
      format('New query for %s', COALESCE(NEW.product_name, 'a product')),
      NEW.id
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_new_query: notification insert failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 4. Ownership
-- SECURITY DEFINER runs as the function OWNER, so the owner is what decides
-- whether RLS is bypassed. Re-assert it rather than trusting whoever last
-- ran a CREATE OR REPLACE.
-- ============================================

ALTER FUNCTION public.check_low_stock() OWNER TO postgres;
ALTER FUNCTION public.notify_new_order() OWNER TO postgres;
ALTER FUNCTION public.notify_new_query() OWNER TO postgres;


-- ============================================
-- 5. Make sure the stock function is present with the signature the app
-- calls: rpc('decrement_stock', { p_product_id, p_quantity, p_size,
-- p_color, p_combo_type }). If an older 3-argument version is what actually
-- exists in this database, every call from the checkout has been failing
-- with "function not found" and silently swallowed by the app.
-- ============================================

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
  IF p_combo_type = 'mom_baby' THEN
    v_multiplier := 2;
  ELSIF p_combo_type = 'family' THEN
    v_multiplier := 3;
  END IF;

  UPDATE public.products
  SET stock_remaining = GREATEST(stock_remaining - (p_quantity * v_multiplier), 0)
  WHERE id = p_product_id;

  IF p_size IS NOT NULL THEN
    UPDATE public.product_sizes
    SET stock_count = GREATEST(stock_count - p_quantity, 0)
    WHERE product_id = p_product_id AND size = p_size;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.decrement_stock(UUID, INT, TEXT, TEXT, TEXT) OWNER TO postgres;

GRANT EXECUTE ON FUNCTION public.decrement_stock(UUID, INT, TEXT, TEXT, TEXT)
  TO authenticated, service_role, anon;


-- ============================================
-- 6. DIAGNOSTICS — run these and read the output.
-- ============================================

-- 6a. Which versions of these functions exist, and are they SECURITY DEFINER?
--     prosecdef must be true for all four rows.
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS args,
       p.prosecdef AS security_definer,
       pg_get_userbyid(p.proowner) AS owner
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('decrement_stock', 'check_low_stock', 'notify_new_order', 'notify_new_query')
ORDER BY p.proname;

-- 6b. Did stock actually move for recent orders? Compares each product's
--     current stock against how many units have been ordered.
SELECT p.name,
       p.stock_remaining,
       SUM(oi.quantity) AS units_ordered_last_30d
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
JOIN public.products p ON p.id = oi.product_id
WHERE o.created_at > now() - interval '30 days'
GROUP BY p.id, p.name, p.stock_remaining
ORDER BY units_ordered_last_30d DESC
LIMIT 20;

-- 6c. Per-size stock. Sizes are stored on order_items as a composed label
--     ("Mom: XL, Baby 1: 3 years"), so the size-level decrement only ever
--     matched plain single-size orders. This shows what the size rows hold.
SELECT p.name, ps.size, ps.stock_count
FROM public.product_sizes ps
JOIN public.products p ON p.id = ps.product_id
ORDER BY p.name, ps.size
LIMIT 30;
