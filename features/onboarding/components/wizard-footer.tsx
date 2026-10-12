import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";

import { StepDots } from "./step-dots";

interface WizardFooterProps {
  stepIndex: number;
  furthestIndex: number;
  canGoBack: boolean;
  canSkip: boolean;
  isLastStep: boolean;
  skipLabel: string;
  canGoTo: (index: number) => boolean;
  onGoTo: (index: number) => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
}

/** Pinned to the bottom: Back on the left, step dots in the middle, Skip and Continue on the right. */
export function WizardFooter({ stepIndex, furthestIndex, canGoBack, canSkip, isLastStep, skipLabel, canGoTo, onGoTo, onBack, onSkip, onNext }: WizardFooterProps) {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto grid h-20 max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-8">
        <div>
          {canGoBack && (
            <Button type="button" variant="ghost" size="lg" className="rounded-full px-3" onClick={onBack}>
              <ArrowLeft data-icon="inline-start" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          )}
        </div>

        <StepDots currentIndex={stepIndex} furthestIndex={furthestIndex} canGoTo={canGoTo} onSelect={onGoTo} />

        <div className="flex items-center justify-end gap-1 sm:gap-2">
          {canSkip && (
            <Button type="button" variant="ghost" size="lg" className="rounded-full px-3 text-muted-foreground" onClick={onSkip}>
              <span className="sm:hidden">Skip</span>
              <span className="hidden sm:inline">{skipLabel}</span>
            </Button>
          )}
          <Button type="button" size="lg" className="h-11 rounded-full px-4 text-[15px] sm:px-5" onClick={onNext}>
            {isLastStep ? "Finish" : "Continue"}
            {isLastStep ? <Check data-icon="inline-end" /> : <ArrowRight data-icon="inline-end" />}
          </Button>
        </div>
      </div>
    </footer>
  );
}
