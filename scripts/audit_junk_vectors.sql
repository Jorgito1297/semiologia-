-- ============================================================================
-- AUDITORÍA: Detección de vectores "basura" (random.uniform(-0.1, 0.1))
-- en public.content_chunks, generados por el fallback defectuoso.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DETECCIÓN POR HUELLA ESTADÍSTICA DEL RANGO UNIFORME
-- ----------------------------------------------------------------------------
WITH vector_stats AS (
  SELECT
    id, topic, source_book, source_chapter, chunk_index,
    (embedding::text)::float8[] AS emb_arr
  FROM public.content_chunks
  WHERE is_active = true AND embedding IS NOT NULL
),
stats AS (
  SELECT
    id, topic, source_book, source_chapter, chunk_index,
    (SELECT MIN(v) FROM unnest(emb_arr) v) AS min_val,
    (SELECT MAX(v) FROM unnest(emb_arr) v) AS max_val,
    (SELECT AVG(v) FROM unnest(emb_arr) v) AS mean_val,
    (SELECT STDDEV_POP(v) FROM unnest(emb_arr) v) AS stddev_val,
    array_length(emb_arr, 1) AS dims
  FROM vector_stats
)
SELECT
  id, topic, source_book, chunk_index,
  min_val, max_val, stddev_val,
  CASE
    WHEN min_val >= -0.1 AND max_val <= 0.1 AND stddev_val BETWEEN 0.045 AND 0.070
      THEN 'SOSPECHOSO_ALTA_CONFIANZA'
    WHEN min_val >= -0.1 AND max_val <= 0.1
      THEN 'SOSPECHOSO_REVISAR'
    ELSE 'OK'
  END AS diagnostico
FROM stats
ORDER BY 
  CASE 
    WHEN min_val >= -0.1 AND max_val <= 0.1 AND stddev_val BETWEEN 0.045 AND 0.070 THEN 0 
    ELSE 1 
  END;

-- ----------------------------------------------------------------------------
-- 2. CONTEO RESUMEN
-- ----------------------------------------------------------------------------
WITH stats AS (
  SELECT
    (SELECT MIN(v) FROM unnest((embedding::text)::float8[]) v) AS min_val,
    (SELECT MAX(v) FROM unnest((embedding::text)::float8[]) v) AS max_val,
    (SELECT STDDEV_POP(v) FROM unnest((embedding::text)::float8[]) v) AS stddev_val
  FROM public.content_chunks
  WHERE is_active = true AND embedding IS NOT NULL
)
SELECT
  CASE
    WHEN min_val >= -0.1 AND max_val <= 0.1 AND stddev_val BETWEEN 0.045 AND 0.070 THEN 'JUNK_VECTORS'
    ELSE 'VALID_EMBEDDINGS'
  END AS type,
  COUNT(*) as count
FROM stats
GROUP BY 1;

-- ----------------------------------------------------------------------------
-- 3. DETECCIÓN POR SIMILITUD ANÓMALA (Mismo topic, baja correlación)
-- ----------------------------------------------------------------------------
WITH flagged AS (
  SELECT id, topic, embedding
  FROM public.content_chunks
  WHERE is_active = true
)
SELECT
  f1.id AS chunk_id,
  f1.topic,
  AVG(1 - (f1.embedding <=> f2.embedding)) AS avg_similarity_same_topic
FROM flagged f1
JOIN flagged f2 ON f1.topic = f2.topic AND f1.id <> f2.id
GROUP BY f1.id, f1.topic
HAVING AVG(1 - (f1.embedding <=> f2.embedding)) < 0.05
ORDER BY 3 ASC;

-- ----------------------------------------------------------------------------
-- 4. PREPARACIÓN DE RE-INGESTA (Tabla Temporal)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS chunks_to_reingest;
CREATE TEMP TABLE chunks_to_reingest AS
SELECT id FROM (
  SELECT id,
    (SELECT MIN(v) FROM unnest((embedding::text)::float8[]) v) AS min_val,
    (SELECT MAX(v) FROM unnest((embedding::text)::float8[]) v) AS max_val,
    (SELECT STDDEV_POP(v) FROM unnest((embedding::text)::float8[]) v) AS stddev_val
  FROM public.content_chunks
  WHERE is_active = true AND embedding IS NOT NULL
) s
WHERE min_val >= -0.1 AND max_val <= 0.1 AND stddev_val BETWEEN 0.045 AND 0.070;

-- ----------------------------------------------------------------------------
-- 5. DESACTIVACIÓN DE CHUNKS AFECTADOS
-- ----------------------------------------------------------------------------
-- IMPORTANTE: Ejecutar solo después de revisar la sección 4.
-- Esto permitirá que ingest_academic_resources.py los procese de nuevo.

/*
UPDATE public.content_chunks
SET is_active = false, 
    updated_at = NOW(),
    validation_notes = 'Embedding invalidado por auditoría de vectores basura (uniform dist detectada).'
WHERE id IN (SELECT id FROM chunks_to_reingest);

-- Verificar desactivación
SELECT source_book, COUNT(*) 
FROM public.content_chunks 
WHERE is_active = false AND validation_notes LIKE '%auditoría%'
GROUP BY 1;
*/