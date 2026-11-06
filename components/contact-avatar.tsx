"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSignedUrl } from "@/hooks/use-signed-url";
import { initials } from "@/lib/domain/contact";
import type { Contact } from "@/lib/domain/models";
import { cn } from "@/lib/utils";

interface ContactAvatarProps {
  contact: Pick<Contact, "name" | "photoPath">;
  /** Shows this picture instead, like a photo picked but not saved yet. */
  previewUrl?: string | null;
  size?: "sm" | "default" | "lg";
  className?: string;
}

/** The contact's photo, or their initials when there isn't one. */
export function ContactAvatar({ contact, previewUrl, size = "default", className }: ContactAvatarProps) {
  const stored = useSignedUrl("contact-photos", previewUrl === undefined ? contact.photoPath : null);
  const src = previewUrl === undefined ? stored : previewUrl;
  return (
    <Avatar size={size} className={className}>
      {src && <AvatarImage src={src} alt="" />}
      <AvatarFallback className="bg-primary-soft font-semibold text-primary">{initials(contact.name) || "?"}</AvatarFallback>
    </Avatar>
  );
}

/** Overlapping avatars for the people tagged on something. */
export function ContactAvatars({ contacts, className }: { contacts: Contact[]; className?: string }) {
  if (contacts.length === 0) return null;
  return (
    <span className={cn("flex -space-x-1.5", className)} title={contacts.map((c) => c.name).join(", ")}>
      {contacts.map((contact) => (
        <ContactAvatar key={contact.id} contact={contact} size="sm" className="ring-2 ring-card" />
      ))}
      <span className="sr-only">Helped by {contacts.map((c) => c.name).join(", ")}</span>
    </span>
  );
}
