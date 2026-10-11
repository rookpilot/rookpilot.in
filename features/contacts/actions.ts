import { dispatch, newId } from "@/lib/data/store";
import { normalizeInstagram } from "@/lib/domain/contact";
import type { Contact } from "@/lib/domain/models";

export type ContactForm = Omit<Contact, "id">;

function clean(form: ContactForm): ContactForm {
  return {
    name: form.name.trim(),
    company: form.company.trim(),
    trade: form.trade.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    instagram: normalizeInstagram(form.instagram),
    photoUrl: form.photoUrl,
    whyWeLikeThem: form.whyWeLikeThem.trim(),
  };
}

export const contactActions = {
  add(form: ContactForm): string {
    const id = newId();
    dispatch({ type: "addContact", contact: { id, ...clean(form) } });
    return id;
  },
  update(id: string, form: ContactForm) {
    dispatch({ type: "updateContact", id, patch: clean(form) });
  },
  /** Removes the contact and their tags. Work they helped with stays. */
  remove(id: string) {
    dispatch({ type: "deleteContact", id });
  },
};
