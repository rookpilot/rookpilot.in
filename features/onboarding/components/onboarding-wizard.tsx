"use client";

import { Logo } from "@/components/brand/logo";
import { Progress } from "@/components/ui/progress";

import { useOnboarding, type OnboardingController } from "../hooks/use-onboarding";
import { STEPS } from "../steps";
import { StepList } from "./step-list";
import { AddressStep } from "./steps/address-step";
import { BasicsStep } from "./steps/basics-step";
import { BuildingTypeStep } from "./steps/building-type-step";
import { ItemsStep } from "./steps/items-step";
import { RoomsStep } from "./steps/rooms-step";
import { WizardFooter } from "./wizard-footer";

const SKIP_LABELS: Partial<Record<(typeof STEPS)[number]["id"], string>> = {
  basics: "Skip",
  rooms: "Skip rooms and items",
  items: "Skip items",
};

export function OnboardingWizard() {
  const wizard = useOnboarding();
  const { step, stepIndex } = wizard;
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-16 items-center justify-between border-b bg-card px-4 sm:px-8">
        <Logo href="/signup" />
        <span className="font-mono text-xs text-muted-foreground">
          Step {stepIndex + 1} of {STEPS.length}
        </span>
      </header>

      <div className="mx-auto grid w-full max-w-5xl flex-1 gap-8 px-4 py-6 sm:py-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <StepList
            currentIndex={stepIndex}
            furthestIndex={wizard.furthestIndex}
            canGoTo={wizard.canGoTo}
            onSelect={wizard.goTo}
          />
        </aside>

        <main className="flex min-w-0 flex-col gap-6">
          <Progress value={progress} className="lg:hidden" aria-label="Onboarding progress" />

          <div className="flex flex-col gap-6 rounded-xl border bg-card p-5 sm:p-8">
            <div className="flex flex-col gap-1.5">
              <p className="eyebrow">
                {step.label}
                {step.optional && <span className="text-muted-foreground"> · optional</span>}
              </p>
              <h1 className="text-2xl font-bold tracking-[-0.02em] sm:text-3xl">{step.title}</h1>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>

            <StepBody wizard={wizard} />

            <WizardFooter
              canGoBack={stepIndex > 0}
              canSkip={step.optional}
              isLastStep={wizard.isLastStep}
              skipLabel={SKIP_LABELS[step.id] ?? "Skip"}
              onBack={wizard.back}
              onSkip={wizard.skip}
              onNext={wizard.next}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

/** Maps the current step to its component, passing only the props it needs. */
function StepBody({ wizard }: { wizard: OnboardingController }) {
  const { draft, errors } = wizard;

  switch (wizard.step.id) {
    case "address":
      return <AddressStep address={draft.address} errors={errors} onChange={wizard.updateAddress} />;
    case "type":
      return <BuildingTypeStep value={draft.buildingType} error={errors.buildingType} onChange={wizard.setBuildingType} />;
    case "basics":
      return (
        <BasicsStep
          basics={draft.basics}
          buildingType={draft.buildingType}
          fallbackName={draft.address.line1.trim() || "My building"}
          onChange={wizard.updateBasics}
        />
      );
    case "rooms":
      return (
        <RoomsStep
          rooms={draft.rooms}
          errors={errors}
          onAdd={() => wizard.rooms.add()}
          onUpdate={wizard.rooms.update}
          onRemove={wizard.rooms.remove}
          onReset={wizard.rooms.resetToSuggestions}
        />
      );
    case "items":
      return (
        <ItemsStep
          rooms={draft.rooms}
          items={draft.items}
          totals={wizard.totals}
          onToggle={wizard.items.toggle}
          onCountChange={wizard.items.setCount}
          onRemove={wizard.items.remove}
          onAdd={wizard.items.add}
        />
      );
  }
}
