-- ============================================================
-- MIGRATION: Global sequential lifetime order counter
-- Format: KBYYYYMMDD-NNN (3-digit zero-padded, expands to 4+ after 999)
-- Run once in Supabase SQL Editor
--
-- SAFETY NOTES:
--   * This migration NEVER changes existing order IDs.
--   * Existing orders keep their current order_number values.
--   * The global counter is seeded from the count of existing orders
--     so the next new order continues the sequence naturally.
--   * The trigger that previously generated random numbers is replaced
--     with one that calls the same atomic next_order_number() function.
--   * The function uses SELECT ... FOR UPDATE to serialise concurrent
--     calls at the DB level -- no application-level locking needed.
-- ============================================================

-- STEP 1: Recreate the counter table as a GLOBAL single-row counter
-- The old table used date_key as primary key (per-day reset).
-- We replace it with a single row keyed 'GLOBAL'.

CREATE TABLE IF NOT EXISTS public.order_number_seq (
    date_key  TEXT PRIMARY KEY,
    last_seq  INT  NOT NULL DEFAULT 0
);

-- Remove per-date rows from earlier migration, then seed the
-- global counter from the actual number of existing orders.
DO $$
DECLARE
    v_old_max   INT;
    v_existing  INT;
    v_seed      INT;
BEGIN
    -- Highest per-date seq seen in the old table (0 if empty or global row already exists)
    SELECT COALESCE(MAX(last_seq), 0) INTO v_old_max
    FROM public.order_number_seq
    WHERE date_key <> 'GLOBAL';

    -- Total confirmed orders already in the database
    SELECT COUNT(*) INTO v_existing FROM public.orders;

    -- Seed = largest of the two to avoid collisions
    v_seed := GREATEST(v_old_max, v_existing);

    -- Remove old per-date rows (no longer used)
    DELETE FROM public.order_number_seq WHERE date_key <> 'GLOBAL';

    -- Upsert the single global row
    INSERT INTO public.order_number_seq (date_key, last_seq)
    VALUES ('GLOBAL', v_seed)
    ON CONFLICT (date_key)
    DO UPDATE SET last_seq = GREATEST(public.order_number_seq.last_seq, EXCLUDED.last_seq);

    RAISE NOTICE 'order_number_seq seeded: old_max=%, existing_orders=%, seed=%',
        v_old_max, v_existing, v_seed;
END $$;

-- STEP 2: Replace next_order_number() with the global version
-- Concurrency safety: SELECT ... FOR UPDATE on the single 'GLOBAL' row
-- serialises every concurrent call. A failed request never corrupts
-- the counter because the UPDATE is inside the same transaction.
CREATE OR REPLACE FUNCTION public.next_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_date  TEXT := to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD');
    v_seq   INT;
BEGIN
    -- Lock the single global row for this transaction only.
    SELECT last_seq INTO v_seq
    FROM public.order_number_seq
    WHERE date_key = 'GLOBAL'
    FOR UPDATE;

    v_seq := v_seq + 1;

    UPDATE public.order_number_seq
    SET last_seq = v_seq
    WHERE date_key = 'GLOBAL';

    -- Zero-pad to 3 digits; expands naturally to 4, 5+ beyond 999.
    -- lpad('1000', 3, '0') = '1000' (no truncation).
    RETURN 'KB' || v_date || '-' || lpad(v_seq::TEXT, 3, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_order_number() TO service_role;
GRANT EXECUTE ON FUNCTION public.next_order_number() TO anon;
GRANT EXECUTE ON FUNCTION public.next_order_number() TO authenticated;

GRANT ALL ON TABLE public.order_number_seq TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.order_number_seq TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.order_number_seq TO authenticated;

-- STEP 3: Replace the INSERT trigger to use next_order_number()
-- Only fires when the application did not supply an order_number
-- (guards legacy routes and avoids double-incrementing).
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.order_number IS NULL OR trim(NEW.order_number) = '' THEN
        NEW.order_number := public.next_order_number();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_order_number ON public.orders;
CREATE TRIGGER set_order_number
    BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- STEP 4: Verify the setup
DO $$
DECLARE
    v_current_seq  INT;
    v_order_count  INT;
    v_fn_exists    BOOLEAN;
BEGIN
    SELECT last_seq INTO v_current_seq
    FROM public.order_number_seq
    WHERE date_key = 'GLOBAL';

    SELECT COUNT(*) INTO v_order_count FROM public.orders;

    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'next_order_number'
    ) INTO v_fn_exists;

    RAISE NOTICE '=== Migration complete ===';
    RAISE NOTICE 'Global counter current value : %', v_current_seq;
    RAISE NOTICE 'Total existing orders        : %', v_order_count;
    RAISE NOTICE 'next_order_number() exists   : %', v_fn_exists;
    RAISE NOTICE 'Next new order will be       : KB%-%',
        to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD'),
        lpad((v_current_seq + 1)::TEXT, 3, '0');
END $$;
