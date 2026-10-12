"use client";

import { useLocalPreference } from "@/hooks/use-local-preference";

const KEY = "rookpilot.sidebar";

/** Whether the desktop sidebar is shrunk to icons. Remembered per browser. */
export function useSidebarCollapsed(): [boolean, () => void] {
  const [value, setValue] = useLocalPreference(KEY);
  const collapsed = value === "collapsed";
  return [collapsed, () => setValue(collapsed ? "expanded" : "collapsed")];
}
