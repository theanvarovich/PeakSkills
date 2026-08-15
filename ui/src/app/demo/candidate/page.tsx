'use client';

import { useState } from 'react';
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoAnalyzeCandidate } from "@/app/actions/demo";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { MatchScore } from "@/components/shared/MatchScore";
import { Vacancy, MatchScoreBreakdown, AIExplanation } from '@/types';
import { CandidateAnalysisResult } from '@/lib/ai/interfaces';

type MatchData = {
  vacancy: Vacancy;
  breakdown: MatchScoreBreakdown;
  explanation: AIExplanation;
  rank: number;
};

export default function CandidateDemoPage() {
  const [name, setName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [location, setLocation] = useState("");
  
  const [skills, setSkills] = useState("");
  const [expYears, setExpYears] = useState("");
  const [education, setEducation] = useState("");
  const [languages, setLanguages] = useState("");
  
  const [summary, setSummary] = useState("");

  const [procState, setProcState] = useState<'idle'|'analyzing'|'understanding'|'preparing'|'ready'|'error'>('idle');
  const [analysis, setAnalysis] = useState<CandidateAnalysisResult | null>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);

  const processingStages = [
    "Receiving CV payload",
    "Extracting core competencies",
    "Mapping to deterministic domains",
    "Matching against 40 open vacancies",
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
    return targetRole.trim() !== "" && skills.trim() !== "";
  };

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    // Combine structured fields into a single profile payload for Gemini
    const cvText = `
Name: ${name}
Target Role: ${targetRole}
Location: ${location}
Skills: ${skills}
Experience years: ${expYears}
Education: ${education}
Languages: ${languages}
Summary: ${summary}
    `.trim();

    setProcState('analyzing');
    
    // Cycle aesthetic UI states
    const t1 = setTimeout(() => setProcState(s => s === 'analyzing' ? 'understanding' : s), 2000);
    const t2 = setTimeout(() => setProcState(s => s === 'understanding' ? 'preparing' : s), 4500);

    const result = await demoAnalyzeCandidate(cvText);
    
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
    setName("Alex Chen");
    setTargetRole("Senior Software Engineer");
    setLocation("Remote (US)");
    setSkills("React, Python, Node.js, GraphQL, PostgreSQL, Microservices");
    setExpYears("5");
    setEducation("B.S. in Computer Science - Demo University");
    setLanguages("English (Native), Mandarin (Fluent)");
    setSummary("I am a Senior Software Engineer with 5+ years experience in Full-Stack development. I have built scalable microservices and led teams of 4 developers. Passionate about AI and scalable systems.");
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      {procState !== 'idle' && procState !== 'ready' && (
        <ProcessingOverlay 
          stages={processingStages} 
          activeStageIndex={getStageIndex()} 
          isError={procState === 'error'}
          onRetry={retry}
          errorDescription="Candidate profiling analysis could not be completed."
        />
      )}

      <Header />
      <main className="container mx-auto p-4 md:p-8 space-y-12 max-w-5xl mt-6">
        
        {procState === 'idle' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <header className="text-center space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                Candidate AI Matching Demo
              </h1>
              <p className="text-muted-foreground text-lg">
                Enter your profile details below. Our AI will analyze your profile and match you against real sample vacancies.
              </p>
            </header>

            <form onSubmit={handleDemoSubmit} className="space-y-6">
              
              {/* 1. ABOUT YOU */}
              <div className="bg-card p-6 md:p-8 rounded-xl border border-border shadow-sm space-y-4">
                <h2 className="text-lg font-semibold border-b border-border pb-2">1. About You</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex Chen" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Target Role *</label>
                    <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Senior Frontend Engineer" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Remote" />
                  </div>
                </div>
              </div>

              {/* 2. SKILLS & EXPERIENCE */}
              <div className="bg-card p-6 md:p-8 rounded-xl border border-border shadow-sm space-y-4">
                <h2 className="text-lg font-semibold border-b border-border pb-2">2. Skills & Experience</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Core Skills (comma separated) *</label>
                    <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, Node.js" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Years of Experience</label>
                    <Input type="number" value={expYears} onChange={(e) => setExpYears(e.target.value)} placeholder="5" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Education</label>
                    <Input value={education} onChange={(e) => setEducation(e.target.value)} placeholder="B.S. in Computer Science" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Languages</label>
                    <Input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="English Native" />
                  </div>
                </div>
              </div>

              {/* 3. PROFILE */}
              <div className="bg-card p-6 md:p-8 rounded-xl border border-border shadow-sm space-y-4">
                <h2 className="text-lg font-semibold border-b border-border pb-2">3. Profile Summary</h2>
                <div className="pt-2">
                  <label className="text-sm font-medium block mb-2">Short About / CV Summary</label>
                  <textarea 
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full min-h-[120px] p-4 text-sm bg-background border border-border rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                    placeholder="Briefly describe your career achievements and what you're looking for..."
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
                  Use Sample Candidate
                </Button>
                <Button 
                  type="submit" 
                  disabled={!isFormValid() || procState !== 'idle'} 
                  className="flex-[2] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg"
                >
                  {procState !== 'idle' ? 'Processing...' : 'Analyze My Profile'}
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
                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-1">AI Extracted Profile</h4>
                    <h2 className="text-2xl font-bold text-foreground">{analysis.professional_summary}</h2>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">{analysis.experience_summary}</p>
                </div>
                <div className="space-y-4 md:w-64">
                   <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Detected Skills</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.normalized_skills.map((s: string) => <span key={s} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-semibold">{s}</span>)}
                        {analysis.inferred_skills.map((s: string) => <span key={s} className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs">{s} (inferred)</span>)}
                      </div>
                   </div>
                   <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Seniority</h4>
                      <div className="text-sm font-semibold">{analysis.seniority_level}</div>
                   </div>
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-border flex justify-end">
                <Button variant="outline" onClick={retry}>Reset Demo</Button>
              </div>
            </div>

            {/* Matches */}
            <div>
              <header className="mb-6">
                <h3 className="text-2xl font-semibold">Your Top Job Matches</h3>
                <p className="text-muted-foreground mt-1">Based on deterministic scoring against your AI-extracted profile.</p>
              </header>
              <div className="space-y-8">
                {matches.map(({ vacancy, breakdown, explanation, rank }) => (
                  <div key={vacancy.id} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm p-6 relative overflow-hidden">
                      <div className={`absolute top-0 right-0 px-4 py-2 rounded-bl-xl font-bold tracking-widest text-sm border-b border-l ${rank <= 3 ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`}>
                        RANK #{rank}
                      </div>
                      
                      <div className="pr-20 space-y-4">
                        <div>
                          <h3 className="text-2xl font-semibold text-foreground">{vacancy.title}</h3>
                          <p className="text-muted-foreground text-sm mt-1">{vacancy.location} • {vacancy.employment_type} • Min Experience: {vacancy.requirements.experience_years} years</p>
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
