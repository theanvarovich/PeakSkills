import { Header } from "@/components/shared/Header";
import { MatchScore } from "@/components/shared/MatchScore";
import { Button } from "@/components/ui/button";
import { store } from "@/lib/store";
import { MatchingService } from "@/services/matchingService";
import { VacancyMatchRecord } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function RecommendedJobs() {
  // ── Auth check ─────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const candidate = await store.candidates.getById(user.id);

  if (!candidate) {
    return (
      <div className="min-h-screen bg-muted/20">
        <Header role="candidate" />
        <main className="container mx-auto p-8 max-w-6xl">
          <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4">
            <h1 className="text-xl font-semibold">Profile setup in progress</h1>
            <p className="text-muted-foreground text-sm">
              Your candidate profile is being created. Please refresh in a moment or check
              your dashboard.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const allVacancies = await store.vacancies.getAll();
  const employers = await store.employers.getAll();

  const matchingService = new MatchingService();

  const recommendedJobs: VacancyMatchRecord[] = [];

  for (const vacancy of allVacancies) {
    // Only show published vacancies
    if (vacancy.status !== "published") continue;

    const employer = employers.find((e) => e.id === vacancy.employer_id);
    if (!employer) continue;

    const breakdown = await matchingService.calculateCandidateScore(candidate, vacancy);

    // Only include reasonably relevant results
    if (breakdown.totalScore < 50) continue;

    const explanation = await matchingService.generateMatchExplanation(
      candidate,
      vacancy,
      breakdown
    );

    recommendedJobs.push({
      vacancy,
      employer,
      breakdown,
      explanation,
      rank: 0,
    });
  }

  // Sort descending by totalScore and take top matches
  recommendedJobs.sort((a, b) => b.breakdown.totalScore - a.breakdown.totalScore);
  const topRecommendations = recommendedJobs.slice(0, 15);

  return (
    <div className="min-h-screen bg-muted/20 pb-16">
      <Header role="candidate" />
      <main className="container mx-auto p-4 md:p-8 space-y-8 max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Recommended Jobs
          </h1>
          <p className="text-muted-foreground mt-2">
            Opportunities matching your deterministic profile requirements.
          </p>
        </header>

        <div className="space-y-12">
          {topRecommendations.map((job) => {
            const { vacancy, employer, breakdown, explanation } = job;

            return (
              <div key={vacancy.id} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-6 relative overflow-hidden">
                    <div className="pr-20">
                      <h2 className="text-2xl font-semibold text-foreground">
                        {vacancy.title}
                      </h2>
                      <p className="text-lg text-primary font-medium mt-1">
                        {employer.company_name}
                      </p>
                      <div className="text-sm text-muted-foreground mt-3 flex flex-wrap items-center gap-4">
                        <span>{vacancy.location}</span>
                        <span>{vacancy.employment_type}</span>
                        {(vacancy.salary_min_usd ?? 0) > 0 && (
                          <span>
                            ${vacancy.salary_min_usd} - ${vacancy.salary_max_usd} / month
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score badge */}
                    <div className="absolute top-0 right-0 bg-primary/5 border-b border-l border-primary/10 px-4 py-3 rounded-bl-xl text-center hidden sm:block">
                      <span className="block text-2xl font-bold text-primary">
                        {breakdown.totalScore}%
                      </span>
                      <span className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-1">
                        Match
                      </span>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg border border-border/50 text-sm leading-relaxed text-foreground/80">
                      <span className="font-semibold text-foreground">Why this job matches: </span>
                      {explanation.summary}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
                      <div>
                        <h3 className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-3">
                          Matched Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {explanation.matchedRequirements.map((req) => (
                            <span
                              key={req}
                              className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 px-2 py-1 rounded"
                            >
                              {req}
                            </span>
                          ))}
                          {explanation.matchedRequirements.length === 0 && (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          Missing Requirements
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {explanation.missingMandatoryRequirements.map((req) => (
                            <span
                              key={`man-${req}`}
                              className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded"
                            >
                              {req}
                            </span>
                          ))}
                          {explanation.missingPreferredRequirements.map((req) => (
                            <span
                              key={`pref-${req}`}
                              className="text-xs bg-muted text-muted-foreground border border-border px-2 py-1 rounded"
                            >
                              {req} (Pref)
                            </span>
                          ))}
                          {explanation.missingMandatoryRequirements.length === 0 &&
                            explanation.missingPreferredRequirements.length === 0 && (
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border flex justify-end gap-3">
                      <Button variant="outline">View Full Description</Button>
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                        Apply Now
                      </Button>
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

          {topRecommendations.length === 0 && (
            <div className="p-12 text-center bg-card rounded-xl border border-border text-muted-foreground">
              We couldn&apos;t find any strong matches for your profile yet. Try updating your
              skills.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
