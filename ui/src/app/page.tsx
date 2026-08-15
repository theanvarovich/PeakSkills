import Link from "next/link";
import { Header } from "@/components/shared/Header";
import { WordmarkLogo } from "@/components/shared/WordmarkLogo";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <div className="flex flex-col flex-1 items-center justify-center p-8 lg:p-24 relative overflow-hidden">
        {/* Background Graphic Subtlety */}
        <div className="absolute top-0 right-0 -m-32 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -m-32 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl w-full text-center space-y-16 z-10">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-foreground leading-tight">
              The ultimate bridge between{" "}
              <span className="text-primary italic font-light">education</span>{" "}
              and{" "}
              <span className="text-primary italic font-light">employment.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              PeakSkills uses intelligent AI deterministic profiling to connect exceptional students and seasoned professionals directly with verified market opportunities. Try our matching engine instantly.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-6 justify-center items-stretch mt-10">
            {/* Candidate Demo */}
            <Link href="/demo/candidate" className="group flex flex-col space-y-6 p-10 border border-border rounded-xl bg-card w-full max-w-md text-left shadow-sm hover:shadow-md transition-all hover:border-primary/50 cursor-pointer">
              <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
              </div>
              <div>
                <h3 className="font-semibold text-2xl text-foreground mb-2 group-hover:text-primary transition-colors">Candidate</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Find opportunities that match your precise profile.
                </p>
                <div className="inline-flex font-semibold text-sm text-primary items-center group-hover:underline">
                  Try AI Matching &rarr;
                </div>
              </div>
            </Link>

            {/* Employer Demo */}
            <Link href="/demo/employer" className="group flex flex-col space-y-6 p-10 border border-border rounded-xl bg-card w-full max-w-md text-left shadow-sm hover:shadow-md transition-all hover:border-primary/50 cursor-pointer">
              <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              </div>
              <div>
                <h3 className="font-semibold text-2xl text-foreground mb-2 group-hover:text-primary transition-colors">Employer</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Find the best candidates for your exact vacancy.
                </p>
                <div className="inline-flex font-semibold text-sm text-primary items-center group-hover:underline">
                  Try AI Matching &rarr;
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
