import { Briefcase, Building2, Caravan, Clapperboard, Dumbbell, House, KeyRound, Store, type LucideIcon } from "lucide-react";

import type { BuildingType } from "@/lib/domain/building";

const ICONS: Record<BuildingType, LucideIcon> = {
  house: House,
  apartment_condo: Building2,
  mobile_home: Caravan,
  rental: KeyRound,
  gym: Dumbbell,
  store_cafe: Store,
  office: Briefcase,
  theater: Clapperboard,
};

export function BuildingTypeIcon({ type, className }: { type: BuildingType; className?: string }) {
  const Icon = ICONS[type];
  return <Icon className={className} aria-hidden="true" />;
}
