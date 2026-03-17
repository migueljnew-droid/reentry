-- REENTRY: Initial Database Schema
-- Handles: Users, Action Plans, Benefits, Employment, Deadlines, Risk Flags, Audit Log

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- USERS
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE,                -- Supabase Auth UID
    phone TEXT,
    email TEXT,
    full_name TEXT NOT NULL,
    state_of_release TEXT NOT NULL,
    conviction_type TEXT NOT NULL,
    release_date DATE,
    release_facility TEXT,
    family_situation JSONB DEFAULT '{}',
    skills JSONB DEFAULT '{}',
    immediate_needs TEXT[] DEFAULT '{}',
    supervision_terms JSONB DEFAULT '{}',
    language_preference TEXT DEFAULT 'en',
    role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'case_manager', 'admin')),
    onboarding_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_state ON users(state_of_release);
CREATE INDEX idx_users_role ON users(role);

-- ==========================================
-- ACTION PLANS
-- ==========================================
CREATE TABLE action_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    state TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    plan_data JSONB NOT NULL DEFAULT '{}',
    generated_at TIMESTAMPTZ DEFAULT now(),
    last_synced TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_plans_user ON action_plans(user_id);
CREATE INDEX idx_plans_status ON action_plans(status);

-- ==========================================
-- PLAN STEPS
-- ==========================================
CREATE TABLE plan_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES action_plans(id) ON DELETE CASCADE,
    phase TEXT NOT NULL CHECK (phase IN ('immediate', 'week_1', 'month_1', 'ongoing')),
    category TEXT NOT NULL CHECK (category IN ('id', 'benefits', 'housing', 'employment', 'legal', 'supervision', 'healthcare', 'education', 'family')),
    title TEXT NOT NULL,
    description TEXT,
    instructions JSONB DEFAULT '[]',
    documents_needed TEXT[] DEFAULT '{}',
    deadline DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    completed_at TIMESTAMPTZ,
    priority INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_steps_plan ON plan_steps(plan_id);
CREATE INDEX idx_steps_status ON plan_steps(status);
CREATE INDEX idx_steps_phase ON plan_steps(phase);

-- ==========================================
-- BENEFITS SCREENINGS
-- ==========================================
CREATE TABLE benefits_screenings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_name TEXT NOT NULL,
    program_type TEXT NOT NULL,
    eligible BOOLEAN,
    confidence REAL DEFAULT 0.0,
    requirements_met JSONB DEFAULT '[]',
    requirements_missing JSONB DEFAULT '[]',
    application_url TEXT,
    notes TEXT,
    screened_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_screenings_user ON benefits_screenings(user_id);

-- ==========================================
-- EMPLOYMENT MATCHES
-- ==========================================
CREATE TABLE employment_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employer_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    location TEXT,
    salary_range TEXT,
    conviction_friendly BOOLEAN DEFAULT true,
    conviction_restrictions TEXT[] DEFAULT '{}',
    match_score REAL DEFAULT 0.0,
    skills_matched TEXT[] DEFAULT '{}',
    application_url TEXT,
    status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'saved', 'applied', 'interviewing', 'hired', 'declined')),
    matched_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_matches_user ON employment_matches(user_id);
CREATE INDEX idx_matches_status ON employment_matches(status);

-- ==========================================
-- DEADLINES
-- ==========================================
CREATE TABLE deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_step_id UUID REFERENCES plan_steps(id),
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    category TEXT NOT NULL,
    reminder_days INTEGER[] DEFAULT '{30,14,7,3,1}',
    notified_at TIMESTAMPTZ[] DEFAULT '{}',
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'notified', 'completed', 'overdue')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_deadlines_user ON deadlines(user_id);
CREATE INDEX idx_deadlines_due ON deadlines(due_date);
CREATE INDEX idx_deadlines_status ON deadlines(status);

-- ==========================================
-- CASE ASSIGNMENTS
-- ==========================================
CREATE TABLE case_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_manager_id UUID NOT NULL REFERENCES users(id),
    citizen_id UUID NOT NULL REFERENCES users(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    notes TEXT,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(case_manager_id, citizen_id)
);

CREATE INDEX idx_assignments_cm ON case_assignments(case_manager_id);
CREATE INDEX idx_assignments_citizen ON case_assignments(citizen_id);

-- ==========================================
-- RISK FLAGS
-- ==========================================
CREATE TABLE risk_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flag_type TEXT NOT NULL CHECK (flag_type IN ('missed_checkin', 'benefits_lapse', 'housing_loss', 'employment_gap', 'court_date_missed', 'supervision_violation')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_risks_user ON risk_flags(user_id);
CREATE INDEX idx_risks_severity ON risk_flags(severity);
CREATE INDEX idx_risks_resolved ON risk_flags(resolved);

-- ==========================================
-- INTAKE SESSIONS
-- ==========================================
CREATE TABLE intake_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    stage TEXT DEFAULT 'welcome',
    responses JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- ==========================================
-- VOICE TRANSCRIPTS
-- ==========================================
CREATE TABLE voice_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_id UUID NOT NULL REFERENCES intake_sessions(id),
    transcript TEXT NOT NULL,
    language TEXT DEFAULT 'en',
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- AUDIT LOG (CJIS Compliance)
-- ==========================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    actor_id UUID,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefits_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_transcripts ENABLE ROW LEVEL SECURITY;

-- Citizens see their own data
CREATE POLICY "users_own_data" ON users FOR ALL
    USING (auth_id = auth.uid());

CREATE POLICY "users_own_plans" ON action_plans FOR ALL
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "users_own_steps" ON plan_steps FOR ALL
    USING (plan_id IN (
        SELECT ap.id FROM action_plans ap
        JOIN users u ON ap.user_id = u.id
        WHERE u.auth_id = auth.uid()
    ));

CREATE POLICY "users_own_screenings" ON benefits_screenings FOR ALL
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "users_own_matches" ON employment_matches FOR ALL
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "users_own_deadlines" ON deadlines FOR ALL
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "users_own_risks" ON risk_flags FOR ALL
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "users_own_sessions" ON intake_sessions FOR ALL
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "users_own_transcripts" ON voice_transcripts FOR ALL
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Case managers see assigned clients
CREATE POLICY "cm_see_assigned_users" ON users FOR SELECT
    USING (
        id IN (
            SELECT citizen_id FROM case_assignments
            WHERE case_manager_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
            AND status = 'active'
        )
    );

CREATE POLICY "cm_see_assigned_plans" ON action_plans FOR SELECT
    USING (
        user_id IN (
            SELECT citizen_id FROM case_assignments
            WHERE case_manager_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
            AND status = 'active'
        )
    );

CREATE POLICY "cm_assignments" ON case_assignments FOR ALL
    USING (
        case_manager_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
