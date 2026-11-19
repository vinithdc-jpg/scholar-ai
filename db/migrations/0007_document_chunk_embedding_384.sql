-- Update document_chunks.embedding to 384 dimensions for Xenova/multilingual-e5-small
DO $$
DECLARE
  current_type text;
BEGIN
  SELECT format_type(atttypid, atttypmod)
  INTO current_type
  FROM pg_attribute
  WHERE attrelid = 'document_chunks'::regclass
    AND attname = 'embedding'
    AND NOT attisdropped;

  IF current_type IS NULL THEN
    RAISE EXCEPTION 'document_chunks.embedding column is missing.';
  ELSIF current_type IS DISTINCT FROM 'vector(384)' THEN
    DROP INDEX IF EXISTS document_chunks_embedding_hnsw_idx;

    ALTER TABLE document_chunks
      ALTER COLUMN embedding TYPE vector(384)
      USING (
        CASE
          WHEN embedding IS NULL THEN NULL
          ELSE NULL::vector(384)
        END
      );

    CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx
      ON document_chunks
      USING hnsw (embedding vector_cosine_ops);
  END IF;
END
$$;
