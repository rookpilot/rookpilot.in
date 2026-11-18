import type { AgentTool } from "./define";
import { createContact, deleteContact, listContacts, updateContact } from "./contacts";
import { listHistory } from "./history";
import { createItem, deleteItem, listItems, updateItem } from "./items";
import { createRoom, deleteRoom, listRooms, updateRoom } from "./rooms";
import { completeSchedule, createSchedule, deleteSchedule, listSchedules, updateSchedule } from "./schedules";
import { createWork, deleteWork, listWork, updateWork } from "./work";

export type { ToolKind } from "../confirm";
export type { AgentTool, ToolContext } from "./define";

/** Every tool the agent has. Basic create/read/update/delete over each tab of the app. */
export const TOOLS: AgentTool[] = [
  // Projects & repairs
  listWork,
  createWork,
  updateWork,
  deleteWork,
  // Schedule & reminders
  listSchedules,
  createSchedule,
  updateSchedule,
  completeSchedule,
  deleteSchedule,
  // Contacts
  listContacts,
  createContact,
  updateContact,
  deleteContact,
  // Rooms
  listRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  // Items
  listItems,
  createItem,
  updateItem,
  deleteItem,
  // History
  listHistory,
];

/** What's sent to Claude on every agent call. Same order every time, so it caches well. */
export const TOOL_DEFINITIONS = TOOLS.map((tool) => tool.definition);

export function findTool(name: string): AgentTool | undefined {
  return TOOLS.find((tool) => tool.name === name);
}
