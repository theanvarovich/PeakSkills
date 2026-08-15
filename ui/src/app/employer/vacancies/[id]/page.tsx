import { Header } from "@/components/shared/Header";
import { MatchScore } from "@/components/shared/MatchScore";
import { Button } from "@/components/ui/button";
import { store } from "@/lib/store";
import { MatchingService } from "@/services/matchingService";
import { notFound } from "next/navigation";
import { CandidateMatchRecord } from "@/types";

export default async function VacancyMatchResults({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const vacancyId = resolvedParams.id;
  
  const vacancy = await store.vacancies.getById(vacancyId);
  if (!vacancy) notFound();

  const allCandidates = await store.candidates.getAll();
  
  const matchingService = new MatchingService();
  
  // Calculate score for each candidate and build the rich map
  const candidateScores: CandidateMatchRecord[] = [];
  
  for (const candidate of allCandidates) {
      const breakdown = await matchingService.calculateCandidateScore(candidate, vacancy);
      // Explanation generates the matched/missing requirements logic
      const explanation = await matchingService.generateMatchExplanation(candidate, vacancy, breakdown);
      
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

  return (
    <div className="min-h-screen bg-muted/20 pb-16">
      <Header role="employer" />
      <main className="container mx-auto p-4 md:p-8 space-y-8 max-w-6xl">
        
        <header className="border-b border-border pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Top Candidates
            </h1>
            <p className="text-muted-foreground mt-2">
              Viewing matched ranking for <span className="font-semibold text-foreground">{vacancy.title}</span>
            </p>
          </div>
          <Button variant="outline">Edit Vacancy</Button>
        </header>

        <div className="space-y-12">
          {top10.map((matchData) => {
            const { candidate, breakdown, explanation, rank } = matchData;
            
            return (
            <div key={candidate.id} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-6 relative overflow-hidden">
                  
                  {/* Rank Badge */}
                  <div className={`absolute top-0 right-0 px-4 py-2 rounded-bl-xl font-bold tracking-widest text-sm border-b border-l ${rank <= 3 ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`}>
                    RANK #{rank}
                  </div>

                  <div className="pr-20">
                    <h2 className="text-2xl font-semibold text-foreground">{candidate.name}</h2>
                    <p className="text-lg text-primary font-medium mt-1">{candidate.headline}</p>
                    <div className="text-sm text-muted-foreground mt-3 flex flex-wrap items-center gap-4">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-semibold">{candidate.candidate_type.toUpperCase()}</span>
                      <span>{candidate.experienceYears} Years Ext.</span>
                      <span>{candidate.education.degree} {candidate.education.field_of_study}, {candidate.education.institution}</span>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg border border-border/50 text-sm leading-relaxed text-foreground/80">
                    <span className="font-semibold text-foreground">Match explanation: </span> 
                    {explanation.summary}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Skills</h4>
                      <p className="text-sm">{candidate.skills.join(" • ")}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Languages</h4>
                      <p className="text-sm">{candidate.languages.map(l => l.language).join(" • ")}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
                    <div>
                      <h4 className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-3">Matched Requirements</h4>
                      <div className="flex flex-wrap gap-2">
                        {explanation.matchedRequirements.map(req => (
                          <span key={req} className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 px-2 py-1 rounded">{req}</span>
                        ))}
                        {explanation.matchedRequirements.length === 0 && <span className="text-xs text-muted-foreground">None</span>}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Missing Requirements</h4>
                      <div className="flex flex-wrap gap-2">
                        {explanation.missingMandatoryRequirements.map(req => (
                          <span key={`man-${req}`} className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded">{req}</span>
                        ))}
                        {explanation.missingPreferredRequirements.map(req => (
                          <span key={`pref-${req}`} className="text-xs bg-muted text-muted-foreground border border-border px-2 py-1 rounded">{req} (Pref)</span>
                        ))}
                        {(explanation.missingMandatoryRequirements.length === 0 && explanation.missingPreferredRequirements.length === 0) && (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border flex justify-end gap-3">
                    <Button variant="outline">View Full Profile</Button>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Shortlist Candidate</Button>
                  </div>
                </div>
              </div>

              {/* Match Score Column */}
              <div>
                <MatchScore breakdown={breakdown} />
              </div>
            </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}
