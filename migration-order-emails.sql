-- ============================================
-- ORDER NOTIFICATION EMAILS
-- Puts the buyer's real email on the order so both order-creation paths
-- (app/api/razorpay/verify and app/api/webhooks/razorpay) can email them,
-- and makes the razorpay_order_id idempotency guard actually atomic.
--
-- Run in the Supabase SQL editor. Every statement is idempotent.
-- SECTION 3 needs a manual look before its second half is run.
-- ============================================


-- ============================================
-- 1. Tables that only exist in the live database
-- These were created by hand and appear in no .sql file in this repo.
-- CREATE TABLE IF NOT EXISTS is a no-op on production but makes a fresh
-- environment reproducible.
-- ============================================

CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  razorpay_order_id TEXT PRIMARY KEY,
  user_id UUID,
  cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  customer_email TEXT,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only the service-role client (checkout/initiate and the webhook) touches
-- this table, so RLS on with no policies is the right posture: it is
-- unreachable from the browser.
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.store_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Shipping rates are read with the public client on the checkout page.
DROP POLICY IF EXISTS "Anyone can read store settings" ON public.store_settings;
CREATE POLICY "Anyone can read store settings" ON public.store_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage store settings" ON public.store_settings;
CREATE POLICY "Admin can manage store settings" ON public.store_settings
  FOR ALL USING (public.is_admin());


-- ============================================
-- 2. Contact and send-once columns on orders
-- ============================================

-- Added by hand on production during the idempotency work; declared here so
-- the schema is reproducible.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;

-- The buyer's real address. profiles.email holds a synthetic
-- guest-<ts>@checkout.kurtisboutique.in for guest checkouts and cannot be
-- used to contact anyone.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Claim marker. The confirmation is sent by whichever path wins an atomic
-- "UPDATE ... WHERE confirmation_email_sent_at IS NULL RETURNING id".
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ;


-- ============================================
-- 3. Make the idempotency guard atomic
--
-- Both order paths run "SELECT WHERE razorpay_order_id = $1" and then
-- INSERT. They fire within milliseconds of each other for the same payment,
-- so both SELECTs can miss and both INSERTs can succeed: two orders, two
-- stock decrements, two confirmation emails.
--
-- STEP 3a is SELECT-only. If it returns rows, duplicates already exist —
-- delete the extra orders by hand before running 3b, which would fail.
-- ============================================

-- 3a. Inspect (safe to run any time)
SELECT razorpay_order_id, COUNT(*), array_agg(order_number ORDER BY created_at)
FROM public.orders
WHERE razorpay_order_id IS NOT NULL
GROUP BY razorpay_order_id
HAVING COUNT(*) > 1;

-- 3b. Enforce. Partial index: legacy and recovered orders carry a NULL
-- razorpay_order_id and must not collide with each other.
-- Run this only once the application code handles error 23505 (deployed
-- alongside this migration), otherwise a race shows the customer an error
-- on a payment that actually succeeded.
CREATE UNIQUE INDEX IF NOT EXISTS orders_razorpay_order_id_uniq
  ON public.orders (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;


-- ============================================
-- 4. Backfill customer_email from the sessions we still have
-- Lets past orders be emailed and fills the address in the admin order view.
-- ============================================

UPDATE public.orders o
SET customer_email = NULLIF(TRIM(cs.customer_email), '')
FROM public.checkout_sessions cs
WHERE cs.razorpay_order_id = o.razorpay_order_id
  AND o.customer_email IS NULL
  AND NULLIF(TRIM(cs.customer_email), '') IS NOT NULL;

-- confirmation_email_sent_at is deliberately left NULL on historical orders.
-- It is only ever written by the send path, and nothing re-scans old orders.


-- ============================================
-- 5. Lookup index for "find the order for this customer"
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_customer_email
  ON public.orders (customer_email)
  WHERE customer_email IS NOT NULL;
