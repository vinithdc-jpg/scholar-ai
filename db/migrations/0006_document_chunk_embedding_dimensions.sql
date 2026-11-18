-- Constrain document_chunks.embedding to the configured Qwen embedding size.
-- The live column is unbounded `vector`; this does not drop rows.
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
  ELSIF current_type = 'vector' THEN
    ALTER TABLE document_chunks
      ALTER COLUMN embedding TYPE vector(1024)
      USING embedding::vector(1024);
  ELSIF current_type IS DISTINCT FROM 'vector(1024)' THEN
    RAISE EXCEPTION
      'document_chunks.embedding type % does not match the 1024-dimension embedding model',
      current_type;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx
  ON document_chunks
  USING hnsw (embedding vector_cosine_ops);
