import type { AppData } from "@/lib/data/types";

// What the chat shows while the agent works: one line per tool, in plain words.
// "Checking your repairs…" while it runs, "Checked your repairs" once it's done.

export type Step = {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  status: "running" | "done" | "failed";
};

type Words = [running: string, done: string, failed: string];

function nameOf(data: AppData | null, list: keyof Pick<AppData, "spaces" | "items" | "work" | "schedules" | "contacts">, id: unknown) {
  const found = (data?.[list] as { id: string; name?: string; title?: string }[] | undefined)?.find((record) => record.id === id);
  return found?.name ?? found?.title;
}

/** `"Fire pit"`, or the fallback when there's no name. */
const quoted = (name: unknown, fallback: string) => (typeof name === "string" && name ? `"${name}"` : fallback);

function words(step: Step, data: AppData | null): Words {
  const { input } = step;
  const room = nameOf(data, "spaces", input.room_id);
  const inRoom = room ? ` in the ${room}` : "";
  const workKind = input.kind === "repair" ? "repair" : input.kind === "project" ? "project" : "project or repair";

  switch (step.tool) {
    case "list_work": {
      const what = input.kind === "repair" ? "your repairs" : input.kind === "project" ? "your projects" : "your projects and repairs";
      return [`Checking ${what}`, `Checked ${what}`, `Couldn't check ${what}`];
    }
    case "list_schedules":
      return ["Checking what's due", "Checked what's due", "Couldn't check what's due"];
    case "list_contacts":
      return ["Looking through your contacts", "Looked through your contacts", "Couldn't look through your contacts"];
    case "list_rooms":
      return ["Looking at your rooms", "Looked at your rooms", "Couldn't look at your rooms"];
    case "list_items":
      return [`Looking at items${inRoom}`, `Looked at items${inRoom}`, `Couldn't look at items${inRoom}`];
    case "list_history":
      return ["Checking your history", "Checked your history", "Couldn't check your history"];

    case "create_work": {
      const what = quoted(input.title, `a ${workKind}`);
      return [`Adding ${what}`, `Added ${what}`, `Couldn't add ${what}`];
    }
    case "create_schedule": {
      const what = quoted(input.title, "a schedule");
      return [`Adding ${what}`, `Added ${what}`, `Couldn't add ${what}`];
    }
    case "create_contact":
    case "create_room":
    case "create_item": {
      const what = quoted(input.name, `a ${step.tool.slice("create_".length)}`);
      return [`Adding ${what}`, `Added ${what}`, `Couldn't add ${what}`];
    }
    case "complete_schedule": {
      const what = quoted(nameOf(data, "schedules", input.id), "a task");
      return [`Marking ${what} done`, `Marked ${what} done`, `Couldn't mark ${what} done`];
    }
  }

  // update_* and delete_*: name the record they're about.
  const [verb, table] = [step.tool.split("_")[0], step.tool.split("_").slice(1).join("_")];
  const lists = { work: "work", schedule: "schedules", contact: "contacts", room: "spaces", item: "items" } as const;
  const what = quoted(nameOf(data, lists[table as keyof typeof lists] ?? "work", input.id), `a ${table === "work" ? workKind : table}`);
  if (verb === "delete") return [`Deleting ${what}`, `Deleted ${what}`, `Couldn't delete ${what}`];
  if (verb === "update") return [`Updating ${what}`, `Updated ${what}`, `Couldn't update ${what}`];
  return [`Using ${step.tool}`, `Used ${step.tool}`, `Couldn't use ${step.tool}`];
}

export function stepLabel(step: Step, data: AppData | null): string {
  const [running, done, failed] = words(step, data);
  return step.status === "running" ? `${running}…` : step.status === "done" ? done : failed;
}
