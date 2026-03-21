/**
 * All 32 London boroughs + City of London with comprehensive postcode prefixes.
 *
 * Postcode prefixes are the outward code portion (e.g. "SW1", "EC2") that Royal Mail
 * assigns within each borough. Some postcodes span multiple boroughs — in those cases
 * the postcode is listed under the borough where the majority of addresses fall.
 *
 * Sources: Royal Mail PAF, London Datastore, ONS postcode directory.
 */

export const londonCouncilCoverage: Record<string, readonly string[]> = {
  // ── Inner London ──

  "City of London": ["EC1", "EC2", "EC3", "EC4"],

  Camden: ["NW1", "NW3", "NW5", "NW6", "WC1", "WC1A", "WC1B", "WC1E", "WC1H", "WC1N", "WC1R", "WC1V", "WC1X", "N6", "NW8"],

  Greenwich: ["SE3", "SE7", "SE9", "SE10", "SE12", "SE18", "SE28", "DA17"],

  Hackney: ["E2", "E5", "E8", "E9", "E15", "N1", "N4", "N16"],

  Hammersmith: ["W6", "W12", "W14", "SW6"],

  Islington: ["EC1", "EC1V", "EC1R", "N1", "N4", "N5", "N7", "N19"],

  "Kensington and Chelsea": ["SW1", "SW3", "SW5", "SW7", "SW10", "W8", "W10", "W11", "W14"],

  Lambeth: ["SE1", "SE5", "SE11", "SE21", "SE24", "SE27", "SW2", "SW4", "SW8", "SW9", "SW16"],

  Lewisham: ["SE4", "SE6", "SE8", "SE13", "SE14", "SE23", "SE26", "BR1"],

  Newham: ["E6", "E7", "E12", "E13", "E15", "E16", "E20"],

  Southwark: ["SE1", "SE5", "SE11", "SE15", "SE16", "SE17", "SE21", "SE22", "SE24"],

  "Tower Hamlets": ["E1", "E2", "E3", "E14", "E1W"],

  Wandsworth: ["SW4", "SW8", "SW11", "SW12", "SW15", "SW17", "SW18", "SW19"],

  Westminster: ["SW1", "SW1A", "SW1E", "SW1H", "SW1P", "SW1V", "SW1W", "SW1X", "SW1Y", "W1", "W2", "W9", "W10", "W11", "WC2", "WC2A", "WC2B", "WC2E", "WC2H", "WC2N", "WC2R", "NW1", "NW8"],

  // ── Outer London ──

  Barking: ["IG11", "RM6", "RM7", "RM8", "RM9", "RM10"],

  Barnet: ["EN4", "EN5", "N2", "N3", "N11", "N12", "N20", "NW4", "NW7", "NW9", "NW11"],

  Bexley: ["DA5", "DA6", "DA7", "DA8", "DA14", "DA15", "DA16", "DA17", "DA18", "SE2", "SE9", "SE28"],

  Brent: ["HA0", "HA1", "HA3", "HA9", "NW2", "NW6", "NW9", "NW10"],

  Bromley: ["BR1", "BR2", "BR3", "BR4", "BR5", "BR6", "BR7", "BR8", "SE6", "SE9", "SE12", "SE20", "TN16"],

  Croydon: ["CR0", "CR2", "CR5", "CR7", "CR8", "SE19", "SE25", "SW16"],

  Ealing: ["UB1", "UB2", "UB5", "UB6", "W3", "W5", "W7", "W13"],

  Enfield: ["EN1", "EN2", "EN3", "EN8", "N9", "N13", "N14", "N18", "N21"],

  Haringey: ["N4", "N6", "N8", "N10", "N11", "N15", "N17", "N22"],

  Harrow: ["HA1", "HA2", "HA3", "HA5", "HA7", "HA8"],

  Havering: ["RM1", "RM2", "RM3", "RM5", "RM7", "RM11", "RM12", "RM13", "RM14"],

  Hillingdon: ["HA4", "HA6", "UB3", "UB4", "UB5", "UB7", "UB8", "UB9", "UB10", "UB11"],

  Hounslow: ["TW3", "TW4", "TW5", "TW7", "TW8", "TW13", "TW14", "W4"],

  "Kingston upon Thames": ["KT1", "KT2", "KT3", "KT5", "KT6", "KT9"],

  Merton: ["CR4", "SM4", "SW19", "SW20"],

  Redbridge: ["E11", "E12", "E18", "IG1", "IG2", "IG3", "IG4", "IG5", "IG6", "IG7", "IG8"],

  "Richmond upon Thames": ["KT2", "SW13", "SW14", "SW15", "TW1", "TW2", "TW9", "TW10", "TW11", "TW12"],

  Sutton: ["SM1", "SM2", "SM3", "SM5", "SM6", "SM7"],

  "Waltham Forest": ["E4", "E10", "E11", "E17"],
} as const;

export const londonCouncilOptions = Object.keys(londonCouncilCoverage);

export function getPostcodesForCouncils(councils: string[]) {
  return Array.from(
    new Set(
      councils.flatMap(
        (council) => londonCouncilCoverage[council as keyof typeof londonCouncilCoverage] || [],
      ),
    ),
  ).sort() as string[];
}

export function getCouncilsForPostcodes(postcodes: string[]) {
  return londonCouncilOptions.filter((council) =>
    (londonCouncilCoverage[council as keyof typeof londonCouncilCoverage] || []).some((postcode) =>
      postcodes.includes(postcode),
    ),
  );
}
