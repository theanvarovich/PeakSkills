// ============================================================
// PEAKSKILLS — Canonical Domain Types
// Single source of truth for all business domain entities.
// Phase 2 hardened. Phase 4A extended.
// Do NOT import Supabase-generated types into this file.
// ============================================================

export type CandidateType = 'student' | 'professional';

export type MatchTier = 'Excellent Match' | 'Strong Match' | 'Potential Match' | 'Low Match';

// ─── Sub-entities ────────────────────────────────────────────

export interface Education {
  institution: string;
  degree?: string;
  field_of_study?: string;
  gpa?: string;        // String for display e.g. "3.8 / 4.0"
  gpaNumeric?: number; // Numeric for engine calculations
  graduation_year?: number;
  is_current?: boolean;
}

export interface Language {
  language: string;
  level: string; // "Native", "IELTS 7.5", "CEFR B2", "C1", etc.
  certification?: string;
}

export interface ExperienceEntry {
  company: string;
  title: string;
  years: number;
  description: string;
  skills_used?: string[];
}

export interface University {
  id: string;
  name: string;
  city: string;
  country: string;
  tier: 1 | 2 | 3; // 1 = international/prestigious, 2 = national, 3 = regional
  type: 'international' | 'national' | 'regional';
}

// ─── Core Entities ───────────────────────────────────────────

export interface Candidate {
  id: string;
  name: string;
  email: string;
  candidate_type: CandidateType;
  location: string;
  headline: string;
  bio?: string;
  cvSummary: string;
  education: Education;
  skills: string[];
  languages: Language[];
  experienceYears: number;
  experience?: ExperienceEntry[];
  achievements: string[];
  certifications: string[];
  preferredRoles: string[];
  availability?: string;
  expected_salary_usd?: number;

  // Student-specific fields
  isExchangeReady?: boolean;
  isSponsorshipReady?: boolean;
  isInternshipReady?: boolean;
  academicAchievements?: string[];

  // Professional-specific fields
  currentPosition?: string;
  currentCompany?: string;
  careerAchievements?: string[];
  preferredPositions?: string[];
}

export interface Employer {
  id: string;
  company_name: string;
  industry: string;
  location: string;
  size?: string;          // "50-200 Employees"
  website?: string;
  description?: string;
  founded_year?: number;
}

export interface VacancyRequirement {
  skills: string[];              // Mandatory skills
  experience_years: number;
  location: string;
  mandatory_languages?: string[];
  mandatory_education?: string[]; // e.g. ["Computer Science", "Software Engineering"]
}

export interface Vacancy {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  location: string;
  employment_type?: string;      // "Full-Time", "Part-Time", "Internship"
  experience_min_years: number;
  salary_min_usd?: number;
  salary_max_usd?: number;
  status: 'draft' | 'published' | 'closed';
  requirements: VacancyRequirement;
  // Phase 4A additions
  preferred_skills: string[];
  education_field?: string;      // "Computer Science", "Business", "Finance"
  keywords: string[];            // For semantic scoring
  created_at?: string;
}

// ─── Matching Engine Types ────────────────────────────────────

export interface MatchScoreBreakdown {
  totalScore: number;
  skillScore: number;
  experienceScore: number;
  educationScore: number;
  languageScore: number;
  academicScore: number;
  semanticScore: number;
  matchTier: MatchTier;
}

export interface AIExplanation {
  summary: string;
  matchedRequirements: string[];
  missingMandatoryRequirements: string[];
  missingPreferredRequirements: string[];
}

export interface MatchResult {
  vacancy_id: string;
  candidate_id: string;
  eligibility: boolean;
  scoreBreakdown: MatchScoreBreakdown;
  explanation: AIExplanation;
  created_at: string;
}

// ─── Rich Match Record (for UI rendering) ────────────────────

export interface CandidateMatchRecord {
  candidate: Candidate;
  breakdown: MatchScoreBreakdown;
  explanation: AIExplanation;
  rank: number;
}

export interface VacancyMatchRecord {
  vacancy: Vacancy;
  employer: Employer;
  breakdown: MatchScoreBreakdown;
  explanation: AIExplanation;
  rank: number;
}
