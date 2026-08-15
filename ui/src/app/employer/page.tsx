import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Users, Briefcase, ChevronRight } from "lucide-react";
import { store } from "@/lib/store";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function EmployerDashboard() {
  // ── Auth check ─────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ── Fetch employer data ────────────────────────────────────────────────────
  const employer = await store.employers.getById(user.id);

  if (!employer) {
    // Profile row not yet created — show a graceful fallback
    return (
      <div className="min-h-screen bg-muted/20">
        <Header role="employer" />
        <main className="container mx-auto p-8 max-w-6xl">
          <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4">
            <h2 className="text-xl font-semibold">Employer profile setup in progress</h2>
            <p className="text-muted-foreground text-sm">
              Your employer profile is being created. Please refresh in a moment.
            </p>
            <p className="text-xs text-muted-foreground">User ID: {user.id}</p>
          </div>
        </main>
      </div>
    );
  }

  const myVacancies = await store.vacancies.getByEmployerId(user.id);
  const allCandidatesCount = (await store.candidates.getAll()).length;

  return (
    <div className="min-h-screen bg-muted/20">
      <Header role="employer" />
      <main className="container mx-auto p-4 md:p-8 space-y-8 max-w-6xl">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {employer.company_name}
            </h1>
            <p className="text-muted-foreground mt-2">
              {employer.location}
              {employer.industry ? ` • ${employer.industry}` : ""}
              {employer.size ? ` • ${employer.size}` : ""}
            </p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/employer/vacancies/new">
              <Plus className="mr-2 h-4 w-4" /> Create Vacancy
            </Link>
          </Button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Active Vacancies</p>
                <h2 className="text-3xl font-bold tracking-tight">{myVacancies.length}</h2>
              </div>
              <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <Briefcase className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Candidates Evaluated
                </p>
                <h2 className="text-3xl font-bold tracking-tight">{allCandidatesCount}</h2>
              </div>
              <div className="h-12 w-12 bg-muted text-muted-foreground rounded-full flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h2 className="text-lg font-semibold">Your Vacancies</h2>
            <Link
              href="/employer/vacancies"
              className="text-sm text-primary hover:underline font-medium"
            >
              View All
            </Link>
          </div>
          <div className="divide-y divide-border">
            {myVacancies.length > 0 ? (
              myVacancies.map((vac) => (
                <div
                  key={vac.id}
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-lg">{vac.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {vac.location} • {vac.employment_type}
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    className="text-primary hover:text-primary hover:bg-primary/5 group transition-all"
                  >
                    <Link href={`/employer/vacancies/${vac.id}`}>
                      View Matching Results{" "}
                      <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No vacancies yet.{" "}
                <Link href="/employer/vacancies/new" className="text-primary hover:underline">
                  Create your first vacancy
                </Link>
                .
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
