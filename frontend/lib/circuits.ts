// Static circuit facts keyed by the same track-image key used for thumbnails
// (see COUNTRY_TO_TRACK in TelemetryClient). Only stable, circuit-level facts
// live here — the fastest lap is pulled live from each race's results.
//
// length_km  — official track length
// first_gp   — year of the first Formula 1 World Championship race at this circuit
// laps       — scheduled race distance in laps
//
// Missing fields degrade gracefully in the UI (the stat is hidden).

export interface CircuitFacts {
  name: string
  length_km: number
  first_gp: number
  laps: number
}

export const CIRCUITS: Record<string, CircuitFacts> = {
  Australia: { name: "Albert Park Circuit", length_km: 5.278, first_gp: 1996, laps: 58 },
  Bahrain: { name: "Bahrain International Circuit", length_km: 5.412, first_gp: 2004, laps: 57 },
  SaudiArabia: { name: "Jeddah Corniche Circuit", length_km: 6.174, first_gp: 2021, laps: 50 },
  Japan: { name: "Suzuka Circuit", length_km: 5.807, first_gp: 1987, laps: 53 },
  China: { name: "Shanghai International Circuit", length_km: 5.451, first_gp: 2004, laps: 56 },
  Monaco: { name: "Circuit de Monaco", length_km: 3.337, first_gp: 1950, laps: 78 },
  Spain: { name: "Circuit de Barcelona-Catalunya", length_km: 4.657, first_gp: 1991, laps: 66 },
  Canada: { name: "Circuit Gilles Villeneuve", length_km: 4.361, first_gp: 1978, laps: 70 },
  Austria: { name: "Red Bull Ring", length_km: 4.318, first_gp: 1970, laps: 71 },
  UnitedKingdom: { name: "Silverstone Circuit", length_km: 5.891, first_gp: 1950, laps: 52 },
  Hungary: { name: "Hungaroring", length_km: 4.381, first_gp: 1986, laps: 70 },
  Belgium: { name: "Circuit de Spa-Francorchamps", length_km: 7.004, first_gp: 1950, laps: 44 },
  Netherlands: { name: "Circuit Zandvoort", length_km: 4.259, first_gp: 1952, laps: 72 },
  Azerbaijan: { name: "Baku City Circuit", length_km: 6.003, first_gp: 2016, laps: 51 },
  Singapore: { name: "Marina Bay Street Circuit", length_km: 4.94, first_gp: 2008, laps: 62 },
  Mexico: { name: "Autódromo Hermanos Rodríguez", length_km: 4.304, first_gp: 1963, laps: 71 },
  Brazil: { name: "Autódromo José Carlos Pace", length_km: 4.309, first_gp: 1973, laps: 71 },
  Qatar: { name: "Lusail International Circuit", length_km: 5.419, first_gp: 2021, laps: 57 },
  UnitedArabEmirates: { name: "Yas Marina Circuit", length_km: 5.281, first_gp: 2009, laps: 58 },
  UnitedStates: { name: "Circuit of the Americas", length_km: 5.513, first_gp: 2012, laps: 56 },
  Miami: { name: "Miami International Autodrome", length_km: 5.412, first_gp: 2022, laps: 57 },
  LasVegas: { name: "Las Vegas Strip Circuit", length_km: 6.201, first_gp: 2023, laps: 50 },
  Italy: { name: "Autodromo Nazionale Monza", length_km: 5.793, first_gp: 1950, laps: 53 },
  Imola: { name: "Autodromo Enzo e Dino Ferrari", length_km: 4.909, first_gp: 1980, laps: 63 },
}

const COUNTRY_TO_KEY: Record<string, string> = {
  Australia: "Australia", Bahrain: "Bahrain", "Saudi Arabia": "SaudiArabia",
  Japan: "Japan", China: "China", Monaco: "Monaco", Spain: "Spain",
  Canada: "Canada", Austria: "Austria", "Great Britain": "UnitedKingdom",
  Hungary: "Hungary", Belgium: "Belgium", Netherlands: "Netherlands",
  Azerbaijan: "Azerbaijan", Singapore: "Singapore", Mexico: "Mexico",
  Brazil: "Brazil", Qatar: "Qatar", "Abu Dhabi": "UnitedArabEmirates",
  "United Arab Emirates": "UnitedArabEmirates",
}

/** Resolve a country + event name to the circuit key (handles multi-circuit countries). */
export function getCircuitKey(country: string, eventName: string): string | null {
  if (country === "United States") {
    const n = eventName.toLowerCase()
    if (n.includes("miami")) return "Miami"
    if (n.includes("las vegas")) return "LasVegas"
    return "UnitedStates"
  }
  if (country === "Italy") {
    const n = eventName.toLowerCase()
    if (n.includes("emilia") || n.includes("imola")) return "Imola"
    return "Italy"
  }
  return COUNTRY_TO_KEY[country] ?? null
}

// Try these extensions in order — drop a file in /public/assets/circuits/ named
// by the circuit key (e.g. Spain.avif, Monaco.png) and it's picked up automatically.
const IMAGE_EXTS = ["avif", "png", "webp", "jpg"]

/** Candidate circuit-diagram image paths, most-preferred first. */
export function getCircuitImageCandidates(country: string, eventName: string): string[] {
  const key = getCircuitKey(country, eventName)
  if (!key) return []
  return IMAGE_EXTS.map((ext) => `/assets/circuits/${key}.${ext}`)
}

export function getCircuitFacts(country: string, eventName: string): CircuitFacts | null {
  const key = getCircuitKey(country, eventName)
  return key ? CIRCUITS[key] ?? null : null
}
