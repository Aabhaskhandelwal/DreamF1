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
  const completed = events.filter((e) => e.is_completed)

  return (
    <div className="min-h-screen px-6 py-8 max-w-7xl mx-auto space-y-8">
      <NavHeader active="telemetry" />
      <TelemetryClient events={completed} />
    </div>
  )
}
