-- PO (case-manager) flow — notes + demo seed infrastructure.
--
-- Backs the real /caseload dashboard: a case manager authenticates via
-- Supabase auth, the middleware checks role='case_manager', and the
-- dashboard shows ONLY citizens assigned to that PO via
-- case_assignments. Notes land here.

CREATE TABLE IF NOT EXISTS case_manager_notes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body         text NOT NULL,
  follow_up    boolean NOT NULL DEFAULT false,
  severity     text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','watch','escalate')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_case_manager_notes_citizen ON case_manager_notes(citizen_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_manager_notes_author  ON case_manager_notes(author_id, created_at DESC);

ALTER TABLE case_manager_notes ENABLE ROW LEVEL SECURITY;

-- A case manager can read/write notes ONLY for citizens on their active
-- caseload. Non-recursive via the SECURITY DEFINER current_user_id helper
-- introduced in 00004.
CREATE POLICY "cm_notes_own_caseload" ON case_manager_notes FOR ALL
  USING (
    citizen_id IN (
      SELECT citizen_id FROM case_assignments
      WHERE case_manager_id = public.current_user_id()
        AND status = 'active'
    )
  )
  WITH CHECK (
    author_id = public.current_user_id()
    AND citizen_id IN (
      SELECT citizen_id FROM case_assignments
      WHERE case_manager_id = public.current_user_id()
        AND status = 'active'
    )
  );

-- Updater trigger — keep updated_at fresh.
CREATE OR REPLACE FUNCTION public.touch_case_manager_notes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_case_manager_notes_touch ON case_manager_notes;
CREATE TRIGGER trg_case_manager_notes_touch
  BEFORE UPDATE ON case_manager_notes
  FOR EACH ROW EXECUTE FUNCTION public.touch_case_manager_notes_updated_at();

-- Helper: return the caller's case-manager caseload (citizens + latest
-- assignment metadata). Bypasses the recursion trap and is RLS-safe.
CREATE OR REPLACE FUNCTION public.my_caseload()
RETURNS TABLE (
  citizen_id        uuid,
  full_name         text,
  state_of_release  text,
  conviction_type   text,
  assigned_at       timestamptz,
  assignment_status text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
  SELECT
    u.id            AS citizen_id,
    u.full_name,
    u.state_of_release,
    u.conviction_type,
    ca.assigned_at,
    ca.status       AS assignment_status
  FROM case_assignments ca
  JOIN users u ON u.id = ca.citizen_id
  WHERE ca.case_manager_id = public.current_user_id()
    AND ca.status = 'active';
$$;

GRANT EXECUTE ON FUNCTION public.my_caseload() TO authenticated;

-- Deliberately NOT adding a cm_see_assigned_users RLS policy — any
-- subquery that walks case_assignments → users re-enters the users
-- RLS stack through the users_own_data → current_user_id() → users
-- loop and hits infinite recursion (42P17). Instead, the per-member
-- detail page resolves the citizen row via a SECURITY DEFINER RPC
-- (get_caseload_member) that bypasses RLS after checking assignment.
CREATE OR REPLACE FUNCTION public.get_caseload_member(p_citizen_id uuid)
RETURNS TABLE (
  id                uuid,
  full_name         text,
  state_of_release  text,
  conviction_type   text,
  created_at        timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
BEGIN
  -- Only return a row if the caller is a case_manager with an active
  -- assignment on this citizen. Everything else: empty result set.
  RETURN QUERY
    SELECT u.id, u.full_name, u.state_of_release, u.conviction_type, u.created_at
    FROM users u
    WHERE u.id = p_citizen_id
      AND EXISTS (
        SELECT 1 FROM case_assignments ca
        WHERE ca.case_manager_id = public.current_user_id()
          AND ca.citizen_id = p_citizen_id
          AND ca.status = 'active'
      );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_caseload_member(uuid) TO authenticated;
