import type { StayAvailability } from "../../_providers/CatalogProvider";
import { freeUnits } from "@/lib/orders/stays";

/** Rooms of one item free for every given night (unknown availability counts as free) */
export function freeFor(availability: StayAvailability | null, itemId: string, units: number, nights: string[]): number {
  if (!availability) return units;
  return freeUnits(availability.units[itemId] ?? units, availability.booked[itemId], nights);
}
