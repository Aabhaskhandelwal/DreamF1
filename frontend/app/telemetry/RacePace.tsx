"use client"

import { useState } from "react"
import { TEAM_COLORS } from "@/lib/design"
import DriverAvatar from "@/components/DriverAvatar"

export interface RacePaceStint {
  stint: number | null
  compound: string
  lap_start: number
  lap_end: number
  laps: number
  median: number | null
  deg: number | null
}

export interface RacePaceDriver {
  code: string
  finish: number | null
  clean_laps: number
  median: number | null
  best: number | null
  mean: number | null
  std: number | null
  delta: number | null
  compounds: { compound: string; laps: number; median: number; best: number }[]
  stints: RacePaceStint[]
}

export interface RacePaceData {
  session: string
  fastest_median: number | null
  drivers: RacePaceDriver[]
}

function fmtLap(s: number | null): string {
  if (s == null) return "—"
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toFixed(3).padStart(6, "0")}`
}

function degColor(d: number | null): string {
  if (d == null) return "#555"
  if (d <= 0.03) return "#4ade80"
  if (d <= 0.08) return "#facc15"
  return "#ED1131"
}

const TYRE: Record<string, string> = {
  SOFT: "soft", MEDIUM: "medium", HARD: "hard",
  INTERMEDIATE: "intermediate", WET: "wet",
}
function tyreSrc(c: string): string {
  return `/assets/tyres/${TYRE[(c || "").toUpperCase()] ?? "unknown"}.svg`
}

function CompoundIcon({ c, size = 15 }: { c: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={tyreSrc(c)} alt={c} width={size} height={size}
      className="inline-block shrink-0" style={{ width: size, height: size }} />
  )
}

export default function RacePace({ data }: { data: RacePaceData }) {
  const [open, setOpen] = useState<string | null>(null)
  const ranked = data.drivers
  const maxDelta = Math.max(0.001, ...ranked.map((d) => d.delta ?? 0))

  return (
    <div className="glass-card overflow-hidden">
      {/* header */}
      <div className="flex items-baseline justify-between gap-3 px-4 py-3 border-b border-border-default flex-wrap">
        <p className="section-label">Race Pace</p>
        <p className="text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest">
          clean-air median · in/out, lap 1 &amp; SC/VSC excluded
        </p>
      </div>

      {/* column header */}
      <div
        className="hidden sm:grid items-center gap-3 px-4 py-2 border-b border-border-subtle
                   text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-muted"
        style={{ gridTemplateColumns: "2rem 5.5rem 1fr 5rem 4.5rem 3rem" }}
      >
        <span>Fin</span>
        <span>Driver</span>
        <span>Gap to fastest</span>
        <span className="text-right">Median</span>
        <span className="text-right">Δ</span>
        <span className="text-right">Laps</span>
      </div>

      {ranked.map((d) => {
        const color = TEAM_COLORS[d.code] ?? "#888"
        const isOpen = open === d.code
        const barPct = d.delta == null ? 0 : Math.max(2, (d.delta / maxDelta) * 100)
        return (
          <div key={d.code} className="border-b border-border-subtle last:border-0">
            {/* main row */}
            <button
              onClick={() => setOpen(isOpen ? null : d.code)}
              className="w-full grid items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-1/60 transition-colors cursor-pointer"
              style={{ gridTemplateColumns: "2rem 5.5rem 1fr 5rem 4.5rem 3rem", boxShadow: `inset 3px 0 0 ${color}` }}
            >
              <span className="font-(family-name:--font-orbitron) font-bold tabular-nums text-sm text-text-secondary">
                {d.finish ?? "—"}
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <DriverAvatar code={d.code} slug={undefined} size={22} />
                <span className="font-(family-name:--font-f1-regular) text-sm tracking-wider" style={{ color }}>
                  {d.code}
                </span>
              </div>
              {/* gap bar */}
              <div className="h-2.5 w-full rounded-sm bg-surface-2 overflow-hidden">
                <div className="h-full rounded-sm" style={{ width: `${barPct}%`, background: color, opacity: d.delta === 0 ? 1 : 0.55 }} />
              </div>
              <span className="text-right font-(family-name:--font-orbitron) tabular-nums text-text-primary text-sm">
                {fmtLap(d.median)}
              </span>
              <span
                className="text-right font-(family-name:--font-orbitron) tabular-nums text-xs"
                style={{ color: d.delta === 0 ? "#4ade80" : "#aaa" }}
              >
                {d.delta == null ? "—" : d.delta === 0 ? "LEAD" : `+${d.delta.toFixed(3)}`}
              </span>
              <span className="text-right font-(family-name:--font-dm-mono) text-text-dim tabular-nums text-[0.7rem]">
                {d.clean_laps}
              </span>
            </button>

            {/* expanded: stints + compounds */}
            {isOpen && (
              <div className="px-4 pb-4 pt-1 bg-surface-1/40 space-y-3">
                {/* summary chips */}
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-[0.6rem] font-(family-name:--font-dm-mono) text-text-muted pt-2">
                  <span>BEST <span className="text-text-secondary tabular-nums">{fmtLap(d.best)}</span></span>
                  <span>MEAN <span className="text-text-secondary tabular-nums">{fmtLap(d.mean)}</span></span>
                  <span>CONSISTENCY <span className="text-text-secondary tabular-nums">±{d.std?.toFixed(3) ?? "—"}s</span></span>
                </div>

                {/* per compound */}
                {d.compounds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {d.compounds.map((c) => (
                      <div key={c.compound} className="flex items-center gap-1.5 px-2 py-1 rounded-sm border border-border-muted">
                        <CompoundIcon c={c.compound} />
                        <span className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-secondary tabular-nums">
                          {fmtLap(c.median)}
                        </span>
                        <span className="text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim">{c.laps}L</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* per stint with degradation */}
                <div className="space-y-1">
                  <p className="text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-dim">
                    Stints
                  </p>
                  {d.stints.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 py-1 border-b border-border-subtle last:border-0">
                      <span className="w-5 text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim tabular-nums">{i + 1}</span>
                      <CompoundIcon c={s.compound} />
                      <span className="text-[0.62rem] font-(family-name:--font-dm-mono) text-text-muted w-24 tabular-nums">
                        L{s.lap_start}–{s.lap_end} · {s.laps}
                      </span>
                      <span className="text-[0.62rem] font-(family-name:--font-orbitron) text-text-secondary tabular-nums w-16">
                        {fmtLap(s.median)}
                      </span>
                      <span className="text-[0.6rem] font-(family-name:--font-dm-mono) tabular-nums ml-auto" style={{ color: degColor(s.deg) }}>
                        {s.deg == null ? "—" : `${s.deg > 0 ? "+" : ""}${s.deg.toFixed(3)}s/lap`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
