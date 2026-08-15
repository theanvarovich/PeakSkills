import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { store } from "@/lib/store";
import { redirect } from "next/navigation";

export default async function CandidateDashboard() {
  // ── Auth check ─────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ── Fetch candidate profile from DB ───────────────────────────────────────
  const profile = await store.candidates.getById(user.id);

  if (!profile) {
    // Profile row not yet created or user is an employer — redirect gracefully
    return (
      <div className="min-h-screen bg-muted/20">
        <Header role="candidate" />
        <main className="container mx-auto p-8 max-w-5xl">
          <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4">
            <h2 className="text-xl font-semibold">Profile setup in progress</h2>
            <p className="text-muted-foreground text-sm">
              Your candidate profile is being created. Please refresh in a moment.
            </p>
            <p className="text-xs text-muted-foreground">User ID: {user.id}</p>
          </div>
        </main>
      </div>
    );
  }

  const isStudent = profile.candidate_type === "student";

  return (
    <div className="min-h-screen bg-muted/20">
      <Header role="candidate" />
      <main className="container mx-auto p-4 md:p-8 space-y-8 max-w-5xl">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {profile.name}
            </h1>
            <p className="text-muted-foreground mt-2">
              {profile.education?.degree
                ? `${profile.education.degree} ${profile.education.field_of_study ?? ""} at ${profile.education.institution}`
                : profile.headline}
            </p>
            <div className="flex gap-3 mt-3">
              <span className="text-xs bg-muted px-2 py-1 rounded-full uppercase tracking-wider text-muted-foreground font-semibold">
                {profile.candidate_type}
              </span>
              <span className="text-xs text-muted-foreground pt-0.5">
                {profile.location}
              </span>
            </div>
          </div>
          <Button variant="outline">Edit Profile</Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {isStudent ? (
              <section className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold mb-4">
                  Academic Profile &amp; Education
                </h3>
                <div className="space-y-4">
                  {profile.education?.institution && (
                    <div>
                      <h4 className="font-medium text-foreground">
                        {profile.education.institution}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {profile.education.degree} {profile.education.field_of_study}
                        {profile.education.is_current ? " • Current" : " • Graduated"}
                      </p>
                      {profile.education.gpa && (
                        <p className="text-sm font-medium mt-1">
                          GPA: {profile.education.gpa}
                        </p>
                      )}
                    </div>
                  )}
                  {profile.achievements.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Academic Achievements
                      </h5>
                      <ul className="list-disc list-inside text-sm text-foreground/80 space-y-1">
                        {profile.achievements.map((ach, idx) => (
                          <li key={idx}>{ach}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <section className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Professional Experience</h3>
                {profile.experience && profile.experience.length > 0 ? (
                  <div className="space-y-6">
                    {profile.experience.map((exp, idx) => (
                      <div
                        key={idx}
                        className={idx > 0 ? "pt-6 border-t border-border" : ""}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-foreground">{exp.title}</h4>
                            <p className="text-sm text-muted-foreground">{exp.company}</p>
                          </div>
                          <span className="text-sm bg-muted/50 px-2 py-1 rounded text-muted-foreground">
                            {exp.years} {exp.years === 1 ? "Year" : "Years"}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 mt-3">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No experience entries yet. Update your profile to add them.
                  </p>
                )}
              </section>
            )}

            <section className="bg-card border border-border p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4">CV Summary</h3>
              <p className="text-sm leading-relaxed text-foreground/80">{profile.cvSummary}</p>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-card border border-border p-6 rounded-xl shadow-sm">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                Core Skills
              </h3>
              {profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="text-xs bg-muted text-foreground px-2.5 py-1.5 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No skills added yet.</p>
              )}
            </section>

            <section className="bg-card border border-border p-6 rounded-xl shadow-sm">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                Languages
              </h3>
              {profile.languages.length > 0 ? (
                <div className="space-y-3">
                  {profile.languages.map((lang, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{lang.language}</span>
                      <span className="text-muted-foreground">{lang.level}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No languages added yet.</p>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
