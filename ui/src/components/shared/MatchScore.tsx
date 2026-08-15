import { MatchScoreBreakdown } from "@/types";

export function MatchScore({ breakdown }: { breakdown: MatchScoreBreakdown }) {
  const SCORE_WEIGHTS = {
    skills: 0.35,
    experience: 0.20,
    education: 0.15,
    language: 0.10,
    academic: 0.10,
    semantic: 0.10
  };

  return (
    <div className="w-full bg-card rounded-xl border border-border p-6 space-y-6">
      <div className="flex items-end justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Profile Match</h3>
          <p className="text-sm text-muted-foreground mt-1">Based on employer deterministic requirements</p>
        </div>
        <div className="text-right">
          <span className="text-4xl font-light text-foreground">{breakdown.totalScore}%</span>
        </div>
      </div>

      <div className="space-y-4">
        {[
          { label: "Skills (35%)", score: breakdown.skillScore, weight: SCORE_WEIGHTS.skills },
          { label: "Experience (20%)", score: breakdown.experienceScore, weight: SCORE_WEIGHTS.experience },
          { label: "Education (15%)", score: breakdown.educationScore, weight: SCORE_WEIGHTS.education },
          { label: "Languages (10%)", score: breakdown.languageScore, weight: SCORE_WEIGHTS.language },
          { label: "Academic Profile (10%)", score: breakdown.academicScore, weight: SCORE_WEIGHTS.academic },
          { label: "Semantic Fit (10%)", score: breakdown.semanticScore, weight: SCORE_WEIGHTS.semantic },
        ].map(item => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-foreground font-medium">{item.label}</span>
              <span className="text-muted-foreground">{item.score}%</span>
            </div>
            {/* Base bar */}
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              {/* Fill bar using logo accent color */}
              <div 
                className="h-full bg-primary rounded-full transition-all duration-1000 ease-in-out" 
                style={{ width: `${item.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
