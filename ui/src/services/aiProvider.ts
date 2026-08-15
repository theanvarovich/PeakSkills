import { VacancyRequirement, Candidate, Vacancy, AIExplanation } from "../types";

// Core AI Interface definition based on Phase 1 architecture
export interface IAIService {
    extractStructuredRequirements(vacancyDescription: string): Promise<VacancyRequirement>;
    extractCandidateProfile(cvFileText: string): Promise<Partial<Candidate>>;
    generateMatchExplanation(candidate: Candidate, vacancy: Vacancy): Promise<AIExplanation>;
    getEmbedding(text: string): Promise<number[]>;
}

// Temporary Mock Implementation to unblock Phase 2 logic scaffolding without live keys
export class MockAIProvider implements IAIService {
    async extractStructuredRequirements(_desc: string): Promise<VacancyRequirement> {
        return {
            skills: ["React", "TypeScript", "PostgreSQL"],
            experience_years: 3,
            location: "Tashkent"
        };
    }

    async extractCandidateProfile(_cvText: string): Promise<Partial<Candidate>> {
        return {
            education: { institution: "Westminster International University in Tashkent", gpa: "3.8" },
            languages: [{ language: "English", level: "IELTS 7.5" }, { language: "Uzbek", level: "Native" }]
        };
    }

    async generateMatchExplanation(_candidate: Candidate, _vacancy: Vacancy): Promise<AIExplanation> {
        return {
            summary: "Strong match: excellent skills and native Uzbek required for the retail sector in Tashkent.",
            matchedRequirements: ["Uzbek Language", "Tashkent Location"],
            missingMandatoryRequirements: [],
            missingPreferredRequirements: ["Specific Database experience"]
        };
    }

    async getEmbedding(_text: string): Promise<number[]> {
        return new Array(1536).fill(0.01);
    }
}
