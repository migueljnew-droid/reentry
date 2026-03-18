-- REENTRY: Enhanced RLS Policies
-- SPEC-002 / SHARD-001: Complete role-based access control
-- Adds: audit_log RLS, expanded case manager policies, admin policies

-- ==========================================
-- AUDIT LOG — append-only (CJIS compliance)
-- ==========================================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can INSERT audit entries
CREATE POLICY "audit_log_insert" ON audit_log
    FOR INSERT
    WITH CHECK (true);

-- Only admins can SELECT audit entries
CREATE POLICY "audit_log_select" ON audit_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE auth_id = auth.uid() AND role = 'admin'
        )
    );

-- No UPDATE or DELETE policies — append-only enforced by RLS

-- ==========================================
-- CASE MANAGER: Read access to assigned client data
-- (Extends initial migration which only covered users + action_plans)
-- ==========================================

-- Plan steps for assigned clients
CREATE POLICY "cm_see_assigned_steps" ON plan_steps
    FOR SELECT
    USING (
        plan_id IN (
            SELECT ap.id FROM action_plans ap
            WHERE ap.user_id IN (
                SELECT ca.citizen_id FROM case_assignments ca
                JOIN users u ON ca.case_manager_id = u.id
                WHERE u.auth_id = auth.uid() AND ca.status = 'active'
            )
        )
    );

-- Benefits screenings for assigned clients
CREATE POLICY "cm_see_assigned_screenings" ON benefits_screenings
    FOR SELECT
    USING (
        user_id IN (
            SELECT ca.citizen_id FROM case_assignments ca
            JOIN users u ON ca.case_manager_id = u.id
            WHERE u.auth_id = auth.uid() AND ca.status = 'active'
        )
    );

-- Employment matches for assigned clients
CREATE POLICY "cm_see_assigned_matches" ON employment_matches
    FOR SELECT
    USING (
        user_id IN (
            SELECT ca.citizen_id FROM case_assignments ca
            JOIN users u ON ca.case_manager_id = u.id
            WHERE u.auth_id = auth.uid() AND ca.status = 'active'
        )
    );

-- Deadlines for assigned clients
CREATE POLICY "cm_see_assigned_deadlines" ON deadlines
    FOR SELECT
    USING (
        user_id IN (
            SELECT ca.citizen_id FROM case_assignments ca
            JOIN users u ON ca.case_manager_id = u.id
            WHERE u.auth_id = auth.uid() AND ca.status = 'active'
        )
    );

-- Risk flags for assigned clients
CREATE POLICY "cm_see_assigned_risks" ON risk_flags
    FOR SELECT
    USING (
        user_id IN (
            SELECT ca.citizen_id FROM case_assignments ca
            JOIN users u ON ca.case_manager_id = u.id
            WHERE u.auth_id = auth.uid() AND ca.status = 'active'
        )
    );

-- Intake sessions for assigned clients
CREATE POLICY "cm_see_assigned_sessions" ON intake_sessions
    FOR SELECT
    USING (
        user_id IN (
            SELECT ca.citizen_id FROM case_assignments ca
            JOIN users u ON ca.case_manager_id = u.id
            WHERE u.auth_id = auth.uid() AND ca.status = 'active'
        )
    );

-- Voice transcripts for assigned clients
CREATE POLICY "cm_see_assigned_transcripts" ON voice_transcripts
    FOR SELECT
    USING (
        user_id IN (
            SELECT ca.citizen_id FROM case_assignments ca
            JOIN users u ON ca.case_manager_id = u.id
            WHERE u.auth_id = auth.uid() AND ca.status = 'active'
        )
    );
