import NavHeader from "@/components/NavHeader"
import TelemetryClient from "./TelemetryClient"
import type { F1Event } from "../dashboard/page"

export const dynamic = "force-dynamic"

async function getSchedule(): Promise<{ events: F1Event[]; backendDown: boolean }> {
  try {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : (process.env.API_URL ?? "http://localhost:8080")
    const res = await fetch(`${base}/api/schedule`, {
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
    <div className="min-h-screen px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <NavHeader active="telemetry" />
      <TelemetryClient events={events} backendDown={backendDown} />
    </div>
  )
}
