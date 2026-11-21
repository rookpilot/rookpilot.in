import * as z from "zod";
import { defineTool, id } from "./define";
import { contactOut, count, findContact, given, newId } from "./records";

// Contacts: the people who work on the building. They belong to the account, not one building.

const optionalFields = {
  company: z.string().optional(),
  trade: z.string().optional().describe('What they do, like "plumber" or "roofer".'),
  phone: z.string().optional(),
  email: z.string().optional(),
  notes: z.string().optional().describe("Why they're good to work with."),
};

const matches = (value: string, search: string) => value.toLowerCase().includes(search.trim().toLowerCase());

export const listContacts = defineTool({
  name: "list_contacts",
  kind: "read",
  description: "List contacts. Search by name or company, or filter by trade.",
  input: z.object({
    search: z.string().optional(),
    trade: z.string().optional(),
  }),
  run: async (input, ctx) =>
    ctx.data.contacts
      .filter((c) => !input.search || matches(c.name, input.search) || matches(c.company, input.search))
      .filter((c) => !input.trade || matches(c.trade, input.trade))
      .map(contactOut),
});

export const createContact = defineTool({
  name: "create_contact",
  kind: "write",
  description: "Add a contact.",
  input: z.object({ name: z.string().min(1), ...optionalFields }),
  run: async (input, ctx) => {
    const contact = {
      id: newId(),
      name: input.name.trim(),
      company: input.company?.trim() ?? "",
      trade: input.trade?.trim() ?? "",
      phone: input.phone?.trim() ?? "",
      email: input.email?.trim() ?? "",
      instagram: "",
      photoPath: null,
      whyWeLikeThem: input.notes?.trim() ?? "",
    };
    await ctx.save({ type: "addContact", contact });
    return contactOut(contact);
  },
});

export const updateContact = defineTool({
  name: "update_contact",
  kind: "write",
  description: "Change a contact's details.",
  input: z.object({ id: id("contact"), name: z.string().min(1).optional(), ...optionalFields }),
  run: async (input, ctx) => {
    const contact = findContact(ctx, input.id);
    const patch = given({
      name: input.name?.trim(),
      company: input.company?.trim(),
      trade: input.trade?.trim(),
      phone: input.phone?.trim(),
      email: input.email?.trim(),
      whyWeLikeThem: input.notes?.trim(),
    });
    await ctx.save({ type: "updateContact", id: contact.id, patch });
    return contactOut(findContact(ctx, contact.id));
  },
});

export const deleteContact = defineTool({
  name: "delete_contact",
  kind: "delete",
  description: "Delete a contact for good. The work and history they're tagged on stay.",
  input: z.object({ id: id("contact") }),
  effects: (input, ctx) => {
    const tagged = [...ctx.data.work, ...ctx.data.logs].filter((entry) => entry.contactIds.includes(input.id)).length;
    return tagged ? `They're untagged from ${count(tagged, "project, repair, or history entry", "projects, repairs, and history entries")}, which stay.` : undefined;
  },
  run: async (input, ctx) => {
    const contact = findContact(ctx, input.id);
    await ctx.save({ type: "deleteContact", id: contact.id });
    return { deleted: contact.name };
  },
});
