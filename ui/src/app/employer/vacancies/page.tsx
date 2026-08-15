import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";
import { store } from "@/lib/store";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function VacanciesList() {
  // ── Auth check ────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const myVacancies = await store.vacancies.getByEmployerId(user.id);

  return (
    <div className="min-h-screen bg-muted/20">
      <Header role="employer" />
      <main className="container mx-auto p-4 md:p-8 space-y-8 max-w-6xl">

        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">All Vacancies</h1>
            <p className="text-muted-foreground mt-2">
              Manage your active and closed vacancies.
            </p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/employer/vacancies/new">
              <Plus className="mr-2 h-4 w-4" /> Create Vacancy
            </Link>
          </Button>
        </header>

        <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {myVacancies.length > 0 ? (
              myVacancies.map((vac) => (
                <div key={vac.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                  <div>
                    <h3 className="font-semibold text-lg">{vac.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {vac.location} • {vac.status.toUpperCase()} • Created: {vac.created_at}
                    </p>
                    <div className="flex gap-2 mt-3 flex-wrap text-xs">
                      {vac.requirements.skills.map((s) => (
                        <span key={s} className="bg-muted px-2 py-0.5 rounded text-muted-foreground">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button asChild variant="ghost" className="text-primary hover:text-primary hover:bg-primary/5 group transition-all">
                    <Link href={`/employer/vacancies/${vac.id}`}>
                      View Matching Results <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                You have no vacancies yet.{" "}
                <Link href="/employer/vacancies/new" className="text-primary hover:underline">
                  Create your first one
                </Link>{" "}
                to start matching candidates.
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
