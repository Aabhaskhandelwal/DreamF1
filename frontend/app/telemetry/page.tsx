import NavHeader from "@/components/NavHeader"
import TelemetryClient from "./TelemetryClient"
import type { F1Event } from "../dashboard/page"

async function getSchedule(): Promise<{ events: F1Event[]; backendDown: boolean }> {
  try {
    const res = await fetch("http://localhost:8080/api/schedule", {
      cache: "no-store",
    })
    if (!res.ok) return { events: [], backendDown: true }
    const events: F1Event[] = await res.json()
    return { events, backendDown: false }
  } catch {
    return { events: [], backendDown: true }
  }
}

export default async function TelemetryPage() {
  const { events, backendDown } = await getSchedule()

  return (
    <div className="min-h-screen px-6 py-8 max-w-7xl mx-auto space-y-8">
      <NavHeader active="telemetry" />
      <TelemetryClient events={events} backendDown={backendDown} />
    </div>
  )
}
