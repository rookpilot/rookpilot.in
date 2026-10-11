export const BUILDING_TYPES = [
  "house",
  "apartment_condo",
  "mobile_home",
  "rental",
  "gym",
  "store_cafe",
  "office",
  "theater",
] as const;

export type BuildingType = (typeof BUILDING_TYPES)[number];

export type BuildingCategory = "residential" | "commercial";

interface BuildingTypeInfo {
  label: string;
  description: string;
  category: BuildingCategory;
}

export const BUILDING_TYPE_INFO: Record<BuildingType, BuildingTypeInfo> = {
  house: { label: "House", description: "Single-family home", category: "residential" },
  apartment_condo: { label: "Apartment or condo", description: "A unit in a shared building", category: "residential" },
  mobile_home: { label: "Mobile home", description: "Mobile home or trailer", category: "residential" },
  rental: { label: "Rental property", description: "A place you rent out", category: "residential" },
  gym: { label: "Gym", description: "Fitness studio or gym", category: "commercial" },
  store_cafe: { label: "Store or cafe", description: "Retail or food service", category: "commercial" },
  office: { label: "Office", description: "Office space", category: "commercial" },
  theater: { label: "Movie theater", description: "Screens and seating", category: "commercial" },
};

export interface Address {
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface BuildingBasics {
  name: string;
  beds: string;
  baths: string;
  yearBuilt: string;
  sqft: string;
}

export function formatAddressLine(address: Address): string {
  return [address.line1, address.line2].filter(Boolean).join(", ");
}

const REQUIRED_ADDRESS_FIELDS: { field: keyof Address; message: string }[] = [
  { field: "line1", message: "Enter the street address." },
  { field: "city", message: "Enter the city." },
  { field: "region", message: "Enter the state or region." },
  { field: "postalCode", message: "Enter the ZIP or postal code." },
  { field: "country", message: "Enter the country." },
];

/** An error message for each missing required field. */
export function validateAddress(address: Address): Partial<Record<keyof Address, string>> {
  const errors: Partial<Record<keyof Address, string>> = {};
  for (const { field, message } of REQUIRED_ADDRESS_FIELDS) {
    if (!address[field].trim()) errors[field] = message;
  }
  return errors;
}
