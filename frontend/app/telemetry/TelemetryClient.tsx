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
  const today = new Date().toISOString().split("T")[0]
  const events = allEvents.filter((e) => e.event_date <= today)

  const last = events[events.length - 1]
  const [roundNum, setRoundNum] = useState<number>(last?.round_number ?? 0)
  const [tab, setTab] = useState<Tab>("race")
  const [loading, setLoading] = useState(false)

  const [summary, setSummary] = useState<RaceSummary | null>(null)
  const [tyres, setTyres] = useState<TyreData | null>(null)
  const [quali, setQuali] = useState<QualiData | null>(null)
  const [speed, setSpeed] = useState<SpeedData | null>(null)
  const [positions, setPositions] = useState<PositionData | null>(null)
  const [gaps, setGaps] = useState<GapData | null>(null)
  const [lapTimes, setLapTimes] = useState<LapTimesData | null>(null)
  const [sectors, setSectors] = useState<SectorData | null>(null)
  const [mapData, setMapData] = useState<MapData | null>(null)

  const selectedEvent = events.find((e) => e.round_number === roundNum)

  // Eager fetch on round change: race, tyres, quali
  useEffect(() => {
    if (!roundNum) return
    setLoading(true)
    setSummary(null); setTyres(null); setQuali(null)
    setSpeed(null); setPositions(null); setGaps(null); setLapTimes(null); setSectors(null); setMapData(null)

    const base = `http://localhost:8080/api/telemetry/2026/${roundNum}`
    const get = (path: string) =>
      fetch(`${base}/${path}`).then((r) => (r.ok ? r.json() : null)).catch(() => null)

    Promise.all([get("race_summary"), get("tyres"), get("quali")]).then(([s, t, q]) => {
      setSummary(s); setTyres(t); setQuali(q)
      setLoading(false)
    })
  }, [roundNum])

  // Lazy loaders — fire only on first visit to that tab
  useEffect(() => {
    if (tab !== "laptimes" || lapTimes !== null || !roundNum) return
    fetch(`http://localhost:8080/api/telemetry/2026/${roundNum}/laptimes`)
      .then((r) => (r.ok ? r.json() : null)).catch(() => null).then(setLapTimes)
  }, [tab, roundNum, lapTimes])

  useEffect(() => {
    if (tab !== "positions" || positions !== null || !roundNum) return
    fetch(`http://localhost:8080/api/telemetry/2026/${roundNum}/positions`)
      .then((r) => (r.ok ? r.json() : null)).catch(() => null).then(setPositions)
  }, [tab, roundNum, positions])

  useEffect(() => {
    if (tab !== "gaps" || gaps !== null || !roundNum) return
    fetch(`http://localhost:8080/api/telemetry/2026/${roundNum}/gaps`)
      .then((r) => (r.ok ? r.json() : null)).catch(() => null).then(setGaps)
  }, [tab, roundNum, gaps])

  useEffect(() => {
    if (tab !== "sectors" || sectors !== null || !roundNum) return
    fetch(`http://localhost:8080/api/telemetry/2026/${roundNum}/sector_times`)
      .then((r) => (r.ok ? r.json() : null)).catch(() => null).then(setSectors)
  }, [tab, roundNum, sectors])

  useEffect(() => {
    if (tab !== "speed" || speed !== null || !roundNum) return
    fetch(`http://localhost:8080/api/telemetry/2026/${roundNum}/speed`)
      .then((r) => (r.ok ? r.json() : null)).catch(() => null).then(setSpeed)
  }, [tab, roundNum, speed])

  useEffect(() => {
    if (tab !== "map" || mapData !== null || !roundNum) return
    fetch(`http://localhost:8080/api/telemetry/2026/${roundNum}/map`)
      .then((r) => (r.ok ? r.json() : null)).catch(() => null).then(setMapData)
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
            lapTimes
              ? <LapTimesChart data={lapTimes} />
              : <Spinner />
          )}

          {tab === "positions" && (
            positions
              ? <PositionChart data={positions} />
              : <Spinner />
          )}

          {tab === "gaps" && (
            gaps
              ? <GapChart data={gaps} />
              : <Spinner />
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
            sectors
              ? <SectorTimes data={sectors} />
              : <Spinner />
          )}

          {tab === "speed" && (
            speed
              ? <SpeedTrace drivers={speed.drivers} />
              : <Spinner />
          )}

          {tab === "map" && (
            mapData
              ? <CircuitMap data={mapData} />
              : <Spinner />
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
