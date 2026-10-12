"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useOnboarding, type OnboardingController } from "../hooks/use-onboarding";
import { STEPS } from "../steps";
import { BUBBLE_AVOID_ATTRIBUTE, FloatingBubbles } from "./floating-bubbles";
import { AddressStep } from "./steps/address-step";
import { BasicsStep } from "./steps/basics-step";
import { BuildingTypeStep } from "./steps/building-type-step";
import { ItemsStep } from "./steps/items-step";
import { RoomsStep } from "./steps/rooms-step";
import { WizardFooter } from "./wizard-footer";

const SKIP_LABELS: Partial<Record<(typeof STEPS)[number]["id"], string>> = {
  basics: "Skip",
  rooms: "Skip rooms",
  items: "Skip items",
};

/** One full screen per step. Steps slide in from the side they come from. */
export function OnboardingWizard() {
  const wizard = useOnboarding();
  const { step, stepIndex } = wizard;

  // Which way we moved, so the next step slides in from the right side (React's "store the previous value" pattern).
  const [shown, setShown] = useState({ index: stepIndex, direction: 1 });
  if (shown.index !== stepIndex) setShown({ index: stepIndex, direction: stepIndex > shown.index ? 1 : -1 });

  return (
    <div className="relative isolate flex min-h-svh flex-col bg-background">
      <FloatingBubbles />
      <header className="relative z-20 flex h-16 items-center justify-between px-4 sm:px-8">
        <Logo href="/signup" />
        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground" aria-label="Exit setup" onClick={wizard.exit}>
          <X />
        </Button>
      </header>

      <main
        className="relative z-[1] flex flex-1 justify-center px-4 pt-6 pb-32 sm:px-8 sm:pt-[8vh]"
        onKeyDown={(event) => {
          // Enter in a field continues, except inside a step's own small forms (like "Add an item").
          const target = event.target as HTMLElement;
          if (event.key === "Enter" && target.tagName === "INPUT" && !target.closest("form")) {
            event.preventDefault();
            wizard.next();
          }
        }}
      >
        <div
          key={step.id}
          {...{ [BUBBLE_AVOID_ATTRIBUTE]: "" }}
          className={cn(
            "flex w-full flex-col gap-8 animate-in duration-500 ease-out fade-in-0 motion-reduce:animate-none",
            step.id === "items" || step.id === "type" ? "max-w-3xl" : "max-w-xl",
            shown.direction > 0 ? "slide-in-from-right-12" : "slide-in-from-left-12",
          )}
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Step {stepIndex + 1} of {STEPS.length}
              {step.optional && " · Optional"}
            </p>
            <h1 className="text-4xl font-bold tracking-[-0.03em] sm:text-5xl">{step.title}</h1>
            <p className="text-lg text-muted-foreground">{step.description}</p>
          </div>

          <div className="animate-in delay-100 duration-500 fill-mode-both fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none">
            <StepBody wizard={wizard} />
          </div>
        </div>
      </main>

      <WizardFooter
        stepIndex={stepIndex}
        furthestIndex={wizard.furthestIndex}
        canGoBack={stepIndex > 0}
        canSkip={step.optional}
        isLastStep={wizard.isLastStep}
        skipLabel={SKIP_LABELS[step.id] ?? "Skip"}
        canGoTo={wizard.canGoTo}
        onGoTo={wizard.goTo}
        onBack={wizard.back}
        onSkip={wizard.skip}
        onNext={wizard.next}
      />
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
