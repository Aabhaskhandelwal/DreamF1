import NavHeader from "@/components/NavHeader"
import TelemetryClient from "./TelemetryClient"
import type { F1Event } from "../dashboard/page"

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

export default async function TelemetryPage() {
  const events = await getSchedule()
  const today = new Date().toISOString().split("T")[0]
  // FastF1 has data for any race that has already happened — don't gate on is_completed
  // (that flag only flips when predictions are scored by an admin)
  const completed = events.filter((e) => e.event_date <= today)

  return (
    <div className="min-h-screen px-6 py-8 max-w-7xl mx-auto space-y-8">
      <NavHeader active="telemetry" />
      <TelemetryClient events={completed} />
    </div>
  )
}
