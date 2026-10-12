"use client";

import { Building2, Moon, Plus, Sparkles, Sun, User, Wrench } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { itemHref } from "@/features/building/routes";
import { contactHref } from "@/features/contacts/routes";
import { NAV_GROUPS } from "@/features/shell/nav";
import { selectBuilding, useCurrentBuilding } from "@/features/shell/hooks/use-current-building";
import { selectContacts, selectSpaces } from "@/lib/data/selectors";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAskRookpilot: () => void;
}

/** ⌘K: jump to any tab, item, contact, or building, or run a quick action. */
export function CommandMenu({ open, onOpenChange, onAskRookpilot }: CommandMenuProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const current = useCurrentBuilding();

  function run(action: () => void) {
    onOpenChange(false);
    action();
  }
  const go = (href: string) => run(() => router.push(href));

  const data = current?.data;
  const building = current?.building;
  const spaces = building && data ? new Map(selectSpaces(data, building.id).map((s) => [s.id, s.name])) : new Map<string, string>();
  const items = building && data ? data.items.filter((i) => i.buildingId === building.id) : [];
  const contacts = data ? selectContacts(data) : [];

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search Rookpilot"
      description="Jump to a page, item, contact, or building."
    >
      <Command>
        <CommandInput placeholder="Search pages, items, people…" />
        <CommandList>
          <CommandEmpty>Nothing found.</CommandEmpty>

          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => run(onAskRookpilot)}>
              <Sparkles />
              Ask Rookpilot
              <CommandShortcut>⌘J</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => go("/app/repairs")} keywords={["broke", "fix", "add repair"]}>
              <Wrench />
              Log a repair
            </CommandItem>
            <CommandItem onSelect={() => go("/onboarding")} keywords={["new building"]}>
              <Plus />
              Add a building
            </CommandItem>
            <CommandItem
              onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}
              keywords={["theme", "dark", "light"]}
            >
              {resolvedTheme === "dark" ? <Sun /> : <Moon />}
              Switch to {resolvedTheme === "dark" ? "light" : "dark"} mode
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />
          <CommandGroup heading="Go to">
            {NAV_GROUPS.flatMap((group) => group.items).map((item) => (
              <CommandItem key={item.href} onSelect={() => go(item.href)}>
                <item.icon />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>

          {items.length > 0 && (
            <CommandGroup heading="Items">
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.name} · ${spaces.get(item.spaceId) ?? ""}`}
                  onSelect={() => go(itemHref(item.spaceId, item.id))}
                >
                  <span className="flex-1 truncate">{item.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{spaces.get(item.spaceId)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {contacts.length > 0 && (
            <CommandGroup heading="Contacts">
              {contacts.map((contact) => (
                <CommandItem
                  key={contact.id}
                  value={`${contact.name} · ${contact.trade}`}
                  onSelect={() => go(contactHref(contact.id))}
                >
                  <User />
                  <span className="flex-1 truncate">{contact.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{contact.trade}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {data && data.buildings.length > 1 && (
            <CommandGroup heading="Switch building">
              {data.buildings.map((b) => (
                <CommandItem key={b.id} value={`Building: ${b.name}`} onSelect={() => run(() => selectBuilding(b.id))}>
                  <Building2 />
                  {b.name}
                  {b.id === building?.id && <span className="ml-auto text-xs text-muted-foreground">Current</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
