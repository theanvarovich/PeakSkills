-- PeakSkills PostgreSQL Schema (Uzbekistan Demo Data Scope)
-- Managed via Supabase Postgres

CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE, -- References auth.users
    name VARCHAR(255) NOT NULL,
    candidate_type VARCHAR(50) DEFAULT 'professional', -- student, professional
    headline VARCHAR(255),
    bio TEXT,
    location VARCHAR(255), -- Tashkent, Samarkand, etc.
    availability VARCHAR(100),
    expected_salary_usd INTEGER,
    profile_completion INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100), -- IT, Telecom, FinTech, Retail
    size VARCHAR(50),
    website VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vacancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID REFERENCES employers(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    employment_type VARCHAR(100), -- Full-time, Internship
    experience_min_years INTEGER DEFAULT 0,
    experience_max_years INTEGER,
    salary_min_usd INTEGER,
    salary_max_usd INTEGER,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidate_education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id),
    institution VARCHAR(255), -- WIUT, TUIT, IUT, etc.
    degree VARCHAR(100),
    field_of_study VARCHAR(255),
    gpa DECIMAL(3,2),
    graduation_year INTEGER
);

CREATE TABLE IF NOT EXISTS candidate_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id),
    language VARCHAR(50), -- Uzbek, Russian, English
    level VARCHAR(50), -- Native, IELTS 7.5, CEFR B2
    certification VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vacancy_id UUID REFERENCES vacancies(id),
    candidate_id UUID REFERENCES candidates(id),
    match_score DECIMAL(5,2),
    skill_score DECIMAL(5,2),
    experience_score DECIMAL(5,2),
    education_score DECIMAL(5,2),
    language_score DECIMAL(5,2),
    semantic_score DECIMAL(5,2),
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
