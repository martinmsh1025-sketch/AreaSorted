export const londonCouncilCoverage = {
  Camden: ["NW1", "NW3", "NW5", "WC1"],
  Islington: ["EC1", "N1", "N5", "N7"],
  Barnet: ["EN4", "N2", "N3", "NW4", "NW7"],
  Harrow: ["HA1", "HA2", "HA3", "HA5", "HA7"],
  Westminster: ["SW1", "W1", "W2", "WC2"],
  "Kensington and Chelsea": ["SW3", "SW5", "SW7", "W8", "W10"],
  Hounslow: ["TW3", "TW4", "TW5", "TW7", "W4"],
  Ealing: ["UB1", "W3", "W5", "W7", "W13"],
  Croydon: ["CR0", "CR2", "CR7", "SE25"],
  Newham: ["E6", "E7", "E13", "E16"],
} as const;

export const londonCouncilOptions = Object.keys(londonCouncilCoverage);

export function getPostcodesForCouncils(councils: string[]) {
  return Array.from(
    new Set(
      councils.flatMap((council) => londonCouncilCoverage[council as keyof typeof londonCouncilCoverage] || []),
    ),
  ).sort() as string[];
}

export function getCouncilsForPostcodes(postcodes: string[]) {
  return londonCouncilOptions.filter((council) =>
    (londonCouncilCoverage[council as keyof typeof londonCouncilCoverage] || []).some((postcode) => postcodes.includes(postcode)),
  );
}
