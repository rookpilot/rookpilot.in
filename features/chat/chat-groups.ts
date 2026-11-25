// Groups the past chats by when they were last used, like Claude and ChatGPT do.

export type ChatSummary = { id: string; title: string; updatedAt: string };
export type ChatGroup = { label: string; chats: ChatSummary[] };

const LABELS = ["Today", "Yesterday", "Last 7 days", "Older"] as const;

/** Whole days between two dates, by the person's own calendar. */
function daysAgo(date: Date, now: Date): number {
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((day(now) - day(date)) / 86_400_000);
}

/** Chats newest first, in Today, Yesterday, Last 7 days and Older. Empty groups are left out. */
export function groupChats(chats: ChatSummary[], now = new Date()): ChatGroup[] {
  const groups = LABELS.map((label) => ({ label, chats: [] as ChatSummary[] }));
  const sorted = [...chats].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  for (const chat of sorted) {
    const days = daysAgo(new Date(chat.updatedAt), now);
    groups[days <= 0 ? 0 : days === 1 ? 1 : days < 7 ? 2 : 3].chats.push(chat);
  }
  return groups.filter((group) => group.chats.length > 0);
}
