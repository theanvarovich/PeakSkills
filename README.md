# PeakSkills

> AI-powered talent intelligence platform connecting candidates with the right career opportunities.

PeakSkills is an AI-powered talent intelligence platform designed to help employers discover relevant candidates and help candidates find opportunities that match their skills, experience, education, and career goals.

The platform is initially designed for the Uzbekistan market, with support for local universities, employers, languages, salary expectations, and career pathways.

---

## Problem

Traditional recruitment platforms primarily rely on keyword-based search and manual CV screening.

This creates several problems:

- Employers spend significant time reviewing unsuitable candidates.
- Qualified candidates can be overlooked because their CV does not contain the exact keywords used in a vacancy.
- Students and early-career professionals struggle to identify suitable opportunities.
- Candidate and vacancy information is often unstructured and difficult to compare.
- Recruitment decisions lack transparent and structured matching criteria.

PeakSkills addresses these challenges by combining structured candidate intelligence, vacancy analysis, deterministic matching, and semantic AI technologies.

---

## Solution

PeakSkills transforms both candidate profiles and job vacancies into structured intelligence and evaluates their compatibility.

### Candidate

Candidate Profile  
→ AI Analysis  
→ Skills and Experience Normalization  
→ Embedding  
→ Opportunity Matching

### Employer

Vacancy  
→ AI Vacancy Analysis  
→ Mandatory and Preferred Requirements  
→ Embedding  
→ Candidate Matching

The long-term goal is to provide employers with ranked candidates while giving candidates personalized career opportunities.

---

## Core Features

### Candidate Profiles

Candidates can create structured profiles containing:

- Personal information
- Professional headline
- Skills
- Experience
- Education
- Universities
- Languages
- Certifications
- Career preferences
- Salary expectations
- Academic achievements

The platform supports both students and working professionals.

### Employer Platform

Employers can:

- Create company profiles
- Publish vacancies
- Define mandatory requirements
- Define preferred requirements
- Specify experience requirements
- Specify education requirements
- Specify language requirements
- Review matched candidates

### AI Candidate Analysis

PeakSkills uses Google's Gemini models to analyze candidate information and transform unstructured data into structured intelligence.

The AI pipeline can identify:

- Normalized skills
- Inferred skills
- Experience information
- Strengths
- Skill gaps
- Career domains
- Recommended roles
- Candidate summaries

AI output is validated through strict Zod schemas before being persisted.

### AI Vacancy Analysis

Job descriptions are analyzed to identify:

- Mandatory skills
- Preferred skills
- Experience requirements
- Education requirements
- Language requirements
- Role category
- Seniority level
- Responsibilities
- Inferred requirements

The system explicitly separates mandatory requirements from preferred requirements.

AI is not allowed to override explicit hard requirements.

---

## Matching Architecture

PeakSkills is designed around a hybrid matching architecture combining:

1. Deterministic eligibility rules
2. Structured candidate and vacancy intelligence
3. Semantic embeddings
4. Weighted scoring

The current deterministic scoring model evaluates:

| Dimension | Weight |
|---|---:|
| Skills | 35% |
| Experience | 20% |
| Education | 15% |
| Language | 10% |
| Academic | 10% |
| Semantic | 10% |

Hard requirements remain authoritative.

For example, if a vacancy requires three or more years of experience and a candidate has only one year, semantic similarity cannot override that requirement.

---

## Semantic Intelligence

PeakSkills uses Google's Gemini embedding infrastructure.

Current embedding model:

`gemini-embedding-2`

Current vector dimension:

`768`

Candidate and vacancy embeddings are stored in PostgreSQL using pgvector.

Embeddings are cached using source hashes to avoid unnecessary API calls.

---

## Data Architecture

PeakSkills uses:

- Next.js
- TypeScript
- Supabase
- PostgreSQL
- pgvector
- Supabase Auth
- Row Level Security
- Zod
- Google Gemini

The application follows a layered architecture:

```text
UI
 ↓
Services
 ↓
Repository Interfaces
 ↓
Supabase Repository
 ↓
PostgreSQL
