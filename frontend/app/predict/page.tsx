import NavHeader from "@/components/NavHeader"
import PredictClient from "./PredictClient"
import type { F1Event } from "../dashboard/page"

export const dynamic = "force-dynamic"

async function getSchedule(): Promise<{ events: F1Event[]; backendDown: boolean }> {
  try {
    const res = await fetch(`${process.env.API_URL ?? "http://localhost:8080"}/api/schedule`, {
      cache: "no-store",
    })
    if (!res.ok) return { events: [], backendDown: true }
    const events: F1Event[] = await res.json()
    return { events, backendDown: false }
  } catch {
    return { events: [], backendDown: true }
  }
}

export default async function PredictPage() {
  const { events, backendDown } = await getSchedule()
  const today = new Date().toISOString().split("T")[0]
  const nextRace = events.find((e) => e.event_date >= today) ?? null

  // Lock predictions once the first session (FP1) starts.
  // Falls back to race day noon UTC when session dates are unavailable.
  let predictionsLocked = false
  if (nextRace) {
    const raw = nextRace.session1_date
    const fp1 = raw
      ? new Date(raw.endsWith("Z") ? raw : raw + "Z")
      : new Date(nextRace.event_date + "T12:00:00Z")
    predictionsLocked = new Date() >= fp1
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <NavHeader active="predict" />
      <PredictClient nextRace={nextRace} backendDown={backendDown} locked={predictionsLocked} />
    </div>
  )
}
