export interface DriverStanding {
  position: number
  code: string
  driver: string
  team: string
  team_slug: string
  points: number
  wins: number
  podiums: number
  poles: number
  fastest_laps: number
  dnfs: number
  best_finish: number | null
  avg_finish: number | null
  races: number
  points_per_race: number | null
  last3_points: number
  gap_to_leader: number
  gap_to_next: number
}

export interface ConstructorStanding {
  position: number
  team: string
  team_slug: string
  points: number
  wins: number
  podiums: number
  one_twos: number
  poles: number
  fastest_laps: number
  gap_to_leader: number
  gap_to_next: number
}

export interface StandingsData {
  year: number
  drivers: DriverStanding[]
  constructors: ConstructorStanding[]
  _error?: string
}

export async function fetchStandings(year = 2026): Promise<StandingsData | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/standings/${year}`)
    if (!res.ok) return null
    const data = (await res.json()) as StandingsData
    return data._error ? null : data
  } catch {
    return null
  }
}
