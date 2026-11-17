ALTER TABLE scholarship_documents
    ADD COLUMN IF NOT EXISTS storage_bucket TEXT DEFAULT 'scholarship-documents',
    ADD COLUMN IF NOT EXISTS storage_path TEXT;

UPDATE scholarship_documents
SET storage_bucket = 'scholarship-documents'
WHERE storage_bucket IS NULL;

ALTER TABLE scholarship_documents
    ALTER COLUMN storage_bucket SET DEFAULT 'scholarship-documents',
    ALTER COLUMN storage_bucket SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS scholarship_documents_storage_object_idx
    ON scholarship_documents (storage_bucket, storage_path)
    WHERE storage_path IS NOT NULL;

ALTER TABLE scholarship_documents
    DROP COLUMN IF EXISTS cloudinary_public_id,
    DROP COLUMN IF EXISTS cloudinary_secure_url;

ALTER TABLE scholarships
    DROP COLUMN IF EXISTS document_url;

INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'scholarship-documents',
    'scholarship-documents',
    FALSE,
    524288,
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    public = FALSE,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
