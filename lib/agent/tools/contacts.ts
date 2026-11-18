import * as z from "zod";
import { defineTool, id } from "./define";

// Contacts: the people who work on the building.
// TODO(next PR): every run() returns null for now. Wire them to Supabase.

const optionalFields = {
  company: z.string().optional(),
  trade: z.string().optional().describe('What they do, like "plumber" or "roofer".'),
  phone: z.string().optional(),
  email: z.string().optional(),
  notes: z.string().optional().describe("Why they're good to work with."),
};

export const listContacts = defineTool({
  name: "list_contacts",
  kind: "read",
  description: "List contacts. Search by name or company, or filter by trade.",
  input: z.object({
    search: z.string().optional(),
    trade: z.string().optional(),
  }),
  run: async () => null,
});

export const createContact = defineTool({
  name: "create_contact",
  kind: "write",
  description: "Add a contact.",
  input: z.object({ name: z.string().min(1), ...optionalFields }),
  run: async () => null,
});

export const updateContact = defineTool({
  name: "update_contact",
  kind: "write",
  description: "Change a contact's details.",
  input: z.object({ id: id("contact"), name: z.string().min(1).optional(), ...optionalFields }),
  run: async () => null,
});

export const deleteContact = defineTool({
  name: "delete_contact",
  kind: "delete",
  description: "Delete a contact for good.",
  input: z.object({ id: id("contact") }),
  run: async () => null,
});
