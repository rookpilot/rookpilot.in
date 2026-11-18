import { toast } from "sonner";

import { contactPhotoPath, shrinkImage, uploadFile } from "@/lib/data/files";
import { dispatch, newId } from "@/lib/data/store";
import { normalizeInstagram } from "@/lib/domain/contact";
import type { Contact } from "@/lib/domain/models";
import { createClient } from "@/lib/supabase/client";

/** Everything on the form except the photo, which is uploaded separately. */
export type ContactForm = Omit<Contact, "id" | "photoPath">;

/** What the form did with the photo. */
export type PhotoChange = { kind: "keep" } | { kind: "remove" } | { kind: "replace"; file: Blob };

/** Longest side of a stored contact photo, in pixels. Avatars never show bigger. */
const PHOTO_MAX_SIDE = 256;

function clean(form: ContactForm): ContactForm {
  return {
    name: form.name.trim(),
    company: form.company.trim(),
    trade: form.trade.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    instagram: normalizeInstagram(form.instagram),
    whyWeLikeThem: form.whyWeLikeThem.trim(),
  };
}

/**
 * Uploads a new photo, then points the contact at it. Saving that change removes the old
 * photo. The contact itself is already saved, so a failed upload only loses the photo.
 */
async function savePhoto(contactId: string, change: PhotoChange) {
  if (change.kind === "keep") return;
  if (change.kind === "remove") {
    dispatch({ type: "updateContact", id: contactId, patch: { photoPath: null } });
    return;
  }
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const ownerId = data.session?.user.id;
    if (!ownerId) throw new Error("Not signed in");
    const path = contactPhotoPath(ownerId, contactId, newId());
    await uploadFile(supabase, "contact-photos", path, await shrinkImage(change.file, PHOTO_MAX_SIDE), "image/jpeg");
    dispatch({ type: "updateContact", id: contactId, patch: { photoPath: path } });
  } catch (error) {
    console.error("Uploading the photo failed", error);
    toast.error("Couldn't save the photo. The rest of the contact was saved.");
  }
}

export const contactActions = {
  add(form: ContactForm, photo: PhotoChange): string {
    const id = newId();
    dispatch({ type: "addContact", contact: { id, ...clean(form), photoPath: null } });
    void savePhoto(id, photo);
    return id;
  },
  update(id: string, form: ContactForm, photo: PhotoChange) {
    dispatch({ type: "updateContact", id, patch: clean(form) });
    void savePhoto(id, photo);
  },
  /** Removes the contact, their tags, and their photo. Work they helped with stays. */
  remove(id: string) {
    dispatch({ type: "deleteContact", id });
  },
};
