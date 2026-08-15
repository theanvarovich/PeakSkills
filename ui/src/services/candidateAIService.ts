import { GeminiProvider } from '@/lib/ai/geminiProvider';
import { Candidate } from '@/types';
import * as crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';

const aiProvider = new GeminiProvider();

export class CandidateAIService {
  
  // Deterministic source hashing for Cost Control
  private static generateSourceHash(candidate: Partial<Candidate>, cvText: string): string {
    const payload = JSON.stringify({
      skills: candidate.skills || [],
      experience: candidate.experience || [],
      education: candidate.education || null,
      languages: candidate.languages || [],
      cv: cvText.trim().substring(0, 1000) // hash the top 1000 chars of CV to catch material changes
    });
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  static async triggerAnalysis(supabase: SupabaseClient, candidateId: string, candidateData: Partial<Candidate>, cvText: string = '') {
    
    // 1. Cost Control Check
    const newHash = this.generateSourceHash(candidateData, cvText);
    
    // Check if we already analyzed this version
    const { data: existingTarget } = await supabase
      .from('candidate_embeddings')
      .select('source_hash')
      .eq('candidate_id', candidateId)
      .eq('model_name', 'gemini-embedding-2')
      .single();

    if (existingTarget && existingTarget.source_hash === newHash) {
      console.log(`[AI Cache Hit] Candidate ${candidateId} hasn't changed. Skipping analysis.`);
      return; 
    }

    console.log(`[AI Cache Miss] Analyzing candidate ${candidateId}...`);

    // 2. Structured Analysis Request
    const analysis = await aiProvider.analyzeCandidate(cvText, candidateData);
    if (!analysis) {
       console.log(`[AI Provider Unavailable or Failed] Gracefully aborting analysis for ${candidateId}.`);
       return; // Graceful degradation.
    }

    // 3. Embedding Generation
    // We compose a text representation of the candidate to embed
    const embeddingText = `
      Title: ${candidateData.headline || ''}
      Summary: ${analysis.professional_summary}
      Domains: ${analysis.career_domains.join(', ')}
      Seniority: ${analysis.seniority_level}
      Skills: ${analysis.normalized_skills.join(', ')}
      Experience: ${analysis.experience_summary}
    `.trim();

    try {
      const embeddingVec = await aiProvider.generateEmbedding(embeddingText);

      // Verify returned vector length matches expected architecture dimensionality
      const expectedDimension = 768; // Gemini embedding 2 target
      if (embeddingVec.length !== expectedDimension) {
         throw new Error(`Embedding validation failed: expected dimension ${expectedDimension}, received ${embeddingVec.length}. Rejecting storage to protect schema integrity.`);
      }

      // 4. Save to DB safely. We upsert on conflict of (candidate_id, version/model_name)
      await supabase.from('candidate_ai_analysis').upsert({
        candidate_id: candidateId,
        model_provider: 'gemini',
        model_name: 'gemini-flash-latest',
        analysis_version: 'v1.0.0', // Application defined abstraction version
        normalized_skills: analysis.normalized_skills,
        inferred_skills: analysis.inferred_skills,
        experience_summary: analysis.experience_summary,
        career_domains: analysis.career_domains,
        seniority_level: analysis.seniority_level,
        strengths: analysis.strengths,
        skill_gaps: analysis.skill_gaps,
        professional_summary: analysis.professional_summary,
        recommended_roles: analysis.recommended_roles
      }, { onConflict: 'candidate_id, analysis_version' }).throwOnError();

      await supabase.from('candidate_embeddings').upsert({
        candidate_id: candidateId,
        model_provider: 'gemini',
        model_name: 'gemini-embedding-2',
        embedding_dimension: 768,
        source_hash: newHash, // Used for the deduplication check
        embedding: `[${embeddingVec.join(',')}]`
      }, { onConflict: 'candidate_id, model_name, source_hash' }).throwOnError();

      console.log(`[AI Analysis Success] Candidate ${candidateId} structurally parsed and embedded.`);

    } catch (e: unknown) {
      // We gracefully trap the failure without corrupting the candidate's core relational properties
      if (e instanceof Error) {
        console.error(`[AI Persistence Failure] Could not save analysis for ${candidateId}: ${e.message}`);
      }
    }
  }
}
