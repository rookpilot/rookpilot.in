"use client";

import { useRouter } from "next/navigation";
import { useReducer } from "react";

import type { Address, BuildingBasics, BuildingType } from "@/lib/domain/building";
import type { RoomKind } from "@/lib/domain/room";
import { ITEM_TEMPLATES, suggestItemTemplates } from "@/lib/templates/items";
import { suggestRooms } from "@/lib/templates/rooms";

import { hasErrors, summarize, validateStep } from "../selectors";
import { EMPTY_BASICS, INITIAL_STATE, onboardingReducer, type ItemDraft, type OnboardingDraft, type RoomDraft } from "../state";
import { LAST_STEP_INDEX, STEPS } from "../steps";

/** Where the wizard ends until Home exists (PR 2). Nothing is saved in phase 1. */
const AFTER_ONBOARDING_PATH = "/app";

const newId = () => crypto.randomUUID();

function suggestedRoomDrafts(draft: OnboardingDraft): RoomDraft[] {
  return suggestRooms(draft.buildingType, draft.basics).map((room) => ({ id: newId(), ...room }));
}

function suggestedItemDrafts(rooms: RoomDraft[], buildingType: BuildingType | null): ItemDraft[] {
  return rooms.flatMap((room) =>
    suggestItemTemplates(room.kind, buildingType).map((template) => ({
      id: newId(),
      roomId: room.id,
      templateKey: template.key,
      name: template.name,
      count: 1,
      selected: true,
    })),
  );
}

const TEMPLATE_BY_NAME = new Map(ITEM_TEMPLATES.map((t) => [t.name.toLowerCase(), t]));

export function useOnboarding() {
  const router = useRouter();
  const [state, dispatch] = useReducer(onboardingReducer, INITIAL_STATE);
  const { draft, stepIndex } = state;

  const step = STEPS[stepIndex];
  const errors = validateStep(step.id, draft);
  const isLastStep = stepIndex === LAST_STEP_INDEX;

  /**
   * Fill in suggestions the first time a step is reached, then move to it.
   * `current` lets a caller pass the draft as it will be after a dispatch that hasn't rendered yet.
   */
  function enterStep(index: number, current: OnboardingDraft = draft) {
    const target = STEPS[index]?.id;
    let rooms = current.rooms;

    if ((target === "rooms" || target === "items") && !current.roomsSeeded) {
      rooms = suggestedRoomDrafts(current);
      dispatch({ type: "setRooms", rooms });
    }
    if (target === "items") {
      const unseeded = rooms.filter((room) => !current.itemsSeededFor.includes(room.id));
      if (unseeded.length > 0) {
        dispatch({
          type: "seedItems",
          items: suggestedItemDrafts(unseeded, current.buildingType),
          roomIds: unseeded.map((room) => room.id),
        });
      }
    }
    dispatch({ type: "goTo", index });
  }

  function finish() {
    // Next.js keeps visited pages mounted (Cache Components), so start fresh
    // for the next visit instead of reopening on the last step.
    dispatch({ type: "reset" });
    router.push(AFTER_ONBOARDING_PATH);
  }

  function next() {
    if (hasErrors(errors)) {
      dispatch({ type: "showErrors" });
      return;
    }
    if (isLastStep) finish();
    else enterStep(stepIndex + 1);
  }

  function back() {
    dispatch({ type: "goTo", index: stepIndex - 1 });
  }

  /** Skipping leaves the step empty. Skipping rooms also skips items, since items need a room. */
  function skip() {
    switch (step.id) {
      case "basics":
        dispatch({ type: "clearBasics" });
        enterStep(stepIndex + 1, { ...draft, basics: EMPTY_BASICS });
        break;
      case "rooms":
        dispatch({ type: "clearRooms" });
        finish();
        break;
      case "items":
        dispatch({ type: "clearItems" });
        finish();
        break;
    }
  }

  /** Steps already reached can be revisited. Moving forward still requires the current step to be valid. */
  function canGoTo(index: number) {
    if (index > state.furthestIndex) return false;
    return index <= stepIndex || !hasErrors(errors);
  }

  function goTo(index: number) {
    if (canGoTo(index)) enterStep(index);
  }

  const rooms = {
    add(kind: RoomKind = "other") {
      dispatch({ type: "addRoom", room: { id: newId(), name: "", kind } });
    },
    update(id: string, patch: Partial<Omit<RoomDraft, "id">>) {
      dispatch({ type: "updateRoom", id, patch });
    },
    remove(id: string) {
      dispatch({ type: "removeRoom", id });
    },
    resetToSuggestions() {
      dispatch({ type: "setRooms", rooms: suggestedRoomDrafts(draft) });
    },
  };

  const items = {
    toggle(id: string, selected: boolean) {
      dispatch({ type: "updateItem", id, patch: { selected } });
    },
    setCount(id: string, count: number) {
      dispatch({ type: "updateItem", id, patch: { count } });
    },
    remove(id: string) {
      dispatch({ type: "removeItem", id });
    },
    /** Adds a template item when the name matches one, otherwise a custom item. */
    add(roomId: string, name: string) {
      const trimmed = name.trim();
      if (!trimmed) return;
      const template = TEMPLATE_BY_NAME.get(trimmed.toLowerCase());
      dispatch({
        type: "addItem",
        item: {
          id: newId(),
          roomId,
          templateKey: template?.key ?? null,
          name: template?.name ?? trimmed,
          count: 1,
          selected: true,
        },
      });
    },
  };

  return {
    step,
    stepIndex,
    furthestIndex: state.furthestIndex,
    isLastStep,
    draft,
    errors: state.showErrors ? errors : {},
    totals: summarize(draft),
    next,
    back,
    skip,
    goTo,
    canGoTo,
    updateAddress: (patch: Partial<Address>) => dispatch({ type: "updateAddress", patch }),
    setBuildingType: (buildingType: BuildingType) => dispatch({ type: "setBuildingType", buildingType }),
    updateBasics: (patch: Partial<BuildingBasics>) => dispatch({ type: "updateBasics", patch }),
    rooms,
    items,
  };
}

export type OnboardingController = ReturnType<typeof useOnboarding>;
