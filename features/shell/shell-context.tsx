"use client";

import { createContext, useContext } from "react";

export interface ShellControls {
  openChat: (prompt?: string) => void;
  openSearch: () => void;
}

const ShellContext = createContext<ShellControls>({ openChat: () => {}, openSearch: () => {} });

export const ShellProvider = ShellContext.Provider;

/** Opens the chat panel or the ⌘K menu from anywhere inside the app. */
export function useShell(): ShellControls {
  return useContext(ShellContext);
}
