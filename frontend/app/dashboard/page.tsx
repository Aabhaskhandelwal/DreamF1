import NextRaceCard from "./NextRaceCard"
import SeasonMetrics from "./SeasonMetrics"
import CirclesOverview from "./CirclesOverview"
import NavHeader from "@/components/NavHeader"

export interface F1Event {
  id: number
  round_number: number
  event_name: string
  country: string
  event_date: string
  is_completed: boolean
}

async function getSchedule(): Promise<F1Event[]> {
  try {
    const res = await fetch("http://localhost:8080/api/schedule", {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function DashboardPage() {
  const events = await getSchedule()
  const completed = events.filter((e) => e.is_completed)
  const upcoming = events.filter((e) => !e.is_completed)
  const nextRace = upcoming[0] ?? null

  return (
    <div className="min-h-screen px-6 py-8 max-w-7xl mx-auto space-y-8">
      <NavHeader active="dashboard" />

      {nextRace && <NextRaceCard event={nextRace} />}

      <SeasonMetrics
        total={events.length}
        completed={completed.length}
        remaining={upcoming.length}
      />

      <CirclesOverview />
    </div>
  )
}
