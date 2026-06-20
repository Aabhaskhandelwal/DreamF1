"use client"

import { useEffect, useState } from "react"
import {
  fetchStandings,
  type StandingsData,
  type DriverStanding,
  type ConstructorStanding,
} from "@/lib/standings"
import { teamColor } from "@/lib/design"
import DriverAvatar from "@/components/DriverAvatar"
import TeamLogo from "@/components/TeamLogo"

type View = "drivers" | "constructors"

const RANK_COLOR: Record<number, string> = { 1: "#ffd700", 2: "#c0c0c0", 3: "#cd7f32" }

function Num({ value, dim }: { value: string | number; dim?: boolean }) {
  return (
    <span
      className={`font-(family-name:--font-orbitron) tabular-nums ${dim ? "text-text-dim" : "text-text-secondary"}`}
    >
      {value}
    </span>
  )
}

function ColHead({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className="text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-muted text-right"
    >
      {children}
    </span>
  )
}

const DRIVER_COLS = "2.25rem minmax(10rem,1fr) 3.5rem 3.5rem 2.5rem 2.75rem 2.5rem 2.5rem 2.75rem 2.75rem 2.75rem 3.25rem"
const CONS_COLS = "2.25rem minmax(9rem,1fr) 3.5rem 3.5rem 2.5rem 2.75rem 2.75rem 2.5rem 2.5rem"

function DriverTable({ rows }: { rows: DriverStanding[] }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[46rem]">
        {/* header */}
        <div
          className="grid items-center gap-2 px-3 py-2 border-b border-border-default"
          style={{ gridTemplateColumns: DRIVER_COLS }}
        >
          <ColHead>#</ColHead>
          <span className="text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-muted">
            Driver
          </span>
          <ColHead title="Championship points">Pts</ColHead>
          <ColHead title="Gap to leader">Gap</ColHead>
          <ColHead title="Wins">W</ColHead>
          <ColHead title="Podiums">Pod</ColHead>
          <ColHead title="Pole positions">Pole</ColHead>
          <ColHead title="Fastest laps">FL</ColHead>
          <ColHead title="DNFs">DNF</ColHead>
          <ColHead title="Best finish">Best</ColHead>
          <ColHead title="Average finish">Avg</ColHead>
          <ColHead title="Points in last 3 races">Form</ColHead>
        </div>

        {rows.map((d) => {
          const color = teamColor(d.team_slug)
          const rankColor = RANK_COLOR[d.position]
          return (
            <div
              key={d.code || d.position}
              className="grid items-center gap-2 px-3 py-2 border-b border-border-subtle hover:bg-surface-1/60 transition-colors"
              style={{ gridTemplateColumns: DRIVER_COLS, boxShadow: `inset 3px 0 0 ${color}` }}
            >
              <span
                className="font-(family-name:--font-orbitron) font-bold tabular-nums text-sm"
                style={{ color: rankColor ?? "#888" }}
              >
                {d.position}
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <DriverAvatar code={d.code} slug={d.team_slug} size={26} />
                <div className="min-w-0">
                  <span
                    className="font-(family-name:--font-f1-regular) text-sm tracking-wider"
                    style={{ color }}
                  >
                    {d.code}
                  </span>
                  <span className="block text-[0.6rem] font-(family-name:--font-dm-mono) text-text-muted truncate">
                    {d.driver}
                  </span>
                </div>
              </div>
              <span className="text-right">
                <span className="font-(family-name:--font-orbitron) font-bold text-text-primary tabular-nums">
                  {d.points}
                </span>
              </span>
              <span className="text-right">
                <Num value={d.gap_to_leader === 0 ? "—" : `-${d.gap_to_leader}`} dim />
              </span>
              <span className="text-right"><Num value={d.wins} dim={!d.wins} /></span>
              <span className="text-right"><Num value={d.podiums} dim={!d.podiums} /></span>
              <span className="text-right"><Num value={d.poles} dim={!d.poles} /></span>
              <span className="text-right"><Num value={d.fastest_laps} dim={!d.fastest_laps} /></span>
              <span className="text-right">
                <span className={`font-(family-name:--font-orbitron) tabular-nums ${d.dnfs ? "text-f1-red" : "text-text-dim"}`}>
                  {d.dnfs}
                </span>
              </span>
              <span className="text-right"><Num value={d.best_finish ?? "—"} dim={d.best_finish === null} /></span>
              <span className="text-right"><Num value={d.avg_finish ?? "—"} dim={d.avg_finish === null} /></span>
              <span className="text-right"><Num value={`+${d.last3_points}`} dim={!d.last3_points} /></span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ConstructorTable({ rows }: { rows: ConstructorStanding[] }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[40rem]">
        <div
          className="grid items-center gap-2 px-3 py-2 border-b border-border-default"
          style={{ gridTemplateColumns: CONS_COLS }}
        >
          <ColHead>#</ColHead>
          <span className="text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-muted">
            Constructor
          </span>
          <ColHead title="Championship points">Pts</ColHead>
          <ColHead title="Gap to leader">Gap</ColHead>
          <ColHead title="Wins">W</ColHead>
          <ColHead title="Podiums">Pod</ColHead>
          <ColHead title="1-2 finishes">1-2</ColHead>
          <ColHead title="Pole positions">Pole</ColHead>
          <ColHead title="Fastest laps">FL</ColHead>
        </div>

        {rows.map((c) => {
          const color = teamColor(c.team_slug)
          const rankColor = RANK_COLOR[c.position]
          return (
            <div
              key={c.team || c.position}
              className="grid items-center gap-2 px-3 py-2.5 border-b border-border-subtle hover:bg-surface-1/60 transition-colors"
              style={{ gridTemplateColumns: CONS_COLS, boxShadow: `inset 3px 0 0 ${color}` }}
            >
              <span
                className="font-(family-name:--font-orbitron) font-bold tabular-nums text-sm"
                style={{ color: rankColor ?? "#888" }}
              >
                {c.position}
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <TeamLogo slug={c.team_slug} size={18} />
                <span
                  className="font-(family-name:--font-orbitron) text-sm font-medium truncate"
                  style={{ color }}
                >
                  {c.team}
                </span>
              </div>
              <span className="text-right">
                <span className="font-(family-name:--font-orbitron) font-bold text-text-primary tabular-nums">
                  {c.points}
                </span>
              </span>
              <span className="text-right"><Num value={c.gap_to_leader === 0 ? "—" : `-${c.gap_to_leader}`} dim /></span>
              <span className="text-right"><Num value={c.wins} dim={!c.wins} /></span>
              <span className="text-right"><Num value={c.podiums} dim={!c.podiums} /></span>
              <span className="text-right"><Num value={c.one_twos} dim={!c.one_twos} /></span>
              <span className="text-right"><Num value={c.poles} dim={!c.poles} /></span>
              <span className="text-right"><Num value={c.fastest_laps} dim={!c.fastest_laps} /></span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function StandingsClient() {
  const [data, setData] = useState<StandingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>("drivers")

  useEffect(() => {
    fetchStandings(2026)
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="glass-card p-8 space-y-3 animate-pulse">
        {[...Array(10)].map((_, i) => <div key={i} className="h-9 bg-border-subtle rounded" />)}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="section-label text-f1-red mb-1">Standings unavailable</p>
        <p className="text-text-muted text-sm font-(family-name:--font-dm-mono)">
          2026 championship standings could not be loaded right now.
        </p>
      </div>
    )
  }

  const rows = view === "drivers" ? data.drivers : data.constructors

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="section-label">{data.year} World Championship</p>
          <h1 className="font-(family-name:--font-orbitron) text-2xl font-bold text-text-primary">
            Standings
          </h1>
        </div>
        <div className="flex gap-2">
          {(["drivers", "constructors"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 text-[0.65rem] font-(family-name:--font-dm-mono) uppercase tracking-widest
                          border transition-colors cursor-pointer ${
                            view === v
                              ? "border-f1-red bg-f1-red text-white"
                              : "border-border-muted text-text-muted hover:text-text-primary hover:border-[#444]"
                          }`}
            >
              {v === "drivers" ? "Drivers" : "Constructors"}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {view === "drivers"
          ? <DriverTable rows={data.drivers} />
          : <ConstructorTable rows={data.constructors} />}
      </div>

      <p className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim">
        {rows.length} {view} · source: Ergast/Jolpica · aggregates over completed 2026 rounds
      </p>
    </div>
  )
}
