import type { LocationProfile } from "@/data/agronomy/contracts";

/**
 * No location-specific agricultural/climate dataset is loaded yet. This
 * normalized profile preserves that absence rather than fabricating coverage.
 */
export function createLocationProfile(userEnteredLocation: string): LocationProfile {
  return {
    userEnteredLocation: userEnteredLocation.trim(),
    referenceLocationStatus: "not-linked",
    climateDataStatus: "not-linked",
    dataConfidence: "limited",
    note: "User-entered location only. No parcel-level soil, climate, water or market dataset is currently linked.",
  };
}