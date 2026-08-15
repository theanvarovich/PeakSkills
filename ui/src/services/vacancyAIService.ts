import { GeminiProvider } from '@/lib/ai/geminiProvider';
import { Vacancy } from '@/types';
import * as crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';

const aiProvider = new GeminiProvider();

export class VacancyAIService {
  
  private static generateSourceHash(vacancy: Partial<Vacancy>): string {
    const payload = JSON.stringify({
      title: vacancy.title || '',
      description: vacancy.description?.substring(0, 1000) || '',
      requirements: vacancy.requirements || {},
      preferred_skills: vacancy.preferred_skills || [],
      education_field: vacancy.education_field || '',
      location: vacancy.location || ''
    });
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  static async triggerAnalysis(supabase: SupabaseClient, vacancyId: string, vacancyData: Partial<Vacancy>) {
    
    // 1. Cost Control Check
    const newHash = this.generateSourceHash(vacancyData);
    
    // Check if we already analyzed this version
    const { data: existingTarget } = await supabase
      .from('vacancy_embeddings')
      .select('source_hash')
      .eq('vacancy_id', vacancyId)
      .eq('model_name', 'gemini-embedding-2')
      .single();

    if (existingTarget && existingTarget.source_hash === newHash) {
      console.log(`[AI Cache Hit] Vacancy ${vacancyId} hasn't changed. Skipping analysis.`);
      return; 
    }

    console.log(`[AI Cache Miss] Analyzing vacancy ${vacancyId}...`);

    try {
      // 2. Run LLM Structured Analysis
      const rawText = `${vacancyData.title}\n${vacancyData.description}`;
      const analysis = await aiProvider.analyzeVacancy(rawText, vacancyData);
      
      if (!analysis) {
        throw new Error("Analysis failed to generate or parse correctly.");
      }

      // 3. Generate Embeddings (using fields combined securely)
      const embeddingText = `Title: ${vacancyData.title}\nDesc: ${vacancyData.description?.substring(0, 500)}\nSkills: ${analysis.normalized_skills.join(", ")}\nRole: ${analysis.role_category}\nSummary: ${analysis.key_requirements_summary}`;
      
      const embeddingVec = await aiProvider.generateEmbedding(embeddingText);

      // Dimension mismatch validator
      const expectedDimension = 768; // Gemini embedding 2 target
      if (embeddingVec.length !== expectedDimension) {
         throw new Error(`Embedding validation failed: expected dimension ${expectedDimension}, received ${embeddingVec.length}. Rejecting storage to protect schema integrity.`);
      }

      // 4. Save to DB safely. Upsert on conflict of (vacancy_id, version/model_name)
      await supabase.from('vacancy_ai_analysis').upsert({
        vacancy_id: vacancyId,
        model_provider: 'gemini',
        model_name: 'gemini-flash-latest',
        analysis_version: 'v1.0.0', 
        normalized_skills: analysis.normalized_skills,
        mandatory_skills: analysis.mandatory_skills,
        preferred_skills: analysis.preferred_skills,
        minimum_experience: analysis.minimum_experience,
        maximum_experience: analysis.maximum_experience,
        education_requirements: analysis.education_requirements,
        language_requirements: analysis.language_requirements,
        role_category: analysis.role_category,
        seniority_level: analysis.seniority_level,
        employment_type: analysis.employment_type,
        location_requirements: analysis.location_requirements,
        inferred_requirements: analysis.inferred_requirements,
        responsibilities: analysis.responsibilities,
        key_requirements_summary: analysis.key_requirements_summary,
        source_hash: newHash
      }, { onConflict: 'vacancy_id, analysis_version' }).throwOnError();

      await supabase.from('vacancy_embeddings').upsert({
        vacancy_id: vacancyId,
        model_provider: 'gemini',
        model_name: 'gemini-embedding-2',
        embedding_dimension: 768,
        source_hash: newHash, 
        embedding: `[${embeddingVec.join(',')}]`
      }, { onConflict: 'vacancy_id, model_name, source_hash' }).throwOnError();

      console.log(`[AI Analysis Success] Vacancy ${vacancyId} structurally parsed and embedded.`);

    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(`[AI Persistence Failure] Could not save analysis for ${vacancyId}:`, message);
      // We bubble this gracefully during live testing loops so it falls back properly.
      // E.g. in edge handler, let it die silently while the Vacancy save transaction successfully commits.
    }
  }
}
