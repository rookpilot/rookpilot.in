"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

const noop = () => () => {};

/** Light, dark, or follow the device. */
export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  // The saved theme is only known in the browser; show nothing selected until then.
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={0}
      value={mounted ? (theme ?? "system") : ""}
      onValueChange={(value) => value && setTheme(value)}
      aria-label="Theme"
    >
      {THEMES.map(({ value, label, icon: Icon }) => (
        <ToggleGroupItem key={value} value={value} className="px-3 data-[state=on]:bg-primary-soft data-[state=on]:text-primary">
          <Icon data-icon="inline-start" />
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
