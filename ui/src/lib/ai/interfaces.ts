import { z } from 'zod';

export const CandidateAnalysisSchema = z.object({
  normalized_skills: z.array(z.string()).describe("Standardized tech skills"),
  inferred_skills: z.array(z.string()).describe("Skills deduced from experience but not explicitly listed"),
  experience_summary: z.string().describe("1-2 sentence professional summary of timeline"),
  career_domains: z.array(z.string()).describe("e.g., Fintech, E-Commerce, EdTech"),
  seniority_level: z.enum(['Junior', 'Mid', 'Senior', 'Lead', 'Principal']).describe("Calculated seniority based on trajectory"),
  strengths: z.array(z.string()).describe("Key candidate strengths highlighting competitive advantage"),
  skill_gaps: z.array(z.string()).describe("Potential missing skills relative to their claimed seniority or domain"),
  professional_summary: z.string().describe("A professional pitch crafted for employers"),
  recommended_roles: z.array(z.string()).describe("Exact job titles this candidate matches best")
});

export type CandidateAnalysisResult = z.infer<typeof CandidateAnalysisSchema>;

export const VacancyAnalysisSchema = z.object({
  normalized_skills: z.array(z.string()).describe("Standardized required tech skills"),
  mandatory_skills: z.array(z.string()).describe("Skills strictly required by the employer (must be explicitly requested as required)"),
  preferred_skills: z.array(z.string()).describe("Skills explicitly mentioned as a plus, bonus, or nice to have"),
  minimum_experience: z.number().describe("Minimum years of experience. Use 0 if none specified."),
  maximum_experience: z.number().nullable().describe("Maximum years of experience. Null if none."),
  education_requirements: z.array(z.string()).describe("Specific fields of study requested, like Computer Science"),
  language_requirements: z.array(z.string()).describe("Normalized languages required, e.g. English, Uzbek"),
  role_category: z.string().describe("Broad categorizaton like Frontend, Backend, Data Science"),
  seniority_level: z.enum(['Junior', 'Mid', 'Senior', 'Lead', 'Principal', 'Any']).describe("Calculated seniority baseline required by the vacancy"),
  employment_type: z.string().describe("e.g. Full-Time, Part-Time, Contract"),
  location_requirements: z.string().describe("e.g. Remote, On-site Tashkent"),
  inferred_requirements: z.array(z.string()).describe("Implied skills strongly associated with explicit requirements. Eg. React might imply JavaScript."),
  responsibilities: z.array(z.string()).describe("Key actions the hire will perform"),
  key_requirements_summary: z.string().describe("A 1-2 sentence summary of what the employer is strictly looking for")
});

export type VacancyAnalysisResult = z.infer<typeof VacancyAnalysisSchema>;

export interface ILLMProvider {
  analyzeCandidate(cvText: string, profileMetadata: unknown): Promise<CandidateAnalysisResult | null>;
  analyzeVacancy(vacancyText: string, vacancyMetadata: unknown): Promise<VacancyAnalysisResult | null>;
}

export interface IEmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
}
