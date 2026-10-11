"use client";

import { Camera, X } from "lucide-react";
import { useId, useRef, useState } from "react";

import { ContactAvatar } from "@/components/contact-avatar";
import { DialogForm, FormDialog } from "@/components/form/form-dialog";
import { FormField } from "@/components/form/form-field";
import { TextareaField } from "@/components/form/textarea-field";
import { Button } from "@/components/ui/button";
import type { Contact } from "@/lib/domain/models";

import type { ContactForm } from "../actions";
import { readPhoto } from "../photo";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this contact; leave out to add a new one. */
  contact?: Contact;
  onSave: (form: ContactForm) => void;
}

export function ContactDialog({ open, onOpenChange, contact, onSave }: ContactDialogProps) {
  return (
    <FormDialog open={open} onOpenChange={onOpenChange}>
      <ContactFormBody
        contact={contact}
        onSave={(form) => {
          onSave(form);
          onOpenChange(false);
        }}
      />
    </FormDialog>
  );
}

const EMPTY: ContactForm = { name: "", company: "", trade: "", phone: "", email: "", instagram: "", photoUrl: null, whyWeLikeThem: "" };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ContactFormBody({ contact, onSave }: Pick<ContactDialogProps, "contact" | "onSave">) {
  const [form, setForm] = useState<ContactForm>(() => (contact ? { ...contact, instagram: contact.instagram && `@${contact.instagram}` } : EMPTY));
  const [photoError, setPhotoError] = useState<string>();
  const fileInput = useRef<HTMLInputElement>(null);
  const photoId = useId();
  const set = (patch: Partial<ContactForm>) => setForm((prev) => ({ ...prev, ...patch }));

  const emailError = form.email.trim() && !EMAIL.test(form.email.trim()) ? "That doesn't look like an email address." : undefined;

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    try {
      set({ photoUrl: await readPhoto(file) });
      setPhotoError(undefined);
    } catch {
      setPhotoError("That file couldn't be read as an image.");
    }
  }

  return (
    <DialogForm
      title={contact ? "Edit contact" : "Add a contact"}
      description={contact ? undefined : "Someone who helps keep your buildings running."}
      submitLabel={contact ? "Save" : "Add contact"}
      canSubmit={form.name.trim().length > 0 && !emailError}
      onSubmit={() => onSave(form)}
    >
      <div className="flex items-center gap-3">
        <ContactAvatar contact={{ name: form.name || "?", photoUrl: form.photoUrl }} className="size-14" />
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
              <Camera data-icon="inline-start" />
              {form.photoUrl ? "Change photo" : "Add photo"}
            </Button>
            {form.photoUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={() => set({ photoUrl: null })}>
                <X data-icon="inline-start" />
                Remove
              </Button>
            )}
          </div>
          <label htmlFor={photoId} className="sr-only">
            Photo
          </label>
          <input
            ref={fileInput}
            id={photoId}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              void pickPhoto(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <p className={photoError ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
            {photoError ?? "Without a photo, their initials show."}
          </p>
        </div>
      </div>

      <FormField label="Name" placeholder="Dana Ruiz" value={form.name} onChange={(e) => set({ name: e.target.value })} autoFocus />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Trade" optional placeholder="Plumber" value={form.trade} onChange={(e) => set({ trade: e.target.value })} />
        <FormField label="Company" optional value={form.company} onChange={(e) => set({ company: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Phone" optional type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
        <FormField label="Email" optional type="email" value={form.email} error={emailError} onChange={(e) => set({ email: e.target.value })} />
      </div>
      <FormField label="Instagram" optional placeholder="@handle" value={form.instagram} onChange={(e) => set({ instagram: e.target.value })} />
      <TextareaField
        label="Why we like them"
        optional
        placeholder="On time, fair prices, explains the problem before quoting…"
        value={form.whyWeLikeThem}
        onChange={(e) => set({ whyWeLikeThem: e.target.value })}
      />
    </DialogForm>
  );
}
