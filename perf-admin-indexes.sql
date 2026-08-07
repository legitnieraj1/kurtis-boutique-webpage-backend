-- =====================================================================
-- Admin panel performance: indexes + dashboard aggregate
-- Run once in the Supabase SQL editor. Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Indexes for the sorts and filters the admin screens actually issue.
-- Without these, every order list and dashboard load is a sequential
-- scan of the orders table followed by an in-memory sort.
-- ---------------------------------------------------------------------

-- /admin/orders and the dashboard both sort by created_at DESC.
CREATE INDEX IF NOT EXISTS idx_orders_created_at
    ON public.orders (created_at DESC);

-- "orders with status X, newest first" — the status tabs.
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at
    ON public.orders (status, created_at DESC);

-- /admin/products sorts by created_at DESC.
CREATE INDEX IF NOT EXISTS idx_products_created_at
    ON public.products (created_at DESC);

-- Thumbnails are read as "images for this product, in display order".
CREATE INDEX IF NOT EXISTS idx_product_images_product_order
    ON public.product_images (product_id, display_order);

-- The customisation queue filters on status then sorts by date.
CREATE INDEX IF NOT EXISTS idx_customisation_queries_status_created
    ON public.customisation_queries (status, created_at DESC);

-- The notification bell counts unread rows.
CREATE INDEX IF NOT EXISTS idx_notifications_unread
    ON public.notifications (is_read, created_at DESC)
    WHERE is_read = false;

-- requireAdmin() looks up exactly one profile by id on most requests;
-- the primary key covers that, but the role predicate benefits from a
-- partial index when listing admins.
CREATE INDEX IF NOT EXISTS idx_profiles_admin
    ON public.profiles (id) WHERE role = 'admin';

-- ---------------------------------------------------------------------
-- Dashboard totals, computed in Postgres.
--
-- The route can sum order totals in JavaScript, but that means shipping
-- one row per order to the server on every dashboard load — fine at a
-- hundred orders, not at fifty thousand. This returns a single row.
--
-- The route calls this via .rpc() and falls back to the JS sum if the
-- function is absent, so applying this file is an optimisation rather
-- than a requirement.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_dashboard_totals()
RETURNS TABLE (
    total_orders   BIGINT,
    total_revenue  NUMERIC,
    pending_orders BIGINT,
    today_orders   BIGINT,
    today_revenue  NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT
        COUNT(*),
        COALESCE(SUM(total), 0),
        COUNT(*) FILTER (WHERE status = 'pending'),
        COUNT(*) FILTER (WHERE created_at >= date_trunc('day', NOW())),
        COALESCE(SUM(total) FILTER (WHERE created_at >= date_trunc('day', NOW())), 0)
    FROM public.orders;
$$;

-- SECURITY DEFINER means this reads past RLS, so it must not be callable
-- by ordinary users: only the service role (used by the admin API route)
-- may execute it.
REVOKE EXECUTE ON FUNCTION public.admin_dashboard_totals() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_dashboard_totals() TO service_role;

-- ---------------------------------------------------------------------
-- Refresh planner statistics so the new indexes get used immediately.
-- ---------------------------------------------------------------------
ANALYZE public.orders;
ANALYZE public.products;
ANALYZE public.product_images;
ANALYZE public.profiles;
