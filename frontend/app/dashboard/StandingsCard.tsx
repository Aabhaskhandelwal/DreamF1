"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { fetchStandings, type StandingsData } from "@/lib/standings"
import { teamColor } from "@/lib/design"
import DriverAvatar from "@/components/DriverAvatar"
import TeamLogo from "@/components/TeamLogo"

const RANK_COLOR: Record<number, string> = { 1: "#ffd700", 2: "#c0c0c0", 3: "#cd7f32" }

function Rank({ pos }: { pos: number }) {
  return (
    <span
      className="font-(family-name:--font-orbitron) font-bold tabular-nums text-xs w-4 shrink-0 text-center"
      style={{ color: RANK_COLOR[pos] ?? "#777" }}
    >
      {pos}
    </span>
  )
}

export default function StandingsCard() {
  const [data, setData] = useState<StandingsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStandings(2026)
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="glass-card p-5 animate-pulse min-h-[240px] space-y-3">
        <div className="h-3 bg-border-subtle rounded w-1/3" />
        {[...Array(5)].map((_, i) => <div key={i} className="h-7 bg-border-subtle rounded" />)}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="glass-card p-5 flex flex-col items-center justify-center gap-2 min-h-[240px]">
        <p className="section-label text-text-dim">Championship</p>
        <p className="text-text-dim text-xs font-(family-name:--font-dm-mono)">Standings unavailable.</p>
      </div>
    )
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="section-label">{data.year} Championship</p>
        <Link
          href="/standings"
          className="text-[0.6rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-f1-red hover:text-f1-red-dark transition-colors"
        >
          Full →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        {/* Drivers */}
        <div>
          <p className="text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-dim mb-2">
            Drivers
          </p>
          <div className="space-y-0.5">
            {data.drivers.slice(0, 5).map((d) => {
              const color = teamColor(d.team_slug)
              return (
                <div key={d.code} className="flex items-center gap-2 py-1">
                  <Rank pos={d.position} />
                  <DriverAvatar code={d.code} slug={d.team_slug} size={22} />
                  <span className="font-(family-name:--font-f1-regular) text-sm tracking-wider" style={{ color }}>
                    {d.code}
                  </span>
                  {d.wins > 0 && (
                    <span className="text-[0.5rem] font-(family-name:--font-dm-mono) text-text-dim">
                      {d.wins}W
                    </span>
                  )}
                  <span className="ml-auto font-(family-name:--font-orbitron) font-bold text-text-primary tabular-nums text-sm">
                    {d.points}
                  </span>
                  <span className="w-9 text-right text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim tabular-nums">
                    {d.gap_to_leader === 0 ? "—" : `-${d.gap_to_leader}`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Constructors */}
        <div>
          <p className="text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-dim mb-2">
            Constructors
          </p>
          <div className="space-y-0.5">
            {data.constructors.slice(0, 5).map((c) => {
              const color = teamColor(c.team_slug)
              return (
                <div key={c.team} className="flex items-center gap-2 py-1">
                  <Rank pos={c.position} />
                  <TeamLogo slug={c.team_slug} size={16} />
                  <span className="font-(family-name:--font-orbitron) text-xs font-medium truncate" style={{ color }}>
                    {c.team}
                  </span>
                  <span className="ml-auto font-(family-name:--font-orbitron) font-bold text-text-primary tabular-nums text-sm">
                    {c.points}
                  </span>
                  <span className="w-9 text-right text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim tabular-nums">
                    {c.gap_to_leader === 0 ? "—" : `-${c.gap_to_leader}`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
