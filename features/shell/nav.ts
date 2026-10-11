import { CalendarDays, DoorOpen, Hammer, History, House, Settings, Users, Wrench, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Show the overdue count next to this link. */
  showsOverdue?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Building",
    items: [
      { label: "Home", href: "/app", icon: House },
      { label: "Schedule", href: "/app/schedule", icon: CalendarDays, showsOverdue: true },
      { label: "Building", href: "/app/building", icon: DoorOpen },
      { label: "History", href: "/app/history", icon: History },
    ],
  },
  {
    label: "Work",
    items: [
      { label: "Projects", href: "/app/projects", icon: Hammer },
      { label: "Repairs", href: "/app/repairs", icon: Wrench },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Contacts", href: "/app/contacts", icon: Users },
      { label: "Settings", href: "/app/settings", icon: Settings },
    ],
  },
];

/** Home only matches exactly; other tabs also match their sub-pages. */
export function isActive(href: string, pathname: string): boolean {
  return href === "/app" ? pathname === "/app" : pathname === href || pathname.startsWith(`${href}/`);
}
