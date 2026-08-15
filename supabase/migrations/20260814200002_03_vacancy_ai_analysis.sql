-- ==========================================
-- PHASE 5B: VACANCY AI ANALYSIS SCHEMA
-- ==========================================

-- AI Vacancy Analysis Table
CREATE TABLE IF NOT EXISTS public.vacancy_ai_analysis (
    id uuid DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    vacancy_id text NOT NULL, -- references vacancies via text currently in MVP
    model_provider text NOT NULL,
    model_name text NOT NULL,
    analysis_version text NOT NULL,
    
    -- Structured AI output
    normalized_skills jsonb NOT NULL DEFAULT '[]',
    mandatory_skills jsonb NOT NULL DEFAULT '[]',
    preferred_skills jsonb NOT NULL DEFAULT '[]',
    minimum_experience int NOT NULL DEFAULT 0,
    maximum_experience int,
    education_requirements jsonb NOT NULL DEFAULT '[]',
    language_requirements jsonb NOT NULL DEFAULT '[]',
    role_category text NOT NULL,
    seniority_level text NOT NULL,
    employment_type text NOT NULL,
    location_requirements text NOT NULL,
    inferred_requirements jsonb NOT NULL DEFAULT '[]',
    responsibilities jsonb NOT NULL DEFAULT '[]',
    key_requirements_summary text NOT NULL,
    
    source_hash text NOT NULL,
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(vacancy_id, analysis_version)
);

-- AI Vacancy Embeddings Table
-- Dimension: 768 to rigidly support Gemini Embedding-2
CREATE TABLE IF NOT EXISTS public.vacancy_embeddings (
    id uuid DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    vacancy_id text NOT NULL,
    model_provider text NOT NULL,
    model_name text NOT NULL,
    embedding_dimension int NOT NULL DEFAULT 768,
    
    embedding vector(768) NOT NULL,
    source_hash text NOT NULL,
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(vacancy_id, model_name, source_hash)
);

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at_vacancy_analysis BEFORE UPDATE ON public.vacancy_ai_analysis
    FOR EACH ROW EXECUTE PROCEDURE public.moddatetime (updated_at);

CREATE TRIGGER handle_updated_at_vacancy_embeddings BEFORE UPDATE ON public.vacancy_embeddings
    FOR EACH ROW EXECUTE PROCEDURE public.moddatetime (updated_at);

-- RLS Settings
ALTER TABLE public.vacancy_ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacancy_embeddings ENABLE ROW LEVEL SECURITY;

-- Note: In this MVP testing environment, AI pipelines run via Service Role which bypasses RLS natively.
-- Employer read-access policies can be configured subsequently.
CREATE POLICY "Employers read their own vacancy analysis"
    ON public.vacancy_ai_analysis FOR SELECT
    USING (true); -- Public read for matching MVP

CREATE POLICY "Employers read their own vacancy embeddings"
    ON public.vacancy_embeddings FOR SELECT
    USING (true); -- Public read for matching MVP
