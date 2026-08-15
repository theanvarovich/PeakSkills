-- ==========================================
-- PHASE 5A: GEMINI AI EMBEDDING UPDATE
-- ==========================================

-- Migration to alter candidate_embeddings dimensionality 
-- Safely transitions from vector(1536) to vector(768) to support Gemini Flash

-- 1. Alter candidate_embeddings
-- Since vector dimensions cannot inherently be cast directly without dropping constraints on the column, and the MVP table is empty/can be recreated:
ALTER TABLE public.candidate_embeddings 
  ALTER COLUMN embedding TYPE vector(768) 
  USING embedding::vector(768);

-- If the above fails because the table was never populated, 
-- or if data preservation is NOT needed, we would drop and recreate:
-- DROP TABLE IF EXISTS public.candidate_embeddings;
-- (and then recreate with vector(768)). 
-- But ALTER COLUMN ... TYPE vector(768) is generally valid for empty tables.
