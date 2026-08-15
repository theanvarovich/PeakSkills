'use client';

import { useState } from 'react';
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoAnalyzeVacancy } from "@/app/actions/demo";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { MatchScore } from "@/components/shared/MatchScore";
import { Candidate, MatchScoreBreakdown, AIExplanation } from '@/types';
import { VacancyAnalysisResult } from '@/lib/ai/interfaces';

type CandidateMatchData = {
  candidate: Candidate;
  breakdown: MatchScoreBreakdown;
  explanation: AIExplanation;
  rank: number;
};

export default function EmployerDemoPage() {
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  
  const [requiredSkills, setRequiredSkills] = useState("");
  const [preferredSkills, setPreferredSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  
  const [description, setDescription] = useState("");

  const [procState, setProcState] = useState<'idle'|'analyzing'|'understanding'|'preparing'|'ready'|'error'>('idle');
  const [analysis, setAnalysis] = useState<VacancyAnalysisResult | null>(null);
  const [matches, setMatches] = useState<CandidateMatchData[]>([]);

  const processingStages = [
    "Reading vacancy context",
    "Extracting core requirements",
    "Classifying seniority & domains",
    "Scanning 70 candidate profiles",
    "Ranking completed"
  ];

  const getStageIndex = () => {
    switch (procState) {
      case 'analyzing': return 0;
      case 'understanding': return 1;
      case 'preparing': return 3;
      case 'ready': return 4;
      default: return 0;
    }
  };

  const isFormValid = () => {
    return title.trim() !== "" && requiredSkills.trim() !== "" && description.trim() !== "";
  };

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    // Combine structured fields into a single payload for Gemini
    const combinedDescription = `
Company: ${company}
Location: ${location}

Requirements:
- Required Skills: ${requiredSkills}
- Preferred Skills: ${preferredSkills}
- Experience: ${experience}
- Education/Languages: ${education}

Job Description:
${description}
    `.trim();

    setProcState('analyzing');
    
    // Cycle aesthetic UI states
    const t1 = setTimeout(() => setProcState(s => s === 'analyzing' ? 'understanding' : s), 2000);
    const t2 = setTimeout(() => setProcState(s => s === 'understanding' ? 'preparing' : s), 4500);

    const result = await demoAnalyzeVacancy(title, combinedDescription);
    
    clearTimeout(t1); clearTimeout(t2);

    if (result.success && result.analysis && result.topMatches) {
      setAnalysis(result.analysis);
      setMatches(result.topMatches);
      setProcState('ready');
    } else {
      setProcState('error');
    }
  };

  const retry = () => {
    setProcState('idle');
    setAnalysis(null);
    setMatches([]);
  };

  const useSample = () => {
    setCompany("PeakSkills Partner");
    setTitle("Senior React Engineer");
    setLocation("Remote (US or Europe)");
    setRequiredSkills("React, Next.js, TypeScript, TailwindCSS");
    setPreferredSkills("PostgreSQL, GraphQL, Docker");
    setExperience("5+ years of experience");
    setEducation("B.S. in Computer Science (Preferred) / English Fluent");
    setDescription("We are looking for an expert React developer to lead our UI architecture. You will be responsible for defining our component standards, building scalable frontends, and collaborating with backend engineers on microservices.");
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      {procState !== 'idle' && procState !== 'ready' && (
        <ProcessingOverlay 
          stages={processingStages} 
          activeStageIndex={getStageIndex()} 
          isError={procState === 'error'}
          onRetry={retry}
          errorDescription="AI extraction could not be completed for this vacancy."
        />
      )}

      <Header />
      <main className="container mx-auto p-4 md:p-8 space-y-12 max-w-5xl mt-6">
        
        {procState === 'idle' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <header className="text-center space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                Employer AI Matching Demo
              </h1>
              <p className="text-muted-foreground text-lg">
                Enter your job requirements below. Our AI will extract the key competencies and instantly rank the best candidates from our talent pool.
              </p>
            </header>

            <form onSubmit={handleDemoSubmit} className="space-y-6">
              
              {/* 1. COMPANY & VACANCY */}
              <div className="bg-card p-6 md:p-8 rounded-xl border border-border shadow-sm space-y-4">
                <h2 className="text-lg font-semibold border-b border-border pb-2">1. Company & Vacancy</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Name</label>
                    <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Corp" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Job Title *</label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Remote" />
                  </div>
                </div>
              </div>

              {/* 2. REQUIREMENTS */}
              <div className="bg-card p-6 md:p-8 rounded-xl border border-border shadow-sm space-y-4">
                <h2 className="text-lg font-semibold border-b border-border pb-2">2. Requirements</h2>
                <div className="grid grid-cols-1 gap-6 pt-2">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-primary">Required Skills (Comma separated) *</label>
                      <Input value={requiredSkills} onChange={(e) => setRequiredSkills(e.target.value)} placeholder="React, TypeScript, Node.js" className="border-primary/30" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Preferred Skills</label>
                      <Input value={preferredSkills} onChange={(e) => setPreferredSkills(e.target.value)} placeholder="Docker, AWS, GraphQL" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Experience Required</label>
                      <Input value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 5+ years" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Education / Languages</label>
                      <Input value={education} onChange={(e) => setEducation(e.target.value)} placeholder="e.g. B.S. IT / English" />
                    </div>
                  </div>

                </div>
              </div>

              {/* 3. JOB DESCRIPTION */}
              <div className="bg-card p-6 md:p-8 rounded-xl border border-border shadow-sm space-y-4">
                <h2 className="text-lg font-semibold border-b border-border pb-2">3. Job Description</h2>
                <div className="pt-2">
                  <label className="text-sm font-medium block mb-2">Responsibilities / Description *</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="w-full min-h-[120px] p-4 text-sm bg-background border border-border rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                    placeholder="Describe the day-to-day responsibilities, what the candidate will build, and team culture..."
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4">
                 <Button 
                  type="button" 
                  variant="outline"
                  onClick={useSample}
                  className="flex-1 font-medium py-6 text-base"
                >
                  Use Sample Vacancy
                </Button>
                <Button 
                  type="submit" 
                  disabled={!isFormValid() || procState !== 'idle'} 
                  className="flex-[2] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg"
                >
                  {procState !== 'idle' ? 'Processing...' : 'Find Matching Candidates'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {procState === 'ready' && analysis && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Analysis Result Banner */}
            <div className="bg-card border border-border p-8 rounded-xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              <div className="flex flex-col md:flex-row gap-8 justify-between">
                <div className="space-y-4 flex-1">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-1">AI Extracted Vacancy Data</h4>
                    <h2 className="text-2xl font-bold text-foreground">{title}</h2>
                    <p className="text-sm font-medium mt-1">Found in description: {analysis.role_category} • {analysis.seniority_level} • {analysis.employment_type} • {analysis.location_requirements}</p>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">{analysis.key_requirements_summary}</p>
                </div>
                <div className="space-y-4 md:w-64">
                   <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Mandatory Skills</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.mandatory_skills.map((s: string) => <span key={`man-${s}`} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-semibold">{s}</span>)}
                        {analysis.mandatory_skills.length === 0 && <span className="text-muted-foreground text-sm">None explicitly found</span>}
                      </div>
                   </div>
                   <div className="pt-2 border-t border-border">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Preferred / Nice-to-have</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.preferred_skills.map((s: string) => <span key={`pref-${s}`} className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs">{s}</span>)}
                        {analysis.preferred_skills.length === 0 && <span className="text-muted-foreground text-sm">None explicitly found</span>}
                      </div>
                   </div>
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-border flex justify-end">
                <Button variant="outline" onClick={retry}>Test Another Vacancy</Button>
              </div>
            </div>

            {/* Matches */}
            <div>
              <header className="mb-6">
                <h3 className="text-2xl font-semibold">Top Ranked Candidates</h3>
                <p className="text-muted-foreground mt-1">Scanned 70 mock candidates based on the AI-extracted requirements.</p>
              </header>
              <div className="space-y-8">
                {matches.map(({ candidate, breakdown, explanation, rank }) => (
                  <div key={candidate.id} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm p-6 relative overflow-hidden">
                      <div className={`absolute top-0 right-0 px-4 py-2 rounded-bl-xl font-bold tracking-widest text-sm border-b border-l ${rank <= 3 ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`}>
                        RANK #{rank}
                      </div>
                      
                      <div className="pr-20 space-y-4">
                        <div>
                          <h3 className="text-2xl font-semibold text-foreground">{candidate.name}</h3>
                          <p className="text-primary font-medium mt-1">{candidate.headline}</p>
                          <div className="text-sm text-muted-foreground mt-2 flex flex-wrap items-center gap-4">
                            <span className="bg-muted px-2 py-0.5 rounded text-xs font-semibold uppercase">{candidate.candidate_type}</span>
                            <span>{candidate.experienceYears} Years Exp.</span>
                            {candidate.education?.degree && <span>{candidate.education.degree} {candidate.education.field_of_study}</span>}
                          </div>
                        </div>
                        
                        <div className="bg-muted/50 p-4 rounded-lg border border-border/50 text-sm leading-relaxed text-foreground/80">
                          <span className="font-semibold text-foreground">Why this match? </span> 
                          {explanation.summary}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                          <div>
                            <h4 className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-2">Matched Requirements</h4>
                            <div className="flex flex-wrap gap-2">
                              {explanation.matchedRequirements.map((req: string) => (
                                <span key={req} className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 px-2 py-1 rounded">{req}</span>
                              ))}
                              {explanation.matchedRequirements.length === 0 && <span className="text-xs text-muted-foreground">None</span>}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Missing Requirements</h4>
                            <div className="flex flex-wrap gap-2">
                              {explanation.missingMandatoryRequirements.map((req: string) => (
                                <span key={`man-${req}`} className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded">{req}</span>
                              ))}
                              {explanation.missingPreferredRequirements.map((req: string) => (
                                <span key={`pref-${req}`} className="text-xs bg-muted text-muted-foreground border border-border px-2 py-1 rounded">{req} (Pref)</span>
                              ))}
                              {(explanation.missingMandatoryRequirements.length === 0 && explanation.missingPreferredRequirements.length === 0) && (
                                <span className="text-xs text-muted-foreground">None</span>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                    <div>
                      <MatchScore breakdown={breakdown} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
