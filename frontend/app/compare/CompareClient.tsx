"use client"

import { useEffect, useMemo, useState } from "react"
import { TEAM_COLORS } from "@/lib/design"
import { parseUTC } from "@/lib/trackData"
import DriverAvatar from "@/components/DriverAvatar"
import DriverSelect from "../predict/DriverSelect"
import type { F1Event } from "../dashboard/page"

interface DriverChannels {
  team_slug: string
  lap_time: number | null
  compound: string | null
  distance: number[]
  speed: number[]
  throttle: number[]
  brake: number[]
  gear: (number | null)[]
  drs: number[]
}

interface CompareData {
  session: string
  round: number
  d1: string
  d2: string
  drivers: Record<string, DriverChannels>
  delta: { distance: number[]; delta: (number | null)[] } | null
  _error?: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ""

function fmtLap(s: number | null): string {
  if (s == null) return "—"
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toFixed(3).padStart(6, "0")}`
}

// ── Reusable channel chart ──────────────────────────────────────────
interface Series {
  dist: number[]
  vals: (number | null)[]
  color: string
  dash?: string
}

function Chart({
  label, series, height = 110, yMin, yMax, baseline, fmtY, dMax,
}: {
  label: string
  series: Series[]
  height?: number
  yMin?: number
  yMax?: number
  baseline?: number
  fmtY?: (v: number) => string
  dMax: number
}) {
  const W = 1000
  const PAD = { l: 46, r: 12, t: 10, b: 6 }
  const allV = series.flatMap((s) => s.vals).filter((v): v is number => v != null)
  const lo = yMin ?? (allV.length ? Math.min(...allV) : 0)
  const hi = yMax ?? (allV.length ? Math.max(...allV) : 1)
  const x = (d: number) => PAD.l + (d / (dMax || 1)) * (W - PAD.l - PAD.r)
  const y = (v: number) => height - PAD.b - ((v - lo) / ((hi - lo) || 1)) * (height - PAD.t - PAD.b)
  const fy = fmtY ?? ((v: number) => `${Math.round(v)}`)

  const path = (s: Series) => {
    let d = ""
    let started = false
    for (let i = 0; i < s.vals.length; i++) {
      const v = s.vals[i]
      if (v == null) { started = false; continue }
      d += `${started ? "L" : "M"}${x(s.dist[i]).toFixed(1)},${y(v).toFixed(1)} `
      started = true
    }
    return d.trim()
  }

  const ticks = [lo, (lo + hi) / 2, hi]

  return (
    <div>
      <p className="text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-muted mb-1">{label}</p>
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" style={{ height: "auto" }}>
        {ticks.map((v, i) => (
          <g key={i}>
            <line x1={PAD.l} y1={y(v)} x2={W - PAD.r} y2={y(v)} stroke="#1a1a1a" strokeWidth={1} />
            <text x={PAD.l - 5} y={y(v) + 3} textAnchor="end" fontSize={11} fill="#555" fontFamily="var(--font-dm-mono)">{fy(v)}</text>
          </g>
        ))}
        {baseline != null && (
          <line x1={PAD.l} y1={y(baseline)} x2={W - PAD.r} y2={y(baseline)} stroke="#ED1131" strokeWidth={1} opacity={0.4} strokeDasharray="5 3" />
        )}
        {series.map((s, i) => (
          <path key={i} d={path(s)} fill="none" stroke={s.color} strokeWidth={1.9} strokeDasharray={s.dash || undefined} strokeLinejoin="round" strokeLinecap="round" />
        ))}
      </svg>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────
export default function CompareClient({ events, backendDown }: { events: F1Event[]; backendDown: boolean }) {
  const now = new Date()
  const pastEvents = useMemo(
    () =>
      events.filter((e) => {
        const raceStart = parseUTC(e.session5_date) ?? new Date(e.event_date + "T23:59:59Z")
        return raceStart <= now
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events]
  )

  const last = pastEvents[pastEvents.length - 1]
  const [roundNum, setRoundNum] = useState<number>(last?.round_number ?? 0)
  const [d1, setD1] = useState<string | null>("VER")
  const [d2, setD2] = useState<string | null>("NOR")
  const [data, setData] = useState<CompareData | false | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!roundNum || !d1 || !d2 || d1 === d2) return
    setLoading(true)
    setData(null)
    fetch(`${API_BASE}/api/telemetry/2026/${roundNum}/compare/${d1}/${d2}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((d: CompareData | null) => setData(d && !d._error ? d : false))
      .finally(() => setLoading(false))
  }, [roundNum, d1, d2])

  if (backendDown || pastEvents.length === 0) {
    return (
      <div className="glass-card p-8 space-y-2">
        <p className="section-label text-f1-red">{backendDown ? "Backend unavailable" : "No past races"}</p>
        <p className="text-text-muted text-sm font-(family-name:--font-dm-mono)">
          {backendDown ? "Start the FastAPI server on port 8080." : "No completed 2026 races to compare yet."}
        </p>
      </div>
    )
  }

  const c1 = d1 ? TEAM_COLORS[d1] ?? "#888" : "#888"
  let c2 = d2 ? TEAM_COLORS[d2] ?? "#bbb" : "#bbb"
  const sameColor = c1 === c2
  if (sameColor) c2 = "#cfcfcf" // keep teammates distinct
  const dash2 = sameColor ? "7 5" : undefined

  const dr1 = data && d1 ? data.drivers[d1] : undefined
  const dr2 = data && d2 ? data.drivers[d2] : undefined
  const dMax = data && dr1 && dr2 ? Math.max(...dr1.distance, ...dr2.distance) : 1
  const lapGap = dr1?.lap_time != null && dr2?.lap_time != null ? dr2.lap_time - dr1.lap_time : null

  const ch = (sel: (d: DriverChannels) => (number | null)[]): Series[] =>
    dr1 && dr2
      ? [
          { dist: dr1.distance, vals: sel(dr1), color: c1 },
          { dist: dr2.distance, vals: sel(dr2), color: c2, dash: dash2 },
        ]
      : []

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="section-label">Head to Head</p>
        <h1 className="font-(family-name:--font-orbitron) text-2xl font-bold text-text-primary">Driver Comparison</h1>
        <p className="text-text-muted text-xs font-(family-name:--font-dm-mono) mt-1">Fastest-lap telemetry · {data && data.session ? data.session : "—"}</p>
      </div>

      {/* Controls */}
      <div className="glass-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-dim">Race</label>
          <select
            value={roundNum}
            onChange={(e) => setRoundNum(Number(e.target.value))}
            className="mt-1 w-full bg-surface-2 border border-border-default rounded px-3 py-2 text-xs font-(family-name:--font-dm-mono) text-text-secondary cursor-pointer focus:outline-none focus:border-f1-red"
          >
            {pastEvents.map((e) => (
              <option key={e.round_number} value={e.round_number} className="bg-[#111]">
                R{e.round_number} · {e.event_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-dim">Driver 1</label>
          <div className="mt-1"><DriverSelect value={d1} onChange={setD1} placeholder="Driver 1" disabledCodes={new Set(d2 ? [d2] : [])} /></div>
        </div>
        <div>
          <label className="text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-dim">Driver 2</label>
          <div className="mt-1"><DriverSelect value={d2} onChange={setD2} placeholder="Driver 2" disabledCodes={new Set(d1 ? [d1] : [])} /></div>
        </div>
      </div>

      {!d1 || !d2 || d1 === d2 ? (
        <div className="glass-card p-8 text-center"><p className="text-text-muted text-sm font-(family-name:--font-dm-mono)">Pick two different drivers.</p></div>
      ) : loading ? (
        <div className="glass-card p-8 space-y-3 animate-pulse">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-border-subtle rounded" />)}</div>
      ) : !data || !dr1 || !dr2 ? (
        <div className="glass-card p-8 text-center">
          <p className="section-label text-f1-red mb-1">No telemetry</p>
          <p className="text-text-muted text-sm font-(family-name:--font-dm-mono)">One of these drivers has no fastest-lap telemetry for this race. Try another pairing or round.</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="glass-card p-4 flex items-center justify-between gap-4 flex-wrap">
            <DriverSummary code={d1} color={c1} ch={dr1} />
            <div className="text-center">
              <p className="text-[0.5rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-dim">Lap Gap</p>
              <p className="font-(family-name:--font-orbitron) text-xl font-bold tabular-nums" style={{ color: lapGap != null && lapGap > 0 ? c1 : c2 }}>
                {lapGap == null ? "—" : `${lapGap > 0 ? "+" : ""}${lapGap.toFixed(3)}s`}
              </p>
            </div>
            <DriverSummary code={d2} color={c2} ch={dr2} alignRight />
          </div>

          {/* Charts */}
          <div className="glass-card p-4 space-y-4">
            <div className="flex items-center gap-5 text-[0.6rem] font-(family-name:--font-dm-mono) uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><span className="w-4" style={{ borderTop: `2px solid ${c1}` }} /> {d1}</span>
              <span className="flex items-center gap-1.5"><span className="w-4" style={{ borderTop: `2px ${dash2 ? "dashed" : "solid"} ${c2}` }} /> {d2}</span>
              <span className="ml-auto normal-case tracking-normal text-text-dim">x-axis: lap distance (m)</span>
            </div>
            <Chart label="Speed (km/h)" series={ch((d) => d.speed)} height={170} dMax={dMax} />
            {data.delta && (
              <Chart
                label={`Delta to ${d1} (s) — above zero = ${d2} slower`}
                series={[{ dist: data.delta.distance, vals: data.delta.delta, color: c2, dash: dash2 }]}
                height={120}
                baseline={0}
                fmtY={(v) => v.toFixed(2)}
                dMax={dMax}
              />
            )}
            <Chart label="Throttle (%)" series={ch((d) => d.throttle)} height={90} yMin={0} yMax={100} dMax={dMax} />
            <Chart label="Brake" series={ch((d) => d.brake)} height={56} yMin={0} yMax={1} fmtY={(v) => (v >= 0.5 ? "ON" : "OFF")} dMax={dMax} />
            <Chart label="Gear" series={ch((d) => d.gear)} height={90} yMin={0.5} yMax={8.5} dMax={dMax} />
            <Chart label="DRS" series={ch((d) => d.drs)} height={56} yMin={0} yMax={1} fmtY={(v) => (v >= 0.5 ? "OPEN" : "—")} dMax={dMax} />
          </div>
        </>
      )}
    </div>
  )
}

function DriverSummary({ code, color, ch, alignRight }: { code: string; color: string; ch: DriverChannels; alignRight?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${alignRight ? "flex-row-reverse text-right" : ""}`}>
      <DriverAvatar code={code} slug={ch.team_slug} size={40} />
      <div>
        <p className="font-(family-name:--font-f1-regular) text-lg tracking-wider" style={{ color }}>{code}</p>
        <p className="font-(family-name:--font-orbitron) text-sm font-bold text-text-primary tabular-nums">{fmtLap(ch.lap_time)}</p>
        <p className="text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim uppercase">{ch.compound ?? "—"}</p>
      </div>
    </div>
  )
}
