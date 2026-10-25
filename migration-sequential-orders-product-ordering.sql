-- ============================================================
-- MIGRATION: Sequential order numbers + product display_order
-- Run once in Supabase SQL Editor
--
-- *** SUPERSEDED ***
-- The next_order_number() function in this file used a PER-DATE
-- counter (resets each day).  Run migration-global-sequential-order-
-- numbers.sql instead, which replaces it with a GLOBAL lifetime
-- counter (KBYYYYMMDD-NNN format, never resets).
-- This file is kept for historical reference only.
-- ============================================================

-- ─── 1. Sequential order number counter ─────────────────────
CREATE TABLE IF NOT EXISTS public.order_number_seq (
    date_key  TEXT PRIMARY KEY,
    last_seq  INT  NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.next_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_date TEXT := to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD');
    v_seq  INT;
BEGIN
    INSERT INTO public.order_number_seq (date_key, last_seq)
    VALUES (v_date, 1)
    ON CONFLICT (date_key)
    DO UPDATE SET last_seq = order_number_seq.last_seq + 1
    RETURNING last_seq INTO v_seq;

    RETURN 'KB' || v_date || '-' || lpad(v_seq::TEXT, 4, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_order_number() TO service_role;

-- ─── 2. product display_order ───────────────────────────────
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;

WITH ranked AS (
    SELECT id,
           row_number() OVER (ORDER BY created_at DESC) AS rn
    FROM public.products
)
UPDATE public.products p
SET    display_order = ranked.rn
FROM   ranked
WHERE  p.id = ranked.id
  AND  p.display_order = 0;

CREATE INDEX IF NOT EXISTS idx_products_display_order
    ON public.products (display_order);
