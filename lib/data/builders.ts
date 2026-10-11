import type { Hemisphere, ISODate, Item, Schedule } from "@/lib/domain/models";
import type { ScheduleTemplate } from "@/lib/domain/schedule";
import { computeNextDue } from "@/lib/scheduling";
import type { ItemTemplate } from "@/lib/templates/items";

import type { NewItems } from "./types";

export type IdFactory = () => string;

export interface NewItemInput {
  buildingId: string;
  spaceId: string;
  name: string;
  template: ItemTemplate | null;
  /** How many units to create. Each unit gets its own timers. */
  count: number;
  installedOn: ISODate | null;
  hemisphere: Hemisphere;
  today: ISODate;
}

export function buildSchedule(
  itemId: string,
  template: ScheduleTemplate,
  from: ISODate,
  hemisphere: Hemisphere,
  newId: IdFactory,
): Schedule {
  return {
    id: newId(),
    itemId,
    title: template.title,
    repeat: template.repeat,
    lastDoneOn: null,
    nextDueOn: computeNextDue(template.repeat, from, hemisphere),
    active: true,
  };
}

/** Creates `count` items (numbered when more than one) with the template's timers. */
export function buildItems(input: NewItemInput, newId: IdFactory): NewItems {
  const count = Math.max(1, Math.floor(input.count));
  const from = input.installedOn ?? input.today;
  const items: Item[] = [];
  const schedules: Schedule[] = [];

  for (let i = 0; i < count; i++) {
    const item: Item = {
      id: newId(),
      buildingId: input.buildingId,
      spaceId: input.spaceId,
      name: count > 1 ? `${input.name} ${i + 1}` : input.name,
      templateKey: input.template?.key ?? null,
      brand: "",
      model: "",
      installedOn: input.installedOn,
      notes: "",
    };
    items.push(item);
    for (const template of input.template?.schedules ?? []) {
      schedules.push(buildSchedule(item.id, template, from, input.hemisphere, newId));
    }
  }
  return { items, schedules };
}
