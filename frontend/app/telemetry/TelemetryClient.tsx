"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import type { F1Event } from "../dashboard/page"
import RaceClassification, { type RaceResult } from "./RaceClassification"
import TyreStrategy, { type TyreStint } from "./TyreStrategy"
import QualiTimes, { type QualiResult } from "./QualiTimes"
import SpeedTrace from "./SpeedTrace"
import PositionChart, { type PositionData } from "./PositionChart"
import GapChart, { type GapData } from "./GapChart"
import LapTimesChart, { type LapTimesData } from "./LapTimesChart"
import SectorTimes, { type SectorData } from "./SectorTimes"
import CircuitMap, { type MapData } from "./CircuitMap"

type Tab = "race" | "laptimes" | "positions" | "gaps" | "tyres" | "quali" | "sectors" | "speed" | "map"

interface RaceSummary { session: string; results: RaceResult[] }
interface TyreData { session: string; stints: TyreStint[] }
interface QualiData { session: string; results: QualiResult[] }
interface SpeedData { session: string; drivers: Record<string, { distance: number[]; speed: number[] }> }

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ""

function parseUTC(iso: string | null): Date | null {
  if (!iso) return null
  return new Date(iso.endsWith("Z") ? iso : iso + "Z")
}

const COUNTRY_TO_TRACK: Record<string, string> = {
  Australia: "Australia", Bahrain: "Bahrain", "Saudi Arabia": "SaudiArabia",
  Japan: "Japan", China: "China", Monaco: "Monaco", Spain: "Spain",
  Canada: "Canada", Austria: "Austria", "Great Britain": "UnitedKingdom",
  Hungary: "Hungary", Belgium: "Belgium", Netherlands: "Netherlands",
  Azerbaijan: "Azerbaijan", Singapore: "Singapore", Mexico: "Mexico",
  Brazil: "Brazil", Qatar: "Qatar", "Abu Dhabi": "UnitedArabEmirates",
  "United Arab Emirates": "UnitedArabEmirates",
}

function getTrackImage(country: string, eventName: string): string | null {
  if (country === "United States") {
    const n = eventName.toLowerCase()
    if (n.includes("miami")) return "/assets/tracks/Miami.png"
    if (n.includes("las vegas")) return "/assets/tracks/LasVegas.png"
    return "/assets/tracks/UnitedStates.png"
  }
  if (country === "Italy") {
    const n = eventName.toLowerCase()
    if (n.includes("emilia") || n.includes("imola")) return "/assets/tracks/Imola.png"
    return "/assets/tracks/Italy.png"
  }
  const key = COUNTRY_TO_TRACK[country]
  return key ? `/assets/tracks/${key}.png` : null
}

const TABS: { key: Tab; label: string }[] = [
  { key: "race", label: "Race" },
  { key: "laptimes", label: "Lap Times" },
  { key: "positions", label: "Positions" },
  { key: "gaps", label: "Gaps" },
  { key: "tyres", label: "Tyres" },
  { key: "quali", label: "Qualifying" },
  { key: "sectors", label: "Sectors" },
  { key: "speed", label: "Speed Trace" },
  { key: "map", label: "Circuit" },
]

export default function TelemetryClient({
  events: allEvents,
  backendDown,
}: {
  events: F1Event[]
  backendDown: boolean
}) {
  const now = new Date()
  // Only include a race once its race session (session5) has started.
  // Falls back to strict event_date < today when session dates aren't populated yet.
  const events = allEvents.filter((e) => {
    const raceStart = parseUTC(e.session5_date) ?? new Date(e.event_date + "T23:59:59Z")
    return raceStart <= now
  })

  const last = events[events.length - 1]
  const [roundNum, setRoundNum] = useState<number>(last?.round_number ?? 0)
  const [tab, setTab] = useState<Tab>("race")
  const [loading, setLoading] = useState(false)

  const [summary, setSummary] = useState<RaceSummary | null>(null)
  const [tyres, setTyres] = useState<TyreData | null>(null)
  const [quali, setQuali] = useState<QualiData | null>(null)
  const [speed, setSpeed] = useState<SpeedData | false | null>(null)
  const [positions, setPositions] = useState<PositionData | false | null>(null)
  const [gaps, setGaps] = useState<GapData | false | null>(null)
  const [lapTimes, setLapTimes] = useState<LapTimesData | false | null>(null)
  const [sectors, setSectors] = useState<SectorData | false | null>(null)
  const [mapData, setMapData] = useState<MapData | false | null>(null)

  const selectedEvent = events.find((e) => e.round_number === roundNum)

  // Eager fetch on round change: race, tyres, quali
  useEffect(() => {
    if (!roundNum) return
    setLoading(true)
    setSummary(null); setTyres(null); setQuali(null)
    setSpeed(null); setPositions(null); setGaps(null); setLapTimes(null); setSectors(null); setMapData(null)

    const base = `${API_BASE}/api/telemetry/2026/${roundNum}`
    const get = (path: string) =>
      fetch(`${base}/${path}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
        .then((d) => (d && d._error ? null : d))

    Promise.all([get("race_summary"), get("tyres"), get("quali")]).then(([s, t, q]) => {
      setSummary(s); setTyres(t); setQuali(q)
      setLoading(false)
    })
  }, [roundNum])

  // Lazy loaders — fire only on first visit to that tab.
  // null = not yet fetched, false = tried and failed, T = data ready.
  const lazyFetch = (url: string, set: (v: never | false) => void) =>
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((d) => set((d && !d._error ? d : false) as never))

  useEffect(() => {
    if (tab !== "laptimes" || lapTimes !== null || !roundNum) return
    lazyFetch(`${API_BASE}/api/telemetry/2026/${roundNum}/laptimes`, setLapTimes)
  }, [tab, roundNum, lapTimes])

  useEffect(() => {
    if (tab !== "positions" || positions !== null || !roundNum) return
    lazyFetch(`${API_BASE}/api/telemetry/2026/${roundNum}/positions`, setPositions)
  }, [tab, roundNum, positions])

  useEffect(() => {
    if (tab !== "gaps" || gaps !== null || !roundNum) return
    lazyFetch(`${API_BASE}/api/telemetry/2026/${roundNum}/gaps`, setGaps)
  }, [tab, roundNum, gaps])

  useEffect(() => {
    if (tab !== "sectors" || sectors !== null || !roundNum) return
    lazyFetch(`${API_BASE}/api/telemetry/2026/${roundNum}/sector_times`, setSectors)
  }, [tab, roundNum, sectors])

  useEffect(() => {
    if (tab !== "speed" || speed !== null || !roundNum) return
    lazyFetch(`${API_BASE}/api/telemetry/2026/${roundNum}/speed`, setSpeed)
  }, [tab, roundNum, speed])

  useEffect(() => {
    if (tab !== "map" || mapData !== null || !roundNum) return
    lazyFetch(`${API_BASE}/api/telemetry/2026/${roundNum}/map`, setMapData)
  }, [tab, roundNum, mapData])

  const trackImage = selectedEvent
    ? getTrackImage(selectedEvent.country, selectedEvent.event_name)
    : null

  const driverOrder = summary?.results.map((r) => r.abbreviation) ?? []

  if (backendDown || events.length === 0) {
    return (
      <div className="glass-card p-8 space-y-2">
        <p className="section-label text-f1-red">
          {backendDown ? "Backend unavailable" : "No past races found"}
        </p>
        <p className="text-text-muted text-sm font-(family-name:--font-dm-mono)">
          {backendDown
            ? "Start the FastAPI server on port 8080 — cd backend && uvicorn main:app --reload"
            : "No races with a past event date were returned from the schedule API."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Race selector + track header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          {trackImage && (
            <div className="relative w-20 h-12 shrink-0">
              <Image src={trackImage} alt="track" fill className="object-contain opacity-60" />
            </div>
          )}
          <div>
            <p className="section-label">Race Analysis</p>
            <h2 className="font-(family-name:--font-orbitron) text-lg font-bold text-text-primary">
              {selectedEvent?.event_name ?? "—"}
            </h2>
          </div>
        </div>

        <select
          value={roundNum}
          onChange={(e) => { setRoundNum(Number(e.target.value)); setTab("race") }}
          className="w-full sm:w-auto glass-card px-3 py-2 text-xs sm:text-sm font-(family-name:--font-dm-mono)
                     text-text-secondary bg-transparent border border-[#1e1e1e] rounded cursor-pointer
                     focus:outline-none focus:border-f1-red"
        >
          {events.map((e) => (
            <option key={e.round_number} value={e.round_number} className="bg-[#111]">
              R{e.round_number} · {e.event_name}
            </option>
          ))}
        </select>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-[#1e1e1e] overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 sm:px-4 py-2 text-xs font-(family-name:--font-dm-mono) uppercase tracking-widest
                       transition-colors border-b-2 -mb-px cursor-pointer shrink-0 ${
                         tab === key
                           ? "border-f1-red text-text-primary"
                           : "border-transparent text-text-muted hover:text-text-secondary"
                       }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="glass-card p-8 space-y-3 animate-pulse">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-8 bg-border-subtle rounded" />
          ))}
        </div>
      ) : (
        <>
          {tab === "race" && (
            summary
              ? <RaceClassification results={summary.results} />
              : <EmptyState message="Race data not available for this round." />
          )}

          {tab === "laptimes" && (
            lapTimes === null ? <Spinner /> :
            lapTimes ? <LapTimesChart data={lapTimes} /> :
            <EmptyState message="Lap time data not available for this round." />
          )}

          {tab === "positions" && (
            positions === null ? <Spinner /> :
            positions ? <PositionChart data={positions} /> :
            <EmptyState message="Position data not available for this round." />
          )}

          {tab === "gaps" && (
            gaps === null ? <Spinner /> :
            gaps ? <GapChart data={gaps} /> :
            <EmptyState message="Gap data not available for this round." />
          )}

          {tab === "tyres" && (
            tyres && driverOrder.length > 0
              ? <TyreStrategy stints={tyres.stints} driverOrder={driverOrder} />
              : <EmptyState message="Tyre data not available for this round." />
          )}

          {tab === "quali" && (
            quali
              ? <QualiTimes results={quali.results} />
              : <EmptyState message="Qualifying data not available for this round." />
          )}

          {tab === "sectors" && (
            sectors === null ? <Spinner /> :
            sectors ? <SectorTimes data={sectors} /> :
            <EmptyState message="Sector data not available for this round." />
          )}

          {tab === "speed" && (
            speed === null ? <Spinner /> :
            speed ? <SpeedTrace drivers={speed.drivers} /> :
            <EmptyState message="Speed trace data not available for this round." />
          )}

          {tab === "map" && (
            mapData === null ? <Spinner /> :
            mapData ? <CircuitMap data={mapData} /> :
            <EmptyState message="Circuit map data not available for this round." />
          )}
        </>
      )}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="glass-card p-8 text-center">
      <p className="text-text-muted text-sm font-(family-name:--font-dm-mono)">{message}</p>
    </div>
  )
}

function Spinner() {
  return (
    <div className="glass-card p-8 space-y-3 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-8 bg-border-subtle rounded" />
      ))}
    </div>
  )
}
