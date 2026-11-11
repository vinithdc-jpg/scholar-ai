CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(32) NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check
        CHECK (role IN ('student', 'content_admin', 'super_admin'))
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'users'
          AND column_name = 'name'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'users'
          AND column_name = 'full_name'
    ) THEN
        ALTER TABLE users RENAME COLUMN name TO full_name;
    END IF;
END
$$;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS role VARCHAR(32) NOT NULL DEFAULT 'student',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT users_role_check
            CHECK (role IN ('student', 'content_admin', 'super_admin'));
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS student_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth DATE,
    state VARCHAR(120),
    district VARCHAR(120),
    category VARCHAR(80),
    gender VARCHAR(80),
    education_level VARCHAR(120),
    course VARCHAR(255),
    institution VARCHAR(255),
    academic_year VARCHAR(32),
    family_income NUMERIC(14, 2),
    percentage NUMERIC(5, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT student_profiles_family_income_check
        CHECK (family_income IS NULL OR family_income >= 0),
    CONSTRAINT student_profiles_percentage_check
        CHECK (percentage IS NULL OR percentage BETWEEN 0 AND 100)
);

CREATE TABLE IF NOT EXISTS scholarships (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    scholarship_type VARCHAR(120),
    education_levels TEXT[] NOT NULL DEFAULT '{}',
    eligible_courses TEXT[] NOT NULL DEFAULT '{}',
    eligible_states TEXT[] NOT NULL DEFAULT '{}',
    benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
    amount NUMERIC(14, 2),
    income_limit NUMERIC(14, 2),
    application_start_date DATE,
    application_deadline DATE,
    official_application_url TEXT,
    official_source_url TEXT,
    academic_year VARCHAR(32),
    verification_status VARCHAR(32) NOT NULL DEFAULT 'pending',
    status VARCHAR(32) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT scholarships_amount_check CHECK (amount IS NULL OR amount >= 0),
    CONSTRAINT scholarships_income_limit_check
        CHECK (income_limit IS NULL OR income_limit >= 0),
    CONSTRAINT scholarships_verification_status_check
        CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    CONSTRAINT scholarships_status_check
        CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE TABLE IF NOT EXISTS scholarship_eligibility (
    id BIGSERIAL PRIMARY KEY,
    scholarship_id BIGINT NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
    rule_field VARCHAR(120) NOT NULL,
    operator VARCHAR(32) NOT NULL,
    expected_value JSONB NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT scholarship_eligibility_operator_check
        CHECK (operator IN (
            'equals', 'not_equals', 'greater_than',
            'greater_than_or_equal', 'less_than',
            'less_than_or_equal', 'in', 'not_in'
        ))
);

CREATE TABLE IF NOT EXISTS scholarship_documents (
    id BIGSERIAL PRIMARY KEY,
    scholarship_id BIGINT REFERENCES scholarships(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(120) NOT NULL,
    cloudinary_public_id TEXT NOT NULL UNIQUE,
    cloudinary_secure_url TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    file_size BIGINT NOT NULL,
    page_count INTEGER,
    source_url TEXT,
    academic_year VARCHAR(32),
    version INTEGER NOT NULL DEFAULT 1,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'pending',
    processing_status VARCHAR(32) NOT NULL DEFAULT 'pending',
    uploaded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT scholarship_documents_file_size_check CHECK (file_size > 0),
    CONSTRAINT scholarship_documents_page_count_check
        CHECK (page_count IS NULL OR page_count > 0),
    CONSTRAINT scholarship_documents_version_check CHECK (version > 0),
    CONSTRAINT scholarship_documents_verification_status_check
        CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    CONSTRAINT scholarship_documents_processing_status_check
        CHECK (processing_status IN ('pending', 'queued', 'processing', 'completed', 'failed'))
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES scholarship_documents(id) ON DELETE CASCADE,
    scholarship_id BIGINT REFERENCES scholarships(id) ON DELETE SET NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector,
    page_number INTEGER,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT document_chunks_index_check CHECK (chunk_index >= 0),
    CONSTRAINT document_chunks_page_check CHECK (page_number IS NULL OR page_number > 0),
    CONSTRAINT document_chunks_document_index_unique UNIQUE (document_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS saved_scholarships (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scholarship_id BIGINT NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT saved_scholarships_user_scholarship_unique UNIQUE (user_id, scholarship_id)
);

CREATE TABLE IF NOT EXISTS applications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scholarship_id BIGINT NOT NULL REFERENCES scholarships(id) ON DELETE RESTRICT,
    status VARCHAR(32) NOT NULL DEFAULT 'not_started',
    student_notes TEXT,
    applied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT applications_status_check
        CHECK (status IN (
            'not_started', 'in_progress', 'submitted',
            'under_review', 'approved', 'rejected', 'withdrawn'
        )),
    CONSTRAINT applications_user_scholarship_unique UNIQUE (user_id, scholarship_id)
);

CREATE TABLE IF NOT EXISTS application_status_history (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    previous_status VARCHAR(32),
    new_status VARCHAR(32) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'New conversation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(16) NOT NULL,
    content TEXT NOT NULL,
    citations JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chat_messages_role_check CHECK (role IN ('user', 'assistant', 'system'))
);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(80) NOT NULL,
    read_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ingestion_jobs (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES scholarship_documents(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'queued',
    progress SMALLINT NOT NULL DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ingestion_jobs_status_check
        CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
    CONSTRAINT ingestion_jobs_progress_check CHECK (progress BETWEEN 0 AND 100)
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(120) NOT NULL,
    entity_type VARCHAR(120) NOT NULL,
    entity_id VARCHAR(255),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS student_profiles_state_district_idx
    ON student_profiles (state, district);
CREATE INDEX IF NOT EXISTS scholarships_status_deadline_idx
    ON scholarships (status, application_deadline);
CREATE INDEX IF NOT EXISTS scholarships_verification_status_idx
    ON scholarships (verification_status, status);
CREATE INDEX IF NOT EXISTS scholarship_eligibility_scholarship_idx
    ON scholarship_eligibility (scholarship_id);
CREATE INDEX IF NOT EXISTS scholarship_documents_scholarship_idx
    ON scholarship_documents (scholarship_id);
CREATE INDEX IF NOT EXISTS scholarship_documents_processing_idx
    ON scholarship_documents (processing_status);
CREATE INDEX IF NOT EXISTS document_chunks_scholarship_idx
    ON document_chunks (scholarship_id);
CREATE INDEX IF NOT EXISTS saved_scholarships_user_created_idx
    ON saved_scholarships (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS applications_user_status_idx
    ON applications (user_id, status);
CREATE INDEX IF NOT EXISTS application_status_history_application_idx
    ON application_status_history (application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS chat_sessions_user_updated_idx
    ON chat_sessions (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS chat_messages_session_created_idx
    ON chat_messages (session_id, created_at);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
    ON notifications (user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS ingestion_jobs_status_created_idx
    ON ingestion_jobs (status, created_at);
CREATE INDEX IF NOT EXISTS admin_audit_logs_admin_created_idx
    ON admin_audit_logs (admin_user_id, created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER student_profiles_set_updated_at
    BEFORE UPDATE ON student_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER scholarships_set_updated_at
    BEFORE UPDATE ON scholarships
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER scholarship_documents_set_updated_at
    BEFORE UPDATE ON scholarship_documents
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER applications_set_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER chat_sessions_set_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
