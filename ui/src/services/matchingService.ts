import { Candidate, Vacancy, MatchScoreBreakdown, AIExplanation, MatchTier } from "../types";

const SCORE_WEIGHTS = {
    skills: 0.35,
    experience: 0.20,
    education: 0.15,
    language: 0.10,
    academic: 0.10,
    semantic: 0.10
};

export class MatchingService {

    // Helper: Jaccard intersection
    private calculateSkillOverlap(candidateSkills: string[], requiredSkills: string[], preferredSkills: string[]): number {
        const cLower = candidateSkills.map(s => s.toLowerCase());
        
        // Mandatory score (max 70% of skill score)
        let mandatoryMatched = 0;
        for (const req of requiredSkills) {
            if (cLower.includes(req.toLowerCase())) mandatoryMatched++;
        }
        const mandatoryScore = requiredSkills.length > 0 ? (mandatoryMatched / requiredSkills.length) * 70 : 70;

        // Preferred score (max 30% of skill score)
        let preferredMatched = 0;
        for (const pref of preferredSkills) {
            if (cLower.includes(pref.toLowerCase())) preferredMatched++;
        }
        const preferredScore = preferredSkills.length > 0 ? (preferredMatched / preferredSkills.length) * 30 : 30;

        return mandatoryScore + preferredScore;
    }

    private calculateExperienceScore(candExpPoints: number, minExp: number): number {
        if (minExp === 0) return 100;
        if (candExpPoints >= minExp) return 100;
        // Penaltize falling short
        const ratio = candExpPoints / minExp;
        return (ratio * 100) * 0.8; // Max 80 if not fully met
    }

    private calculateEducationScore(candField?: string, reqField?: string): number {
        if (!reqField) return 100;
        if (!candField) return 40;
        
        // Exact match
        if (candField.toLowerCase() === reqField.toLowerCase()) return 100;
        
        // Partial/related fields rough heuristic
        const isTechCand = ["Computer Science", "Information Systems", "Software Engineering"].includes(candField);
        const isTechReq = ["Computer Science", "Information Systems", "Software Engineering"].includes(reqField);
        if (isTechCand && isTechReq) return 90;

        const isBizCand = ["Business Administration", "Finance", "Economics"].includes(candField);
        const isBizReq = ["Business Administration", "Finance", "Economics", "Business"].includes(reqField);
        if (isBizCand && isBizReq) return 90;

        return 50; // Different field
    }

    private calculateGPAScore(gpaNumeric?: number): number {
        if (!gpaNumeric) return 70;
        if (gpaNumeric >= 3.8) return 100;
        if (gpaNumeric >= 3.5) return 85;
        if (gpaNumeric >= 3.0) return 75;
        return 60;
    }

    private calculateLanguageScore(candLangs: {language:string, level:string}[], reqLangs: string[]): number {
        if (!reqLangs || reqLangs.length === 0) return 100;
        let matched = 0;
        for (const req of reqLangs) {
             const found = candLangs.find(l => l.language.toLowerCase() === req.toLowerCase());
             if (found) {
                 // rough level comparison - native/fluent/advanced is best
                 const lvl = found.level.toLowerCase();
                 if (lvl.includes('native') || lvl.includes('fluent') || lvl.includes('c1') || lvl.includes('c2') || lvl.includes('7.5') || lvl.includes('8')) {
                     matched += 1;
                 } else if (lvl.includes('b2') || lvl.includes('6.5') || lvl.includes('7.0')) {
                     matched += 0.8;
                 } else {
                     matched += 0.5;
                 }
             }
        }
        return (matched / reqLangs.length) * 100;
    }

    private calculateSemanticScore(candidate: Candidate, keywords: string[]): number {
        if (!keywords || keywords.length === 0) return 100;
        
        const docText = `${candidate.headline || ''} ${candidate.cvSummary || ''} ${candidate.achievements?.join(' ') || ''} ${(candidate.experience || []).map(e=>e.description).join(' ')}`.toLowerCase();
        
        let matchCount = 0;
        for (const kw of keywords) {
            if (docText.includes(kw.toLowerCase())) matchCount++;
        }
        return (matchCount / keywords.length) * 100;
    }

    private getMatchTier(score: number): MatchTier {
        if (score >= 90) return 'Excellent Match';
        if (score >= 75) return 'Strong Match';
        if (score >= 60) return 'Potential Match';
        return 'Low Match';
    }

    // Layer 1: Hard Filters
    async filterEligibleCandidates(candidates: Candidate[], _vacancy: Vacancy): Promise<Candidate[]> {
        // We filter out anyone who has 0 overlap with mandatory skills if strictly needed
        // For MVP, we let scoring do the heavy lifting to avoid returning empty sets.
        return candidates;
    }

    async calculateCandidateScore(candidate: Candidate, vacancy: Vacancy): Promise<MatchScoreBreakdown> {
        const skillScore = this.calculateSkillOverlap(
             candidate.skills, 
             vacancy.requirements.skills || [], 
             vacancy.preferred_skills || []
        );
        const expScore = this.calculateExperienceScore(candidate.experienceYears || 0, vacancy.requirements.experience_years || 0);
        const eduScore = this.calculateEducationScore(candidate.education?.field_of_study, vacancy.education_field);
        
        // professional candidates rely less on GPA, students rely heavily
        let acadScore = 80; // default baseline
        if (candidate.candidate_type === 'student') {
             acadScore = this.calculateGPAScore(candidate.education?.gpaNumeric);
        } else {
             acadScore = this.calculateGPAScore(candidate.education?.gpaNumeric) * 0.5 + 50; // flattened
        }

        const langScore = this.calculateLanguageScore(candidate.languages, vacancy.requirements.mandatory_languages || []);
        const semanticScore = this.calculateSemanticScore(candidate, vacancy.keywords || []);

        const totalScore = (
            (skillScore * SCORE_WEIGHTS.skills) +
            (expScore * SCORE_WEIGHTS.experience) +
            (eduScore * SCORE_WEIGHTS.education) +
            (langScore * SCORE_WEIGHTS.language) +
            (acadScore * SCORE_WEIGHTS.academic) +
            (semanticScore * SCORE_WEIGHTS.semantic)
        );

        return {
            totalScore: parseFloat(totalScore.toFixed(2)),
            skillScore: parseFloat(skillScore.toFixed(2)),
            experienceScore: parseFloat(expScore.toFixed(2)),
            educationScore: parseFloat(eduScore.toFixed(2)),
            languageScore: parseFloat(langScore.toFixed(2)),
            academicScore: parseFloat(acadScore.toFixed(2)),
            semanticScore: parseFloat(semanticScore.toFixed(2)),
            matchTier: this.getMatchTier(totalScore)
        };
    }

    async generateMatchExplanation(candidate: Candidate, vacancy: Vacancy, breakdown: MatchScoreBreakdown): Promise<AIExplanation> {
        const cLower = candidate.skills.map(s => s.toLowerCase());
        
        const matchedReqs: string[] = [];
        const missingMan: string[] = [];
        
        for (const req of (vacancy.requirements.skills || [])) {
             if (cLower.includes(req.toLowerCase())) {
                 matchedReqs.push(req);
             } else {
                 missingMan.push(req);
             }
        }
        
        const missingPref: string[] = [];
        for (const pref of (vacancy.preferred_skills || [])) {
             if (!cLower.includes(pref.toLowerCase())) {
                 missingPref.push(pref);
             }
        }

        // Quick heuristic summary
        let summary = "";
        if (breakdown.totalScore >= 90) {
            summary = `Exceptional match because the candidate possesses ${matchedReqs.slice(0,3).join(", ")} and exceeds the minimum requirements for this role.`;
        } else if (breakdown.totalScore >= 75) {
            summary = `Strong match holding key competencies in ${matchedReqs.slice(0,2).join(", ")}. Profile aligns well despite lacking ${missingMan.length > 0 ? missingMan[0] : missingPref[0]}.`;
        } else if (breakdown.totalScore >= 60) {
            summary = `Potential match. While having some overlap, misses critical mandatory skills like ${missingMan.join(', ')}.`;
        } else {
            summary = `Low match due to significant gap in required skills and experience relative to the vacancy's demands.`;
        }

        return {
            summary,
            matchedRequirements: matchedReqs,
            missingMandatoryRequirements: missingMan,
            missingPreferredRequirements: missingPref
        };
    }
}
