export type CoverageZone = {
  value: string;
  label: string;
  outwardCodes: string[];
  leadTimeLabel: string;
  priceAdjustment: number;
};

export type CoverageResult = {
  supported: boolean;
  zone: string;
  zoneLabel: string;
  leadTimeLabel: string;
  priceAdjustment: number;
};

const coverageZones: CoverageZone[] = [
  {
    value: "core",
    label: "Core London",
    outwardCodes: ["SW1", "SW3", "SW5", "SW6", "W1", "W2", "W8", "WC1", "WC2", "EC1", "EC2", "N1"],
    leadTimeLabel: "Fastest coverage, including same-day windows.",
    priceAdjustment: 0,
  },
  {
    value: "inner",
    label: "Inner London",
    outwardCodes: ["E1", "E2", "E14", "N5", "N7", "NW1", "NW3", "SE1", "SE5", "SW2", "SW4", "W3", "W6", "W10"],
    leadTimeLabel: "Strong next-day coverage with limited same-day dispatch.",
    priceAdjustment: 8,
  },
  {
    value: "outer",
    label: "Outer London",
    outwardCodes: ["BR1", "CR0", "DA1", "EN1", "HA1", "HA2", "HA3", "HA4", "HA5", "HA6", "HA7", "HA8", "HA9", "IG1", "KT1", "RM1", "SM1", "TW1", "UB1"],
    leadTimeLabel: "Scheduled coverage with a London travel uplift.",
    priceAdjustment: 18,
  },
];

function normalisePostcode(postcode: string) {
  return postcode.trim().toUpperCase().replace(/\s+/g, " ");
}

function getOutwardCode(postcode: string) {
  return normalisePostcode(postcode).split(" ")[0] || "";
}

export function getCoverageForPostcode(postcode: string): CoverageResult {
  const outwardCode = getOutwardCode(postcode);

  if (!outwardCode) {
    return {
      supported: false,
      zone: "unsupported",
      zoneLabel: "Check postcode",
      leadTimeLabel: "Enter a London postcode to see coverage.",
      priceAdjustment: 0,
    };
  }

  const zone = coverageZones.find((candidate) => candidate.outwardCodes.includes(outwardCode));

  if (!zone) {
    return {
      supported: false,
      zone: "unsupported",
      zoneLabel: "Outside launch zone",
      leadTimeLabel: "This postcode is outside the current London launch area.",
      priceAdjustment: 0,
    };
  }

  return {
    supported: true,
    zone: zone.value,
    zoneLabel: zone.label,
    leadTimeLabel: zone.leadTimeLabel,
    priceAdjustment: zone.priceAdjustment,
  };
}
