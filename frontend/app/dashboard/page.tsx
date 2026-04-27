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

async function getSchedule(): Promise<{ events: F1Event[]; backendDown: boolean }> {
  try {
    const res = await fetch("http://localhost:8080/api/schedule", {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return { events: [], backendDown: true }
    const events: F1Event[] = await res.json()
    return { events, backendDown: false }
  } catch {
    return { events: [], backendDown: true }
  }
}

export default async function DashboardPage() {
  const { events, backendDown } = await getSchedule()
  const today = new Date().toISOString().split("T")[0]
  const completed = events.filter((e) => e.is_completed)
  const upcoming = events.filter((e) => !e.is_completed)
  const nextRace = upcoming[0] ?? null

  return (
    <div className="min-h-screen px-6 py-8 max-w-7xl mx-auto space-y-8">
      <NavHeader active="dashboard" />

      {backendDown && (
        <div className="glass-card p-4 border-l-2 border-f1-red">
          <p className="text-sm font-(family-name:--font-dm-mono) text-text-muted">
            Backend offline — start it with{" "}
            <code className="text-f1-red">uvicorn main:app --reload</code> in{" "}
            <code className="text-text-secondary">backend/</code>
          </p>
        </div>
      )}

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
