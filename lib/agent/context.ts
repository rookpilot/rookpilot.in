import type { SupabaseClient } from "@supabase/supabase-js";
import { toISODate } from "@/lib/dates";
import type { ISODate } from "@/lib/domain/models";
import type { Database } from "@/lib/supabase/database.types";

/** Passed in by the app every time the graph runs. Never chosen by Claude. */
export type AgentContext = {
  /** The signed-in person's current building. Every tool reads and changes only this one. */
  buildingId: string;
  /** The signed-in person's Supabase client, so the access rules decide what the tools can see and change. */
  supabase: SupabaseClient<Database>;
  /** 0 to 100: how often the person wants to confirm changes. */
  confirmLevel?: number;
  /** The person's date, from their browser. Defaults to the server's. */
  today?: ISODate;
};

export function today(context: Partial<AgentContext> | undefined): ISODate {
  return context?.today ?? toISODate(new Date());
}
