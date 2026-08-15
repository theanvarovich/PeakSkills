'use server';

import { GeminiProvider } from '@/lib/ai/geminiProvider';
import { MatchingService } from '@/services/matchingService';
import { store } from '@/lib/store';
import { Candidate, Vacancy, MatchScoreBreakdown, AIExplanation, CandidateMatchRecord } from '@/types';
import { CandidateAnalysisResult, VacancyAnalysisResult } from '@/lib/ai/interfaces';

const aiProvider = new GeminiProvider();
const matchingService = new MatchingService();

export async function demoAnalyzeCandidate(cvText: string) {
  try {
    // 1. Analyze CV using AI
    const analysis = await aiProvider.analyzeCandidate(cvText, { headline: "Demo Candidate" });
    if (!analysis) {
      return { success: false, error: "Failed to parse CV with AI." };
    }

    // 2. Build Ephemeral Candidate
    const ephemeralCandidate: Candidate = {
      id: 'demo-cand-' + Date.now(),
      name: 'Demo Candidate',
      email: 'demo@example.com',
      candidate_type: 'professional',
      location: 'Remote',
      headline: analysis.professional_summary,
      cvSummary: analysis.professional_summary,
      skills: analysis.normalized_skills,
      languages: [],
      experienceYears: analysis.seniority_level === 'Senior' ? 5 : analysis.seniority_level === 'Mid' ? 3 : 1,
      experience: [],
      achievements: analysis.strengths || [],
      certifications: [],
      preferredRoles: analysis.recommended_roles || [],
      education: {
        institution: 'Demo University',
        degree: 'BSc',
        field_of_study: 'Computer Science'
      }
    };

    // 3. Match against all 40 vacancies from local data to bypass RLS
    const { vacancies: allVacancies } = await import('@/lib/data');
    
    // Custom interface for Vacancy Match
    const vacancyScores: Array<{
      vacancy: Vacancy;
      breakdown: MatchScoreBreakdown;
      explanation: AIExplanation;
      rank: number;
    }> = [];

    for (const vacancy of allVacancies) {
      const breakdown = await matchingService.calculateCandidateScore(ephemeralCandidate, vacancy);
      const explanation = await matchingService.generateMatchExplanation(ephemeralCandidate, vacancy, breakdown);
      
      vacancyScores.push({
        vacancy,
        breakdown,
        explanation,
        rank: 0,
      });
    }

    // Sort descending by totalScore and take top (now handled below)
    vacancyScores.sort((a,b) => b.breakdown.totalScore - a.breakdown.totalScore);
    const topMatches = vacancyScores.slice(0, 5);

    // Re-rank 1-indexed
    topMatches.forEach((m, idx) => { m.rank = idx + 1; });

    return { 
      success: true, 
      analysis, 
      topMatches
    };
  } catch (err: any) {
    console.error("ACTUAL_EXCEPTION_THROWN:", err);
    return { success: false, error: "Unhandled exception in server action" };
  }
}

export async function demoAnalyzeVacancy(title: string, description: string) {
  // 1. Analyze Vacancy using AI
  const analysis = await aiProvider.analyzeVacancy(description, { title });
  if (!analysis) {
    return { success: false, error: "Failed to analyze vacancy with AI." };
  }

  // 2. Build Ephemeral Vacancy
  const ephemeralVacancy: Vacancy = {
    id: 'demo-vac-' + Date.now(),
    employer_id: 'demo-emp',
    title: title,
    description: description,
    location: analysis.location_requirements,
    status: 'published',
    experience_min_years: analysis.minimum_experience || 0,
    keywords: [],
    requirements: {
      skills: analysis.mandatory_skills.concat(analysis.normalized_skills),
      experience_years: analysis.minimum_experience || 0,
      location: analysis.location_requirements,
    },
    preferred_skills: analysis.preferred_skills,
  };

  // 3. Match against all 70 candidates from local data to bypass RLS
  const { candidates: allCandidates } = await import('@/lib/data');
  
  const candidateScores: CandidateMatchRecord[] = [];

  for (const candidate of allCandidates) {
    const breakdown = await matchingService.calculateCandidateScore(candidate, ephemeralVacancy);
    const explanation = await matchingService.generateMatchExplanation(candidate, ephemeralVacancy, breakdown);
    
    candidateScores.push({
      candidate,
      breakdown,
      explanation,
      rank: 0,
    });
  }

  // Sort descending by totalScore and take top 10
  candidateScores.sort((a, b) => b.breakdown.totalScore - a.breakdown.totalScore);
  const top10 = candidateScores.slice(0, 10).map((c, idx) => ({ ...c, rank: idx + 1 }));

  return { success: true, analysis, topMatches: top10, vacancy: ephemeralVacancy };
}
