"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { SegmentedControl } from "@/components/segmented-control";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

type Theme = (typeof THEMES)[number]["value"];

const noop = () => () => {};

/** Light, dark, or follow the device. */
export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  // The saved theme is only known in the browser; show nothing selected until then.
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  return (
    <SegmentedControl label="Theme" value={mounted ? ((theme as Theme | undefined) ?? "system") : ""} options={THEMES} onChange={setTheme} />
  );
}
