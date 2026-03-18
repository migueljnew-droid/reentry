-- REENTRY: Security Enhancements (CJIS Compliance)
-- PHASE-002: SHARD-005 (Consent + Retention) + SHARD-007 (Audit Enhancements)

-- ==========================================
-- USER CONSENTS (SHARD-005)
-- Tracks explicit user consent for data processing, AI recording, third-party sharing
-- ==========================================
CREATE TABLE user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL CHECK (consent_type IN ('data_processing', 'ai_recording', 'third_party_sharing')),
    granted_at TIMESTAMPTZ DEFAULT now(),
    revoked_at TIMESTAMPTZ,
    ip_address INET,
    UNIQUE(user_id, consent_type)
);

CREATE INDEX idx_consents_user ON user_consents(user_id);
CREATE INDEX idx_consents_type ON user_consents(consent_type);

ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own consents
CREATE POLICY "users_own_consents" ON user_consents
    FOR ALL
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Case managers can view assigned client consents (read-only)
CREATE POLICY "cm_see_assigned_consents" ON user_consents
    FOR SELECT
    USING (
        user_id IN (
            SELECT ca.citizen_id FROM case_assignments ca
            JOIN users u ON ca.case_manager_id = u.id
            WHERE u.auth_id = auth.uid() AND ca.status = 'active'
        )
    );

-- ==========================================
-- VOICE TRANSCRIPT RETENTION (SHARD-005)
-- Auto-expire transcripts after 90 days per CJIS requirements
-- ==========================================
ALTER TABLE voice_transcripts ADD COLUMN IF NOT EXISTS retention_until TIMESTAMPTZ DEFAULT (now() + INTERVAL '90 days');

-- ==========================================
-- SOFT DELETE COLUMNS (SHARD-005)
-- Enable soft deletes for data recovery and compliance auditing
-- ==========================================
ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

ALTER TABLE plan_steps ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE benefits_screenings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE employment_matches ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ==========================================
-- AUDIT LOG ENHANCEMENTS (SHARD-007)
-- Add request metadata for CJIS-compliant audit trail
-- ==========================================
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS session_id UUID;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS request_method TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS request_path TEXT;

-- Index for audit log queries by path and method
CREATE INDEX IF NOT EXISTS idx_audit_path ON audit_log(request_path);
CREATE INDEX IF NOT EXISTS idx_audit_method ON audit_log(request_method);
CREATE INDEX IF NOT EXISTS idx_audit_session ON audit_log(session_id);
