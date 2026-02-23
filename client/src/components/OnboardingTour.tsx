import { useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Layers, Scale, Users, Network, Clock, BookOpen,
  ChevronRight, ChevronLeft, X, ArrowRight
} from "lucide-react";

interface TourStep {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to Rabbit Hole",
    description: "This platform is built for structured investigative research. Each investigation is broken into layers called Depth Nodes — starting broad and going deeper as you progress. Think of it as peeling back layers of a story, one at a time.",
    icon: Layers,
  },
  {
    title: "Claims & Evidence",
    description: "Every investigation contains claims — specific assertions supported by evidence. Each claim has a stance (supported, disputed, or speculative) and a confidence score. Sources are linked directly to claims so you can trace assertions back to their origin.",
    icon: Scale,
  },
  {
    title: "People Profiles",
    description: "Key individuals connected to investigations have dedicated profiles. You can see their involvement across cases, family connections, and background information. Profiles are linked throughout investigations wherever a person is referenced.",
    icon: Users,
  },
  {
    title: "Connections Graph",
    description: "The Connections view shows relationships between investigations and people as an interactive graph. You can zoom, pan, and drag nodes to explore how topics relate. Use the minimap for orientation and filters to focus on specific relationship types.",
    icon: Network,
  },
  {
    title: "Timeline & Library",
    description: "Investigations include timeline events that track key moments. The Library contains primary source texts (like the KJV Bible) that are referenced in investigations — citations link directly to specific verses and chapters.",
    icon: BookOpen,
  },
];

interface OnboardingTourProps {
  active: boolean;
  step: number;
  onNext: () => void;
  onPrev: () => void;
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingTour({ active, step, onNext, onPrev, onComplete, onSkip }: OnboardingTourProps) {
  const [, navigate] = useLocation();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!active) return;
    if (e.key === "Escape") onSkip();
    if (e.key === "ArrowRight" || e.key === "Enter") {
      if (step < TOUR_STEPS.length - 1) onNext();
      else onComplete();
    }
    if (e.key === "ArrowLeft" && step > 0) onPrev();
  }, [active, step, onNext, onPrev, onComplete, onSkip]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!active) return null;

  const currentStep = TOUR_STEPS[step];
  if (!currentStep) return null;

  const isLast = step === TOUR_STEPS.length - 1;
  const Icon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" data-testid="onboarding-tour">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onSkip} />

      <div className="relative w-full max-w-lg mx-4 bg-card border border-white/10 rounded-sm shadow-2xl" data-testid="tour-dialog">
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 text-muted-foreground/50 hover:text-white transition-colors"
          data-testid="button-tour-skip"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-sm flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
                Step {step + 1} of {TOUR_STEPS.length}
              </span>
              <h2 className="font-display text-lg font-bold" data-testid="text-tour-title">
                {currentStep.title}
              </h2>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-8" data-testid="text-tour-description">
            {currentStep.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${i === step ? "bg-primary" : i < step ? "bg-primary/40" : "bg-white/10"}`}
                  data-testid={`tour-dot-${i}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={onPrev}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono uppercase text-muted-foreground hover:text-white border border-white/10 hover:border-white/20 transition-colors"
                  data-testid="button-tour-prev"
                >
                  <ChevronLeft className="w-3 h-3" /> Back
                </button>
              )}
              {isLast ? (
                <button
                  onClick={() => {
                    onComplete();
                    navigate("/guide");
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono uppercase bg-primary text-white hover:bg-primary/80 transition-colors"
                  data-testid="button-tour-finish"
                >
                  Get Started <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <button
                  onClick={onNext}
                  className="flex items-center gap-1 px-4 py-1.5 text-xs font-mono uppercase bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                  data-testid="button-tour-next"
                >
                  Next <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={onSkip}
              className="text-[11px] font-mono text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              data-testid="button-tour-skip-text"
            >
              Skip tour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
