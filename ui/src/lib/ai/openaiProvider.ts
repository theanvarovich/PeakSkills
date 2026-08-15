import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { CandidateAnalysisSchema, CandidateAnalysisResult, ILLMProvider, IEmbeddingProvider } from './interfaces';

export class OpenAIProvider implements ILLMProvider, IEmbeddingProvider {
  private client: OpenAI | null = null;
  private isAvailable: boolean = false;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
      this.isAvailable = true;
    } else {
      console.warn("AI_UNAVAILABLE: OPENAI_API_KEY is not set. Falling back to degraded state.");
    }
  }

  async analyzeCandidate(cvText: string, profileMetadata: unknown): Promise<CandidateAnalysisResult | null> {
    if (!this.isAvailable || !this.client) {
        return null;
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert technical recruiter analyzing an applicant. Extract factual, strict elements. Do NOT invent qualifications not explicitly found in their experience or skills array. Only infer skills confidently associated with their tech stack." },
          { role: "user", content: `Analyze the following candidate profile mapping:\n\nProfile: ${JSON.stringify(profileMetadata)}\n\nCV Text/Description: ${cvText}` },
        ],
        response_format: zodResponseFormat(CandidateAnalysisSchema, "candidate_analysis"),
      });

      const raw = completion.choices[0].message.content;
      if (raw) {
          return JSON.parse(raw);
      }
      return null;
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error("AI_CANDIDATE_ANALYSIS_FAILED: ", e.message);
      }
      return null;
    }
  }

  async analyzeVacancy(_vacancyText: string, _vacancyMetadata: unknown): Promise<null> {
    throw new Error("OpenAIProvider does not implement analyzeVacancy yet.");
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isAvailable || !this.client) {
      // In degraded mode, return empty mock or throw
      // However, caller should handle missing provider gracefully
      throw new Error("AI provider unavailable for embeddings.");
    }

    try {
      const response = await this.client.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });

      return response.data[0].embedding;
    } catch (e: unknown) {
      if (e instanceof Error) {
          console.error("AI_EMBEDDING_FAILED: ", e.message);
      }
      throw e;
    }
  }
}
