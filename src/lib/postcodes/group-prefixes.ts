export function getPostcodeAreaKey(prefix: string) {
  const normalized = prefix.trim().toUpperCase();
  if (!normalized) return "Other";
  const match = normalized.match(/^[A-Z]{1,2}/);
  return match ? match[0] : "Other";
}

const AREA_NAMES: Record<string, string> = {
  BR: "Bromley",
  CR: "Croydon",
  DA: "Dartford",
  E: "East London",
  EC: "City of London",
  EN: "Enfield",
  HA: "Harrow",
  IG: "Ilford",
  KT: "Kingston",
  N: "North London",
  NW: "North West London",
  RM: "Romford",
  SE: "South East London",
  SM: "Sutton",
  SW: "South West London",
  TN: "Tunbridge Wells",
  TW: "Twickenham",
  UB: "Uxbridge",
  W: "West London",
  WC: "West Central London",
};

export function getPostcodeAreaName(areaKey: string) {
  return AREA_NAMES[areaKey] ?? `${areaKey} area`;
}

export function groupPostcodePrefixes(prefixes: string[]) {
  const groups = new Map<string, string[]>();

  for (const prefix of prefixes) {
    const area = getPostcodeAreaKey(prefix);
    const current = groups.get(area) ?? [];
    current.push(prefix);
    groups.set(area, current);
  }

  return [...groups.entries()]
    .map(([areaKey, values]) => ({
      areaKey,
      areaName: getPostcodeAreaName(areaKey),
      prefixes: [...new Set(values)].sort(),
    }))
    .sort((left, right) => left.areaName.localeCompare(right.areaName));
}
