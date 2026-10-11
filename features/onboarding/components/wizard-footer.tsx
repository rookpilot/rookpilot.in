import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface WizardFooterProps {
  canGoBack: boolean;
  canSkip: boolean;
  isLastStep: boolean;
  skipLabel: string;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
}

export function WizardFooter({ canGoBack, canSkip, isLastStep, skipLabel, onBack, onSkip, onNext }: WizardFooterProps) {
  return (
    <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center gap-2 rounded-b-2xl border-t bg-card/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:-mb-8 sm:px-8">
      {canGoBack && (
        <Button type="button" variant="ghost" size="lg" onClick={onBack}>
          <ArrowLeft data-icon="inline-start" />
          Back
        </Button>
      )}
      <div className="ml-auto flex items-center gap-2">
        {canSkip && (
          <Button type="button" variant="ghost" size="lg" className="text-muted-foreground" onClick={onSkip}>
            {skipLabel}
          </Button>
        )}
        <Button type="button" size="lg" className="px-4" onClick={onNext}>
          {isLastStep ? "Finish" : "Next"}
          {!isLastStep && <ArrowRight data-icon="inline-end" />}
        </Button>
      </div>
    </div>
  );
}
