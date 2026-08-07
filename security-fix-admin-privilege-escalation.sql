-- =====================================================================
-- SECURITY FIX: admin privilege escalation via profiles.role
-- Run this ONCE in the Supabase SQL editor (Dashboard > SQL Editor).
--
-- THE VULNERABILITY
-- -----------------
-- The existing policy:
--     CREATE POLICY "Users can update own profile" ON public.profiles
--       FOR UPDATE USING (auth.uid() = id);
-- lets a row be updated whenever the caller owns it, but places no
-- restriction on WHICH COLUMNS may be written. `role` is one of them.
--
-- So any signed-up customer could open the browser console on the
-- storefront and run, with nothing but the public anon key:
--
--     const { data: { user } } = await supabase.auth.getUser();
--     await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id);
--
-- ...and become a genuine admin. Not merely "the admin UI renders" —
-- a real admin, because every server-side requireAdmin() check reads
-- this same column. Full read/write access to orders, customers and
-- products follows.
--
-- THE FIX
-- -------
-- Two independent layers, so a mistake in either one is not fatal:
--   1. Column-level GRANTs  — Postgres refuses the UPDATE outright.
--   2. A BEFORE UPDATE trigger — even if a policy or grant is later
--      loosened by hand, role changes from non-admins are reverted.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 0. Harden the is_admin() helper.
--    SECURITY DEFINER runs as the function owner (postgres). Without a
--    pinned search_path a caller can prepend a schema of their own and
--    have `public.profiles` resolve to a table they control, making
--    is_admin() return true for anyone. Pinning search_path closes that.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Same hardening for the signup trigger, which also runs as definer.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    'customer'          -- never read the role from user-supplied metadata
  );
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------
-- 1. Column-level privileges.
--    `role` is deliberately absent from the GRANT list, as are `id`
--    (identity) and `created_at`. An UPDATE touching any of them from
--    an anon/authenticated client now fails with
--    "permission denied for table profiles" before RLS is even consulted.
--    The service-role key used by the server bypasses this entirely,
--    so /api/* admin routes keep working.
-- ---------------------------------------------------------------------
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT  UPDATE (full_name, phone, avatar_url, updated_at)
       ON public.profiles TO authenticated;

-- Nobody signed-out has any business writing a profile.
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon;

-- ---------------------------------------------------------------------
-- 2. Trigger backstop: silently revert unauthorised role changes.
--    Runs for every UPDATE regardless of which client made it. Only the
--    service-role key (server code) and existing admins may move a role.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Allowed to move a role:
    --   * the service-role key (server code / API routes)
    --   * a direct superuser session, i.e. the Supabase SQL editor, so
    --     you can still bootstrap the first admin by hand
    --   * an account that is already an admin
    -- Everything else — every browser client holding the anon key —
    -- has the change reverted.
    IF COALESCE(auth.role(), '') <> 'service_role'
       AND current_user NOT IN ('postgres', 'supabase_admin', 'service_role')
       AND NOT EXISTS (
         SELECT 1 FROM public.profiles
         WHERE id = auth.uid() AND role = 'admin'
       )
    THEN
      RAISE WARNING 'Blocked unauthorised role change on profile % (% -> %)',
        NEW.id, OLD.role, NEW.role;
      NEW.role := OLD.role;
    END IF;
  END IF;

  -- The primary key must never move either.
  NEW.id := OLD.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role ON public.profiles;
CREATE TRIGGER protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- ---------------------------------------------------------------------
-- 3. Restate the row policies so intent is explicit.
--    USING gates which rows may be targeted; WITH CHECK gates what the
--    row is allowed to look like afterwards. The original policy had no
--    WITH CHECK at all, which is what let a user rewrite their own row
--    into an admin row.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

COMMIT;

-- =====================================================================
-- VERIFY
-- =====================================================================
-- Confirm `role` is not in the authenticated grant list — this should
-- return full_name, phone, avatar_url, updated_at and nothing else:
--
--   SELECT column_name
--   FROM information_schema.column_privileges
--   WHERE table_name = 'profiles'
--     AND grantee = 'authenticated'
--     AND privilege_type = 'UPDATE';
--
-- List who currently holds admin, and remove any you do not recognise:
--
--   SELECT id, email, role FROM public.profiles WHERE role = 'admin';
--   -- UPDATE public.profiles SET role = 'customer' WHERE email = 'someone@example.com';
--
-- Grant admin to the intended account (run as service role / SQL editor):
--
--   UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
-- =====================================================================
