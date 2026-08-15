-- ==========================================
-- PHASE 5A: AI CANDIDATE ANALYSIS & EMBEDDINGS
-- ==========================================

-- Enable pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Candidate AI Analysis 
CREATE TABLE public.candidate_ai_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    model_provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    analysis_version TEXT NOT NULL,
    normalized_skills TEXT[] DEFAULT '{}',
    inferred_skills TEXT[] DEFAULT '{}',
    experience_summary TEXT,
    career_domains TEXT[] DEFAULT '{}',
    seniority_level TEXT,
    strengths TEXT[] DEFAULT '{}',
    skill_gaps TEXT[] DEFAULT '{}',
    professional_summary TEXT,
    recommended_roles TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (candidate_id, analysis_version)
);

CREATE TRIGGER update_candidate_ai_analysis_updated_at
BEFORE UPDATE ON public.candidate_ai_analysis
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 2. Versioned Candidate Embeddings
CREATE TABLE public.candidate_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    model_provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    embedding_dimension INTEGER NOT NULL,
    source_hash TEXT NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (candidate_id, model_name, source_hash)
);

CREATE TRIGGER update_candidate_embeddings_updated_at
BEFORE UPDATE ON public.candidate_embeddings
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.candidate_ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_embeddings ENABLE ROW LEVEL SECURITY;

-- AI Profiles are viewable by employers or the candidate owner
CREATE POLICY "Authenticated users can view candidate AI analysis" 
ON public.candidate_ai_analysis FOR SELECT 
USING (auth.role() = 'authenticated');

-- Embeddings are generally back-end utilized. Allowing authenticated fetch just in case.
CREATE POLICY "Authenticated users can view candidate embeddings" 
ON public.candidate_embeddings FOR SELECT 
USING (auth.role() = 'authenticated');

-- Submissions/Updates are strictly controlled by the Service Role or specific authenticated candidate owners.
CREATE POLICY "Candidates manage their own AI analysis" 
ON public.candidate_ai_analysis FOR ALL 
USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates manage their own embeddings" 
ON public.candidate_embeddings FOR ALL 
USING (auth.uid() = candidate_id);

-- Create Indexes for fast querying
CREATE INDEX idx_candidate_ai_analysis_candidate ON public.candidate_ai_analysis(candidate_id);
CREATE INDEX idx_candidate_embeddings_candidate ON public.candidate_embeddings(candidate_id);
