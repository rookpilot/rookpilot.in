import { shiftDays } from "@/lib/dates";
import type { Contact, ISODate, Item, LogEntry, Schedule, Space, Work } from "@/lib/domain/models";

/** The people from the plan's Contacts mockup. */
export const SAMPLE_CONTACTS: Contact[] = [
  {
    id: "contact-dana",
    name: "Dana Ruiz",
    company: "Ruiz Door Co.",
    trade: "Garage doors",
    phone: "(503) 555-0142",
    email: "dana@ruizdoors.com",
    instagram: "ruizdoors",
    photoUrl: null,
    whyWeLikeThem: "Shows up on time, explains the problem before quoting, fair prices. Fixed the opener last year and didn't upsell a new door.",
  },
  {
    id: "contact-marco",
    name: "Marco Lee",
    company: "",
    trade: "Handyman, friend",
    phone: "(503) 555-0178",
    email: "marco.lee@example.com",
    instagram: "marcobuilds",
    photoUrl: null,
    whyWeLikeThem: "Knows a bit of everything and lends tools. Great for weekend projects.",
  },
  {
    id: "contact-priya",
    name: "Priya Anand",
    company: "Anand Plumbing",
    trade: "Plumber",
    phone: "(503) 555-0110",
    email: "priya@anandplumbing.com",
    instagram: "",
    photoUrl: null,
    whyWeLikeThem: "Came out same day for the hall sink leak. Clean work, sends photos of what she fixed.",
  },
  {
    id: "contact-topshelf",
    name: "Top Shelf Roofing",
    company: "Top Shelf Roofing",
    trade: "Roofer",
    phone: "(503) 555-0190",
    email: "office@topshelfroofing.com",
    instagram: "topshelfroofing",
    photoUrl: null,
    whyWeLikeThem: "Did the new roof on time and on budget. Free yearly inspection for past customers.",
  },
];

interface SampleWorkInput {
  buildingId: string;
  spaces: Space[];
  items: Item[];
  today: ISODate;
}

/** Projects and repairs for the sample house, dated around today. */
export function sampleWork({ buildingId, spaces, items, today }: SampleWorkInput): Work[] {
  const room = (name: string) => spaces.find((s) => s.name === name)?.id ?? null;
  const item = (templateKey: string, spaceName: string) =>
    items.find((i) => i.templateKey === templateKey && i.spaceId === room(spaceName))?.id ?? null;
  const day = (offset: number) => shiftDays(today, offset);

  const base = { buildingId, cost: null, budget: null, startedOn: null, plannedOn: null, finishedOn: null, notes: "", contactIds: [] };

  return [
    {
      ...base,
      id: "work-garage-door",
      kind: "repair",
      title: "Grinding garage door",
      status: "in_progress",
      spaceId: room("Garage"),
      itemId: item("garage_door", "Garage"),
      performedBy: "hired",
      cost: 240,
      startedOn: day(-7),
      plannedOn: day(4),
      notes: "Loud grinding when opening. Roller on the left track looks worn.",
      contactIds: ["contact-dana"],
    },
    {
      ...base,
      id: "work-sink-leak",
      kind: "repair",
      title: "Leak under hall sink",
      status: "fixed",
      spaceId: room("Hall bath"),
      itemId: item("under_sink_pipes", "Hall bath"),
      performedBy: "hired",
      cost: 150,
      startedOn: day(-14),
      plannedOn: day(-12),
      finishedOn: day(-12),
      notes: "Loose compression nut on the cold line. Replaced the washer.",
      contactIds: ["contact-priya"],
    },
    {
      ...base,
      id: "work-shingles",
      kind: "repair",
      title: "Cracked roof shingles",
      status: "fixed",
      spaceId: room("Whole building"),
      itemId: null,
      performedBy: "hired",
      cost: 320,
      startedOn: day(-160),
      finishedOn: day(-150),
      contactIds: ["contact-topshelf"],
    },
    {
      ...base,
      id: "work-dripping-faucet",
      kind: "repair",
      title: "Dripping kitchen faucet",
      status: "open",
      spaceId: room("Kitchen"),
      itemId: null,
      performedBy: "diy",
      startedOn: day(-2),
    },
    {
      ...base,
      id: "work-fire-pit",
      kind: "project",
      title: "Backyard fire pit",
      status: "in_progress",
      spaceId: room("Garden"),
      itemId: null,
      performedBy: "diy",
      cost: 410,
      budget: 600,
      startedOn: day(-5),
      plannedOn: day(14),
      notes: "Round stone kit, 36 in. Marco is lending the plate compactor.",
      contactIds: ["contact-marco"],
    },
    {
      ...base,
      id: "work-repaint",
      kind: "project",
      title: "Repaint master bedroom",
      status: "idea",
      spaceId: room("Master bedroom"),
      itemId: null,
      performedBy: "diy",
      budget: 250,
      notes: "Something warmer than the current gray.",
    },
    {
      ...base,
      id: "work-new-roof",
      kind: "project",
      title: "New roof",
      status: "done",
      spaceId: room("Whole building"),
      itemId: item("roof", "Whole building"),
      performedBy: "hired",
      cost: 14200,
      budget: 15000,
      startedOn: day(-420),
      plannedOn: day(-400),
      finishedOn: day(-398),
      notes: "Architectural shingles, 30-year warranty.",
      contactIds: ["contact-topshelf"],
    },
  ];
}

/** A few completions get a cost, a note, or a helper so History looks lived in. */
const LOG_DETAILS: Record<string, Partial<Pick<LogEntry, "cost" | "note" | "contactIds">>> = {
  "air_filter:Replace": { cost: 18, note: "MERV 11, 16x25x1." },
  "smoke_alarm:Battery": { cost: 6 },
  "garage_door:Lubricate": { contactIds: ["contact-dana"], note: "Done during the opener visit." },
  "water_heater:Flush": { contactIds: ["contact-marco"] },
  "fridge_filter:Replace": { cost: 42 },
  "dryer_vent:Clean": { cost: 12, note: "Used the brush kit." },
};

interface SampleLogsInput {
  buildingId: string;
  items: Item[];
  schedules: Schedule[];
  today: ISODate;
}

/** One History entry for each timer's last completion within the past two years. */
export function sampleLogs({ buildingId, items, schedules, today }: SampleLogsInput): LogEntry[] {
  const itemsById = new Map(items.map((i) => [i.id, i]));
  return schedules.flatMap((schedule) => {
    const item = itemsById.get(schedule.itemId);
    const doneOn = schedule.lastDoneOn;
    if (!item || !doneOn || doneOn > today || doneOn < shiftDays(today, -730)) return [];
    const details = LOG_DETAILS[`${item.templateKey}:${schedule.title}`] ?? {};
    return [
      {
        id: `log-${schedule.id}`,
        buildingId,
        itemId: item.id,
        scheduleId: schedule.id,
        title: schedule.title,
        doneOn,
        note: "",
        cost: null,
        contactIds: [],
        ...details,
      },
    ];
  });
}
