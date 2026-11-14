ALTER TABLE scholarships
    ADD COLUMN IF NOT EXISTS submitted_by BIGINT
    REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS scholarships_submitted_by_idx
    ON scholarships (submitted_by) WHERE submitted_by IS NOT NULL;