-- Fix infinite recursion on users-table RLS policies.
--
-- Root cause: cm_see_assigned_users references users inside a subquery.
-- When Postgres evaluates a row-visibility check on users, it applies
-- every policy on users — including this one — which re-queries users,
-- triggering the same check recursively.
--
-- Fix: the user-id-from-auth lookup runs through a SECURITY DEFINER
-- function that bypasses RLS. Policies use that helper instead of an
-- inline subquery against users.

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM users WHERE auth_id = auth.uid() LIMIT 1;
  RETURN uid;
END;
$$;

-- Drop the recursive policy. The case-manager-sees-assigned-citizens
-- visibility is handled by the cm_see_assigned_* policies on the
-- resource tables (action_plans, plan_steps, etc.). Seeing the base
-- users row for an assigned citizen isn't required for the current
-- case-manager flows; add back via a non-recursive path (e.g. join
-- against auth.jwt() role claim) when that flow actually needs it.
DROP POLICY IF EXISTS "cm_see_assigned_users" ON users;

-- Same pattern for every other "resolve via users" policy — route through
-- the SECURITY DEFINER helper so they don't bounce back into users RLS.
DROP POLICY IF EXISTS "users_own_plans" ON action_plans;
CREATE POLICY "users_own_plans" ON action_plans FOR ALL
    USING (user_id = public.current_user_id());

DROP POLICY IF EXISTS "users_own_steps" ON plan_steps;
CREATE POLICY "users_own_steps" ON plan_steps FOR ALL
    USING (plan_id IN (
        SELECT id FROM action_plans WHERE user_id = public.current_user_id()
    ));

DROP POLICY IF EXISTS "users_own_screenings" ON benefits_screenings;
CREATE POLICY "users_own_screenings" ON benefits_screenings FOR ALL
    USING (user_id = public.current_user_id());

DROP POLICY IF EXISTS "users_own_matches" ON employment_matches;
CREATE POLICY "users_own_matches" ON employment_matches FOR ALL
    USING (user_id = public.current_user_id());

DROP POLICY IF EXISTS "users_own_deadlines" ON deadlines;
CREATE POLICY "users_own_deadlines" ON deadlines FOR ALL
    USING (user_id = public.current_user_id());

DROP POLICY IF EXISTS "users_own_risks" ON risk_flags;
CREATE POLICY "users_own_risks" ON risk_flags FOR ALL
    USING (user_id = public.current_user_id());

DROP POLICY IF EXISTS "users_own_sessions" ON intake_sessions;
CREATE POLICY "users_own_sessions" ON intake_sessions FOR ALL
    USING (user_id = public.current_user_id());

DROP POLICY IF EXISTS "users_own_transcripts" ON voice_transcripts;
CREATE POLICY "users_own_transcripts" ON voice_transcripts FOR ALL
    USING (user_id = public.current_user_id());

-- Grant execute on the helper to authenticated users + service_role.
GRANT EXECUTE ON FUNCTION public.current_user_id() TO authenticated, service_role;
