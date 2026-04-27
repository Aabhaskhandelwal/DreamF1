import NavHeader from "@/components/NavHeader"
import PredictClient from "./PredictClient"
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

export default async function PredictPage() {
  const { events, backendDown } = await getSchedule()
  const nextRace = events.find((e) => !e.is_completed) ?? null

  return (
    <div className="min-h-screen px-6 py-8 max-w-7xl mx-auto space-y-8">
      <NavHeader active="predict" />
      <PredictClient nextRace={nextRace} backendDown={backendDown} />
    </div>
  )
}
