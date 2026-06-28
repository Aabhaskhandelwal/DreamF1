"use client"

import { useEffect, useState } from "react"
import { fetchStandings, type DriverStanding } from "@/lib/standings"
import { teamColor } from "@/lib/design"
import DriverAvatar from "@/components/DriverAvatar"

const RANK_COLOR: Record<number, string> = { 1: "#ffd700", 2: "#c0c0c0", 3: "#cd7f32" }
const COLS = "2rem minmax(7rem,1fr) 2.75rem 2rem 2.25rem 2.25rem 2rem 2.5rem 3.25rem"

function H({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <span title={title} className="text-[0.5rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-muted text-right">
      {children}
    </span>
  )
}

function N({ value, dim }: { value: string | number; dim?: boolean }) {
  return (
    <span className={`text-right font-(family-name:--font-orbitron) tabular-nums text-xs ${dim ? "text-text-dim" : "text-text-secondary"}`}>
      {value}
    </span>
  )
}

/**
 * Season form reference for the Predict page — pulls the same /api/standings
 * aggregates the Standings page uses, so picks can be made on real data.
 */
export default function FormGuide() {
  const [rows, setRows] = useState<DriverStanding[] | null>(null)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    fetchStandings(2026).then((d) => setRows(d?.drivers ?? []))
  }, [])

  if (rows && rows.length === 0) return null
  const maxForm = rows ? Math.max(1, ...rows.map((d) => d.last3_points)) : 1

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-surface-1/40 transition-colors"
      >
        <div className="flex items-baseline gap-2">
          <span className="section-label">Form Guide</span>
          <span className="text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim">2026 season · pick smart</span>
        </div>
        <span className="text-[0.6rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-f1-red">
          {open ? "Hide ▲" : "Show ▼"}
        </span>
      </button>

      {open && (
        <div className="border-t border-border-default">
          {!rows ? (
            <div className="p-5 space-y-2 animate-pulse">
              {[...Array(6)].map((_, i) => <div key={i} className="h-6 bg-border-subtle rounded" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[34rem]">
                <div className="grid items-center gap-2 px-3 py-2 border-b border-border-subtle" style={{ gridTemplateColumns: COLS }}>
                  <H>#</H>
                  <span className="text-[0.5rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-muted">Driver</span>
                  <H title="Championship points">Pts</H>
                  <H title="Wins">W</H>
                  <H title="Podiums">Pod</H>
                  <H title="Poles">Pole</H>
                  <H title="DNFs">DNF</H>
                  <H title="Average finish">Avg</H>
                  <H title="Points in last 3 races">Form</H>
                </div>

                {rows.map((d) => {
                  const color = teamColor(d.team_slug)
                  return (
                    <div
                      key={d.code || d.position}
                      className="grid items-center gap-2 px-3 py-1.5 border-b border-border-subtle last:border-0 hover:bg-surface-1/50 transition-colors"
                      style={{ gridTemplateColumns: COLS, boxShadow: `inset 3px 0 0 ${color}` }}
                    >
                      <span className="font-(family-name:--font-orbitron) font-bold tabular-nums text-xs" style={{ color: RANK_COLOR[d.position] ?? "#777" }}>
                        {d.position}
                      </span>
                      <div className="flex items-center gap-2 min-w-0">
                        <DriverAvatar code={d.code} slug={d.team_slug} size={20} />
                        <span className="font-(family-name:--font-f1-regular) text-xs tracking-wider" style={{ color }}>{d.code}</span>
                      </div>
                      <span className="text-right font-(family-name:--font-orbitron) font-bold text-text-primary tabular-nums text-xs">{d.points}</span>
                      <N value={d.wins} dim={!d.wins} />
                      <N value={d.podiums} dim={!d.podiums} />
                      <N value={d.poles} dim={!d.poles} />
                      <span className={`text-right font-(family-name:--font-orbitron) tabular-nums text-xs ${d.dnfs ? "text-f1-red" : "text-text-dim"}`}>
                        {d.dnfs}
                      </span>
                      <N value={d.avg_finish ?? "—"} dim={d.avg_finish === null} />
                      {/* Form: last-3 points as a mini bar + value */}
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="hidden sm:block h-1 rounded-full bg-surface-3 overflow-hidden" style={{ width: 24 }}>
                          <span className="block h-full rounded-full" style={{ width: `${(d.last3_points / maxForm) * 100}%`, background: color }} />
                        </span>
                        <span className="font-(family-name:--font-orbitron) tabular-nums text-xs text-text-secondary w-5 text-right">{d.last3_points}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
