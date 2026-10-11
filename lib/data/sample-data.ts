import { addInterval, shiftDays } from "@/lib/dates";
import type { Address, BuildingType } from "@/lib/domain/building";
import type { Building, Hemisphere, ISODate, Schedule, Space } from "@/lib/domain/models";
import type { IntervalUnit, RepeatRule } from "@/lib/domain/schedule";
import { computeNextDue } from "@/lib/scheduling";
import { suggestItemTemplates } from "@/lib/templates/items";
import { suggestRooms } from "@/lib/templates/rooms";

import { buildItems, type IdFactory } from "./builders";
import { SAMPLE_CONTACTS, sampleLogs, sampleWork } from "./sample-people-and-work";
import type { AppData } from "./types";

/**
 * How far through its cycle each sample interval timer is (1 = due today, above 1 = late).
 * Cycled across timers so the sample building has a realistic mix of overdue, due-soon,
 * and later tasks.
 */
const CYCLE_PROGRESS = [0.35, 1.1, 0.6, 0.92, 0.2, 1.04, 0.75, 0.5, 0.97, 0.15, 0.85, 1.2, 0.4, 0.65];
/** Caps how late a sample timer can be, varied so overdue tasks aren't all equally late. */
const MAX_DAYS_LATE = [4, 11, 2, 19, 7];
const UNIT_DAYS: Record<IntervalUnit, number> = { day: 1, week: 7, month: 30, year: 365 };

/** Picks a believable next due date for a sample timer, then works back to when it was last done. */
function sampleDates(rule: RepeatRule, today: ISODate, index: number, hemisphere: Hemisphere) {
  if (rule.kind === "seasonal") {
    // Seasonal tasks are shown as done last season and due at the next season start.
    const nextDueOn = computeNextDue(rule, today, hemisphere);
    return { nextDueOn, lastDoneOn: shiftDays(nextDueOn, -Math.round(365 / rule.seasons.length)) };
  }
  const cycle = rule.count * UNIT_DAYS[rule.unit];
  const progress = CYCLE_PROGRESS[index % CYCLE_PROGRESS.length];
  const maxLate = MAX_DAYS_LATE[index % MAX_DAYS_LATE.length];
  const daysUntilDue = Math.max(Math.round(cycle * (1 - progress)), -maxLate);
  const nextDueOn = shiftDays(today, daysUntilDue);
  return { nextDueOn, lastDoneOn: addInterval(nextDueOn, -rule.count, rule.unit) };
}

function sequentialIds(prefix: string): IdFactory {
  let n = 0;
  return () => `${prefix}-${++n}`;
}

interface SampleBuildingSpec {
  id: string;
  name: string;
  type: BuildingType;
  address: Address;
  beds: number;
  baths: number;
  yearBuilt: number;
  sqft: number;
}

function sampleBuilding(spec: SampleBuildingSpec, today: ISODate, offsetStart: number) {
  const newId = sequentialIds(spec.id);
  const building: Building = { ...spec, hemisphere: "north" };

  const spaces: Space[] = suggestRooms(spec.type, { beds: String(spec.beds), baths: String(spec.baths) }).map((room) => ({
    id: newId(),
    buildingId: spec.id,
    ...room,
  }));

  const built = spaces.map((space) =>
    suggestItemTemplates(space.kind, spec.type).map((template) =>
      buildItems(
        { buildingId: spec.id, spaceId: space.id, name: template.name, template, count: 1, installedOn: null, hemisphere: "north", today },
        newId,
      ),
    ),
  );
  const items = built.flat().flatMap((b) => b.items);

  const schedules: Schedule[] = built
    .flat()
    .flatMap((b) => b.schedules)
    .map((schedule, index) => ({
      ...schedule,
      ...sampleDates(schedule.repeat, today, index + offsetStart, building.hemisphere),
    }));

  return { building, spaces, items, schedules, logs: sampleLogs({ buildingId: spec.id, items, schedules, today }) };
}

/**
 * Two example buildings (the doc's 3-bed house, and a small condo to show the building switcher),
 * plus contacts, projects, repairs, and past completions for the house.
 */
export function createSampleData(today: ISODate): AppData {
  const house = sampleBuilding(
    {
      id: "elm",
      name: "Elm Street house",
      type: "house",
      address: { line1: "1428 Elm Street", line2: "", city: "Portland", region: "OR", postalCode: "97214", country: "United States" },
      beds: 3,
      baths: 2,
      yearBuilt: 1994,
      sqft: 1850,
    },
    today,
    0,
  );
  const condo = sampleBuilding(
    {
      id: "pearl",
      name: "Pearl District condo",
      type: "apartment_condo",
      address: { line1: "1120 NW Couch Street", line2: "Unit 504", city: "Portland", region: "OR", postalCode: "97209", country: "United States" },
      beds: 1,
      baths: 1,
      yearBuilt: 2008,
      sqft: 720,
    },
    today,
    5,
  );

  const all = [house, condo];
  return {
    buildings: all.map((b) => b.building),
    spaces: all.flatMap((b) => b.spaces),
    items: all.flatMap((b) => b.items),
    schedules: all.flatMap((b) => b.schedules),
    logs: all.flatMap((b) => b.logs),
    work: sampleWork({ buildingId: house.building.id, spaces: house.spaces, items: house.items, today }),
    contacts: SAMPLE_CONTACTS,
    currentBuildingId: house.building.id,
    today,
  };
}
