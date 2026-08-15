'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessingOverlayProps {
  stages: string[];
  activeStageIndex: number;
  isError?: boolean;
  onRetry?: () => void;
  onContinue?: () => void;
  errorDescription?: string;
  continueText?: string;
}

export function ProcessingOverlay({ 
  stages, 
  activeStageIndex, 
  isError, 
  onRetry, 
  onContinue,
  errorDescription = "Your vacancy was saved, but AI analysis could not be completed.",
  continueText = "Continue to vacancy"
}: ProcessingOverlayProps) {
  // Respect prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const logoText = "PeakSkills";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="bg-card border border-border shadow-lg rounded-2xl p-8 max-w-md w-full mx-4 flex flex-col items-center text-center"
        aria-live="polite"
        role="status"
      >
        
        {/* Compact Logo Animation */}
        <div className="mb-8 flex items-center justify-center space-x-1 font-bold text-2xl tracking-tighter">
          {logoText.split('').map((char, i) => (
            <span
              key={i}
              className={`text-foreground ${
                !prefersReducedMotion && !isError ? 'animate-fade-in-right' : ''
              }`}
              style={{
                animationDelay: !prefersReducedMotion && !isError ? `${i * 100}ms` : '0ms',
                animationFillMode: 'both'
              }}
            >
              {char}
            </span>
          ))}
        </div>

        {isError && (
          <div className="space-y-4 w-full">
            <h3 className="text-lg font-semibold text-destructive">Processing Incomplete</h3>
            <p className="text-sm text-muted-foreground">
              {errorDescription}
            </p>
            <div className="flex gap-3 mt-6 w-full">
              {onRetry && (
                <button 
                  onClick={onRetry}
                  className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
                >
                  Retry analysis
                </button>
              )}
              {onContinue && (
                <button 
                  onClick={onContinue}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  {continueText}
                </button>
              )}
            </div>
          </div>
        )}

        {!isError && (
          <div className="space-y-3 w-full text-left">
            {stages.map((stage, idx) => {
              const isActive = idx === activeStageIndex;
              const isPast = idx < activeStageIndex;
              
              return (
                <div 
                  key={stage}
                  className={`flex items-center space-x-3 text-sm font-medium transition-all duration-500 ${
                    isActive ? 'text-primary scale-105 origin-left' : 
                    isPast ? 'text-muted-foreground' : 
                    'text-muted-foreground/40'
                  }`}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    {isActive ? (
                      <Loader2 className={`w-4 h-4 text-primary ${!prefersReducedMotion ? 'animate-spin' : ''}`} />
                    ) : isPast ? (
                      <div className="w-2 h-2 rounded-full bg-primary/60" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-border" />
                    )}
                  </div>
                  <span>{stage}</span>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
