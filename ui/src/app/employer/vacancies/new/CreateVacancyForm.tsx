'use client'

import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createVacancyAction, analyzeVacancyAction } from "@/app/actions/vacancies";
import { useState } from "react";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { useRouter } from "next/navigation";

interface Props {
  employerId: string;
}

export function CreateVacancyForm({ employerId }: Props) {
  const router = useRouter();
  const [procState, setProcState] = useState<'idle'|'saving'|'analyzing'|'understanding'|'preparing'|'ready'|'error'>('idle');
  const [createdVacancyId, setCreatedVacancyId] = useState<string | null>(null);

  const processingStages = [
    "Saving vacancy",
    "Analyzing requirements",
    "Understanding the role",
    "Preparing candidate matching",
    "Results ready"
  ];

  const getStageIndex = () => {
    switch (procState) {
      case 'saving': return 0;
      case 'analyzing': return 1;
      case 'understanding': return 2;
      case 'preparing': return 3;
      case 'ready': return 4;
      default: return 0;
    }
  };

  async function cycleAIProcessingStates(vId: string) {
    setProcState('analyzing');
    
    const aiPromise = analyzeVacancyAction(vId);
    
    const t1 = setTimeout(() => setProcState(s => s === 'analyzing' ? 'understanding' : s), 2000);
    const t2 = setTimeout(() => setProcState(s => s === 'understanding' ? 'preparing' : s), 4500);
    
    const result = await aiPromise;
    clearTimeout(t1); clearTimeout(t2);
    
    if (!result.success) {
      setProcState('error');
    } else {
      setProcState('ready');
      setTimeout(() => {
        router.push('/employer');
        router.refresh();
      }, 600);
    }
  }

  async function clientAction(formData: FormData) {
    setProcState('saving');
    
    const skillsStr = formData.get("skills") as string || "";
    const prefsStr = formData.get("preferred_skills") as string || "";
    const langsStr = formData.get("mandatory_languages") as string || "";
    
    const payload = {
      employer_id: employerId,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      location: formData.get("location") as string,
      employment_type: formData.get("employment_type") as string,
      salary_min_usd: parseInt(formData.get("salary_min_usd") as string) || 0,
      salary_max_usd: parseInt(formData.get("salary_max_usd") as string) || 0,
      experience_min_years: parseInt(formData.get("experience_min_years") as string) || 0,
      education_field: formData.get("education_field") as string || "Any",
      skills: skillsStr.split(',').map(s => s.trim()).filter(Boolean),
      preferred_skills: prefsStr.split(',').map(s => s.trim()).filter(Boolean),
      mandatory_languages: langsStr.split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      const { vacancy_id } = await createVacancyAction(payload);
      setCreatedVacancyId(vacancy_id!);
      await cycleAIProcessingStates(vacancy_id!);
    } catch (e) {
      console.error(e);
      alert("Vacancy could not be submitted. Please try again.");
      setProcState('idle');
    }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {procState !== 'idle' && (
        <ProcessingOverlay
          stages={processingStages}
          activeStageIndex={getStageIndex()}
          isError={procState === 'error'}
          onRetry={() => {
            if (createdVacancyId) cycleAIProcessingStates(createdVacancyId);
          }}
          onContinue={() => {
            router.push('/employer');
            router.refresh();
          }}
        />
      )}
      <Header role="employer" />
      <main className="container mx-auto p-4 md:p-8 space-y-8 max-w-4xl">

        <header className="border-b border-border pb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Create Vacancy
          </h1>
          <p className="text-muted-foreground mt-2">
            Establish deterministic requirements for AI Candidate Matching.
          </p>
        </header>

        <form action={clientAction} className="bg-card p-6 md:p-8 rounded-xl border border-border shadow-sm space-y-8">

          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-border pb-2">1. Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Position Title <span className="text-red-500">*</span></label>
                <Input name="title" required placeholder="e.g. Senior Next.js Developer" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location <span className="text-red-500">*</span></label>
                <Input name="location" required placeholder="e.g. Tashkent, Uzbekistan" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Employment Type</label>
                <Input name="employment_type" placeholder="e.g. Full-Time, Remote" />
              </div>
              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium">Min Salary (USD)</label>
                  <Input name="salary_min_usd" type="number" placeholder="1500" />
                </div>
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium">Max Salary (USD)</label>
                  <Input name="salary_max_usd" type="number" placeholder="2500" />
                </div>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <label className="text-sm font-medium">Job Description <span className="text-red-500">*</span></label>
              <textarea
                name="description"
                required
                className="w-full min-h-[150px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Describe the role and responsibilities..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-border pb-2 flex items-center justify-between">
              2. Core Requirements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">

              <div className="bg-muted/40 p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Mandatory</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold">Minimum Experience (Years)</label>
                    <Input name="experience_min_years" type="number" defaultValue={0} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold">Required Skills (Comma-separated)</label>
                    <Input name="skills" placeholder="React, TypeScript, PostgreSQL" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold">Required Languages</label>
                    <Input name="mandatory_languages" placeholder="Uzbek, English" />
                  </div>
                </div>
              </div>

              <div className="bg-muted/40 p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Preferred</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold">Preferred Skills (Bonus matching)</label>
                    <Input name="preferred_skills" placeholder="GraphQL, Docker, AWS" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold">Preferred Education / Sub-field</label>
                    <Input name="education_field" placeholder="Computer Science" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="flex justify-end gap-4 border-t border-border pt-6">
            <Button type="button" variant="ghost" disabled={procState !== 'idle'}>Save Draft</Button>
            <Button type="submit" disabled={procState !== 'idle'} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {procState !== 'idle' ? 'Publishing...' : 'Publish & Run Matches'}
            </Button>
          </div>

        </form>
      </main>
    </div>
  );
}
