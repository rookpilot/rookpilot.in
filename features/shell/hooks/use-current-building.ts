"use client";

import { dispatch, useAppData } from "@/lib/data/store";
import { selectCurrentBuilding } from "@/lib/data/selectors";

/** The loaded data and the selected building, or null while loading. */
export function useCurrentBuilding() {
  const data = useAppData();
  if (!data) return null;
  return { data, building: selectCurrentBuilding(data) };
}

export function selectBuilding(id: string) {
  dispatch({ type: "selectBuilding", id });
}
