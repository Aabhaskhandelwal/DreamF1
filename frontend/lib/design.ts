export const TEAM_COLORS: Record<string, string> = {
  VER: "#4781D7",
  HAD: "#4781D7",
  NOR: "#F47600",
  PIA: "#F47600",
  LEC: "#ED1131",
  HAM: "#ED1131",
  RUS: "#00D7B6",
  ANT: "#00D7B6",
  ALO: "#229971",
  STR: "#229971",
  GAS: "#00A1E8",
  COL: "#00A1E8",
  ALB: "#1868DB",
  SAI: "#1868DB",
  LAW: "#6C98FF",
  LIN: "#6C98FF",
  HUL: "#F50537",
  BOR: "#F50537",
  BEA: "#9C9FA2",
  OCO: "#9C9FA2",
  BOT: "#909090",
  PER: "#909090",
};

export const DRIVERS_2026 = [
  "VER",
  "HAD",
  "NOR",
  "PIA",
  "LEC",
  "HAM",
  "RUS",
  "ANT",
  "ALO",
  "STR",
  "GAS",
  "COL",
  "ALB",
  "SAI",
  "LAW",
  "LIN",
  "HUL",
  "BOR",
  "BEA",
  "OCO",
  "BOT",
  "PER",
] as const; //so typescipty infers a literal union type

export type DriverCode = (typeof DRIVERS_2026)[number];

// Team colours keyed by the canonical slug the backend emits (team_slug).
export const TEAM_SLUG_COLORS: Record<string, string> = {
  mercedes: "#00D7B6",
  ferrari: "#ED1131",
  mclaren: "#F47600",
  redbull: "#4781D7",
  alpine: "#00A1E8",
  astonmartin: "#229971",
  williams: "#1868DB",
  racingbulls: "#6C98FF",
  audi: "#F50537",
  haas: "#9C9FA2",
  cadillac: "#909090",
};

export function teamColor(slug: string | null | undefined): string {
  return (slug && TEAM_SLUG_COLORS[slug]) || "#888888";
}

// Teammates share a colour, so give the 2nd/3rd car of a colour a dash pattern
// to keep overlapping line charts distinguishable. Returns code -> SVG dasharray
// ("" = solid line).
export function teammateDashes(codes: string[]): Record<string, string> {
  const seenByColor: Record<string, number> = {};
  const out: Record<string, string> = {};
  for (const code of codes) {
    const color = TEAM_COLORS[code] ?? "#666";
    const n = seenByColor[color] ?? 0;
    seenByColor[color] = n + 1;
    out[code] = n === 0 ? "" : n === 1 ? "7 5" : "2 4";
  }
  return out;
}
