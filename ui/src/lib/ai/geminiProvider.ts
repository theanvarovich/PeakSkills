import { GoogleGenAI } from '@google/genai';
import { CandidateAnalysisSchema, VacancyAnalysisSchema, CandidateAnalysisResult, VacancyAnalysisResult, ILLMProvider, IEmbeddingProvider } from './interfaces';

export class GeminiProvider implements ILLMProvider, IEmbeddingProvider {
  private ai: GoogleGenAI | null = null;
  private isAvailable: boolean = false;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
      this.isAvailable = true;
    } else {
      console.warn("AI_UNAVAILABLE: GEMINI_API_KEY is not set. Falling back to degraded state.");
    }
  }

  async analyzeCandidate(cvText: string, profileMetadata: unknown): Promise<CandidateAnalysisResult | null> {
    if (!this.isAvailable || !this.ai) {
        return null;
    }

    try {
      const systemInstruction = 
      "You are an expert technical recruiter analyzing an applicant. Extract factual, strict elements. Do NOT invent qualifications not explicitly found in their experience or skills array. Only infer skills confidently associated with their tech stack.\n\n" +
      "You MUST return ONLY valid JSON matching this exact structure, with no markdown wrappers:\n" +
      "{\n" +
      "  \"normalized_skills\": [\"string\"],\n" +
      "  \"inferred_skills\": [\"string\"],\n" +
      "  \"experience_summary\": \"string\",\n" +
      "  \"career_domains\": [\"string\"],\n" +
      "  \"seniority_level\": \"Junior\" | \"Mid\" | \"Senior\" | \"Lead\" | \"Principal\",\n" +
      "  \"strengths\": [\"string\"],\n" +
      "  \"skill_gaps\": [\"string\"],\n" +
      "  \"professional_summary\": \"string\",\n" +
      "  \"recommended_roles\": [\"string\"]\n" +
      "}";
      
      const prompt = `Analyze the following candidate profile mapping:\n\nProfile: ${JSON.stringify(profileMetadata)}\n\nCV Text/Description: ${cvText}`;
      
      let response;
      for (let attempt = 1; attempt <= 3; attempt++) {
          try {
              response = await this.ai.models.generateContent({
                  model: 'gemini-flash-latest', 
                  contents: prompt,
                  config: {
                      systemInstruction,
                      responseMimeType: "application/json",
                  }
              });
              break; // Success
          } catch (e: any) {
              if (attempt === 3) throw e;
              if (e.message && (e.message.includes("503") || e.message.includes("429"))) {
                  // The API specifically says 'Please retry in 23.8s.' We wait 25s to guarantee clearance.
                  await new Promise(resolve => setTimeout(resolve, 25000));
              } else {
                  throw e;
              }
          }
      }

      if (!response) return null;

      let raw = response.text;
      if (raw) {
          raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
          try {
              const parsed = CandidateAnalysisSchema.parse(JSON.parse(raw));
              return parsed;
          } catch (parseError: any) {
              console.error("ZOD_CANDIDATE_PARSE_ERROR:");
              if (parseError.errors) {
                  parseError.errors.forEach((err: any) => {
                      console.error(`- Field: ${err.path.join('.')} | Error: ${err.message}`);
                  });
              } else {
                  console.error(parseError);
              }
              console.error("RAW JSON RECEIVED:", raw);
              return null;
          }
      }
      return null;
    } catch (e: any) {
      if (e instanceof Error) {
        console.error("AI_CANDIDATE_ANALYSIS_FAILED: ", e.message);
      }
      return null;
    }
  }

  async analyzeVacancy(vacancyText: string, vacancyMetadata: unknown): Promise<VacancyAnalysisResult | null> {
    if (!this.isAvailable || !this.ai) {
        return null;
    }
    try {
      const systemInstruction = 
      "You are an expert technical recruiter analyzing a job vacancy. Extract strict, factual elements based on the employer's phrasing. Observe constraints on explicit vs inferred requirements.\n\n" +
      "You MUST return ONLY valid JSON matching this exact structure, with no markdown wrappers:\n" +
      "{\n" +
      "  \"normalized_skills\": [\"string\"],\n" +
      "  \"mandatory_skills\": [\"string\"],\n" +
      "  \"preferred_skills\": [\"string\"],\n" +
      "  \"minimum_experience\": number,\n" +
      "  \"maximum_experience\": number | null,\n" +
      "  \"education_requirements\": [\"string\"],\n" +
      "  \"language_requirements\": [\"string\"],\n" +
      "  \"role_category\": \"string\",\n" +
      "  \"seniority_level\": \"Junior\" | \"Mid\" | \"Senior\" | \"Lead\" | \"Principal\" | \"Any\",\n" +
      "  \"employment_type\": \"string\",\n" +
      "  \"location_requirements\": \"string\",\n" +
      "  \"inferred_requirements\": [\"string\"],\n" +
      "  \"responsibilities\": [\"string\"],\n" +
      "  \"key_requirements_summary\": \"string\"\n" +
      "}";
      
      const prompt = `Analyze the following vacancy mapping:\n\nVacancy Metadata (includes explicitly configured fields): ${JSON.stringify(vacancyMetadata)}\n\nVacancy Description: ${vacancyText}`;
      
      let response;
      for (let attempt = 1; attempt <= 3; attempt++) {
          try {
              response = await this.ai.models.generateContent({
                  model: 'gemini-flash-latest', 
                  contents: prompt,
                  config: {
                      systemInstruction,
                      responseMimeType: "application/json",
                  }
              });
              break;
          } catch (e: any) {
              if (attempt === 3) throw e;
              if (e.message && (e.message.includes("503") || e.message.includes("429"))) {
                  await new Promise(resolve => setTimeout(resolve, 25000));
              } else {
                  throw e;
              }
          }
      }

      if (!response) return null;

      let raw = response.text;
      if (raw) {
          raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
          try {
              return VacancyAnalysisSchema.parse(JSON.parse(raw));
          } catch (parseError: any) {
              console.error("ZOD_VACANCY_PARSE_ERROR:", parseError);
              return null;
          }
      }
      return null;
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error("AI_VACANCY_ANALYSIS_FAILED: ", e.message);
      }
      return null;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isAvailable || !this.ai) {
      throw new Error("AI provider unavailable for embeddings.");
    }

    try {
      const response = await this.ai.models.embedContent({
        model: "gemini-embedding-2", // Latest Google Embedding Model
        contents: text,
        config: { outputDimensionality: 768 }
      });

      return response.embeddings?.[0]?.values || [];
    } catch (e: unknown) {
      if (e instanceof Error) {
          console.error("AI_EMBEDDING_FAILED: ", e.message);
      }
      throw e;
    }
  }
}
