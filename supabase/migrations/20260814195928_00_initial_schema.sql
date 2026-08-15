-- ==========================================
-- PEAKSKILLS SCHEMA & SECURITY HARDENING
-- Phase 4B
-- ==========================================

-- Enable requisite extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- ENUMS
-- ==========================================
CREATE TYPE candidate_type_enum AS ENUM ('student', 'professional');
CREATE TYPE vacancy_status_enum AS ENUM ('draft', 'published', 'closed');

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================
-- 1. PROFILES & ROLES
-- ==========================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('candidate', 'employer', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- 2. EMPLOYERS
-- ==========================================
CREATE TABLE public.employers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    industry TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    website TEXT,
    company_size TEXT,
    logo_url TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_employers_updated_at
BEFORE UPDATE ON public.employers
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- 3. CANDIDATE SCHEMA
-- ==========================================
-- PUBLIC Candidate Profile (Safe for authenticated recruitment flows)
CREATE TABLE public.candidates (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    candidate_type candidate_type_enum NOT NULL,
    location TEXT NOT NULL,
    headline TEXT NOT NULL,
    bio TEXT,
    cv_summary TEXT NOT NULL,
    expected_salary_usd INTEGER CHECK (expected_salary_usd >= 0),
    experience_years INTEGER NOT NULL DEFAULT 0 CHECK (experience_years >= 0 AND experience_years <= 60),
    preferred_roles TEXT[] DEFAULT '{}',
    achievements TEXT[] DEFAULT '{}',
    -- Student Specific Matching Ready
    is_exchange_ready BOOLEAN DEFAULT FALSE,
    is_sponsorship_ready BOOLEAN DEFAULT FALSE,
    is_internship_ready BOOLEAN DEFAULT FALSE,
    academic_achievements TEXT[] DEFAULT '{}',
    -- Professional Specific
    current_position TEXT,
    current_company TEXT,
    career_achievements TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- PRIVATE Candidate Details (Contact info, private CVs)
CREATE TABLE public.candidate_private_details (
    candidate_id UUID PRIMARY KEY REFERENCES public.candidates(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    phone TEXT,
    cv_document_url TEXT,
    private_notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_candidate_private_details_updated_at
BEFORE UPDATE ON public.candidate_private_details
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- EDUCATIONAL BACKGROUND
CREATE TABLE public.universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    tier INTEGER NOT NULL CHECK (tier IN (1, 2, 3)),
    type TEXT NOT NULL CHECK (type IN ('international', 'national', 'regional'))
);

CREATE TABLE public.candidate_education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
    institution_override TEXT, 
    degree TEXT NOT NULL,
    field_of_study TEXT NOT NULL,
    gpa TEXT,
    gpa_numeric NUMERIC(3,2) CHECK (gpa_numeric >= 0.0 AND gpa_numeric <= 5.0),
    academic_year TEXT,
    graduation_year INTEGER CHECK (graduation_year >= 1950 AND graduation_year <= 2100),
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXPERIENCE
CREATE TABLE public.candidate_experience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    years INTEGER NOT NULL CHECK (years >= 0),
    description TEXT NOT NULL,
    skills_used TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LANGUAGES
CREATE TABLE public.candidate_languages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    level TEXT NOT NULL, -- e.g. Native, B2, C1
    certification TEXT, -- e.g. IELTS, CEFR
    score TEXT -- e.g. 7.5
);

-- CERTIFICATIONS
CREATE TABLE public.candidate_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    issuer TEXT,
    year INTEGER CHECK (year >= 1950 AND year <= 2100)
);

-- ==========================================
-- 4. VACANCIES (EMPLOYER POSTINGS)
-- ==========================================
CREATE TABLE public.vacancies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL REFERENCES public.employers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    employment_type TEXT NOT NULL,
    salary_min_usd INTEGER DEFAULT 0 CHECK (salary_min_usd >= 0),
    salary_max_usd INTEGER DEFAULT 0 CHECK (salary_max_usd >= salary_min_usd),
    currency TEXT DEFAULT 'USD',
    experience_min_years INTEGER NOT NULL DEFAULT 0 CHECK (experience_min_years >= 0),
    education_field TEXT,
    status vacancy_status_enum DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_vacancies_updated_at
BEFORE UPDATE ON public.vacancies
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE public.vacancy_requirements (
    vacancy_id UUID PRIMARY KEY REFERENCES public.vacancies(id) ON DELETE CASCADE,
    mandatory_languages TEXT[] DEFAULT '{}',
    mandatory_education TEXT[] DEFAULT '{}'
);

-- ==========================================
-- 5. SKILLS (MAPPING)
-- ==========================================
CREATE TABLE public.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    category TEXT
);

CREATE TABLE public.candidate_skills (
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    PRIMARY KEY (candidate_id, skill_id)
);

CREATE TABLE public.vacancy_skills (
    vacancy_id UUID NOT NULL REFERENCES public.vacancies(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    is_mandatory BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (vacancy_id, skill_id)
);

-- ==========================================
-- 6. MATCHES
-- ==========================================
CREATE TABLE public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    vacancy_id UUID NOT NULL REFERENCES public.vacancies(id) ON DELETE CASCADE,
    overall_score NUMERIC(5,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    skills_score NUMERIC(5,2) NOT NULL CHECK (skills_score >= 0 AND skills_score <= 100),
    experience_score NUMERIC(5,2) NOT NULL CHECK (experience_score >= 0 AND experience_score <= 100),
    education_score NUMERIC(5,2) NOT NULL CHECK (education_score >= 0 AND education_score <= 100),
    language_score NUMERIC(5,2) NOT NULL CHECK (language_score >= 0 AND language_score <= 100),
    academic_score NUMERIC(5,2) NOT NULL CHECK (academic_score >= 0 AND academic_score <= 100),
    semantic_score NUMERIC(5,2) NOT NULL CHECK (semantic_score >= 0 AND semantic_score <= 100),
    match_tier TEXT NOT NULL,
    matched_requirements TEXT[] DEFAULT '{}',
    missing_mandatory_requirements TEXT[] DEFAULT '{}',
    missing_preferred_requirements TEXT[] DEFAULT '{}',
    explanation_summary TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(candidate_id, vacancy_id)
);

CREATE TRIGGER update_matches_updated_at
BEFORE UPDATE ON public.matches
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_private_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacancy_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacancy_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;


-- 1. USER ROLES
-- Only candidates/employers can read their own roles. Admins assigned by Server.
CREATE POLICY "Users can read their own role" ON public.user_roles FOR SELECT USING (auth.uid() = id);
-- Insertion handled strictly by highly-trusted Server Triggers / service_role flows. No direct INSERT policies for users.

-- 2. EMPLOYERS
CREATE POLICY "Anyone authenticated can view employers" ON public.employers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Employers update their own" ON public.employers FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Employers insert their own" ON public.employers FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. CANDIDATES (Public Info)
-- Authenticated Users ONLY. No anonymous scraping.
CREATE POLICY "Authenticated users view candidate profiles" ON public.candidates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Candidates update their own profile" ON public.candidates FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Candidates insert their own profile" ON public.candidates FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. CANDIDATES (Private Info)
-- Strict isolation.
CREATE POLICY "Candidates view their own private details" ON public.candidate_private_details FOR SELECT USING (auth.uid() = candidate_id);
CREATE POLICY "Candidates update their own private details" ON public.candidate_private_details FOR UPDATE USING (auth.uid() = candidate_id);
CREATE POLICY "Candidates insert their own private details" ON public.candidate_private_details FOR INSERT WITH CHECK (auth.uid() = candidate_id);

-- 5. CANDIDATE SUB-TABLES
CREATE POLICY "Authenticated users view education" ON public.candidate_education FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Candidates manage education" ON public.candidate_education FOR ALL USING (auth.uid() = candidate_id);

CREATE POLICY "Authenticated users view experience" ON public.candidate_experience FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Candidates manage experience" ON public.candidate_experience FOR ALL USING (auth.uid() = candidate_id);

CREATE POLICY "Authenticated users view languages" ON public.candidate_languages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Candidates manage languages" ON public.candidate_languages FOR ALL USING (auth.uid() = candidate_id);

CREATE POLICY "Authenticated users view certifications" ON public.candidate_certifications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Candidates manage certifications" ON public.candidate_certifications FOR ALL USING (auth.uid() = candidate_id);

CREATE POLICY "Authenticated users view candidate skills" ON public.candidate_skills FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Candidates manage candidate skills" ON public.candidate_skills FOR ALL USING (auth.uid() = candidate_id);

-- 6. UNIVERSITIES & DICTIONARY SKILLS
CREATE POLICY "Authenticated view universities" ON public.universities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated view skills" ON public.skills FOR SELECT USING (auth.role() = 'authenticated');

-- 7. VACANCIES & REQUIREMENTS
-- Drafts remain private. Published/Closed vacancies are readable by anyone authenticated.
CREATE POLICY "Read published vacancies or own drafts" ON public.vacancies FOR SELECT USING (
    (status IN ('published', 'closed') AND auth.role() = 'authenticated') OR 
    (auth.uid() = employer_id)
);
CREATE POLICY "Employers manage own vacancies" ON public.vacancies FOR ALL USING (auth.uid() = employer_id);

CREATE POLICY "Read published vacancy requirements" ON public.vacancy_requirements FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vacancies WHERE id = vacancy_id AND (status IN ('published', 'closed') OR employer_id = auth.uid()))
);
CREATE POLICY "Employers manage requirements" ON public.vacancy_requirements FOR ALL USING (
    EXISTS (SELECT 1 FROM public.vacancies WHERE id = vacancy_id AND employer_id = auth.uid())
);

CREATE POLICY "Read published vacancy skills" ON public.vacancy_skills FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vacancies WHERE id = vacancy_id AND (status IN ('published', 'closed') OR employer_id = auth.uid()))
);
CREATE POLICY "Employers manage vacancy skills" ON public.vacancy_skills FOR ALL USING (
    EXISTS (SELECT 1 FROM public.vacancies WHERE id = vacancy_id AND employer_id = auth.uid())
);

-- 8. MATCHES
-- Employers view their own vacancies matches, Candidates view their own matches. Anonymous cannot view.
-- NO CLIENT INSERTS/UPDATES allowed - matches are written exclusively by service_role matching backend.
CREATE POLICY "Employers read their vacancy matches" ON public.matches FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vacancies WHERE id = vacancy_id AND employer_id = auth.uid())
);
CREATE POLICY "Candidates read their own matches" ON public.matches FOR SELECT USING (auth.uid() = candidate_id);


-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX idx_vacancies_employer ON public.vacancies(employer_id);
CREATE INDEX idx_vacancies_status ON public.vacancies(status);
CREATE INDEX idx_matches_candidate ON public.matches(candidate_id);
CREATE INDEX idx_matches_vacancy ON public.matches(vacancy_id);
CREATE INDEX idx_candidate_skills_candidate ON public.candidate_skills(candidate_id);
CREATE INDEX idx_vacancy_skills_vacancy ON public.vacancy_skills(vacancy_id);
