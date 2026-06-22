"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { fetchStandings, type StandingsData, type DriverStanding } from "@/lib/standings"
import { teamColor } from "@/lib/design"
import DriverAvatar from "@/components/DriverAvatar"
import TeamLogo from "@/components/TeamLogo"
import CarImage from "@/components/CarImage"

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

function maxBy(rows: DriverStanding[], key: (d: DriverStanding) => number): DriverStanding | null {
  let best: DriverStanding | null = null
  for (const d of rows) if (!best || key(d) > key(best)) best = d
  return best && key(best) > 0 ? best : null
}

function Superlative({ label, d, value }: { label: string; d: DriverStanding | null; value: number | undefined }) {
  if (!d) return null
  return (
    <div className="flex items-center gap-2 px-2.5 py-2 rounded-sm border border-border-subtle bg-surface-1/40">
      <DriverAvatar code={d.code} slug={d.team_slug} size={26} />
      <div className="min-w-0">
        <p className="text-[0.5rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-dim leading-none mb-1">
          {label}
        </p>
        <p className="flex items-baseline gap-1 leading-none">
          <span className="font-(family-name:--font-f1-regular) text-xs tracking-wider" style={{ color: teamColor(d.team_slug) }}>
            {d.code}
          </span>
          <span className="font-(family-name:--font-orbitron) font-bold text-text-primary tabular-nums text-sm">
            {value}
          </span>
        </p>
      </div>
    </div>
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
      <div className="glass-card p-5 animate-pulse min-h-[260px] space-y-3">
        <div className="h-3 bg-border-subtle rounded w-1/3" />
        {[...Array(6)].map((_, i) => <div key={i} className="h-7 bg-border-subtle rounded" />)}
      </div>
    )
  }

  if (!data || data.drivers.length === 0) {
    return (
      <div className="glass-card p-5 flex flex-col items-center justify-center gap-2 min-h-[260px]">
        <p className="section-label text-text-dim">Championship</p>
        <p className="text-text-dim text-xs font-(family-name:--font-dm-mono)">Standings unavailable.</p>
      </div>
    )
  }

  const dLeader = data.drivers[0]
  const dGap = data.drivers[1]?.gap_to_leader ?? 0
  const dRunnerUp = data.drivers[1]?.code
  const cLeader = data.constructors[0]
  const cGap = data.constructors[1]?.gap_to_leader ?? 0
  const cRunnerUp = data.constructors[1]?.team

  return (
    <div className="glass-card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <p className="section-label">{data.year} Championship</p>
        <Link
          href="/standings"
          className="text-[0.6rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-f1-red hover:text-f1-red-dark transition-colors"
        >
          Full →
        </Link>
      </div>

      {/* Title fight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Drivers' leader */}
        <div
          className="flex items-center gap-3 p-3 rounded-md bg-surface-1/60"
          style={{ boxShadow: `inset 3px 0 0 ${teamColor(dLeader.team_slug)}` }}
        >
          <DriverAvatar code={dLeader.code} slug={dLeader.team_slug} size={44} />
          <div className="min-w-0 flex-1">
            <p className="text-[0.5rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-dim mb-0.5">
              Drivers&apos; Leader
            </p>
            <p className="font-(family-name:--font-orbitron) text-sm font-bold text-text-primary truncate">
              {dLeader.driver}
            </p>
            <p className="text-[0.58rem] font-(family-name:--font-dm-mono) text-text-muted">
              {dGap > 0 ? `+${dGap} over ${dRunnerUp}` : "tied lead"} · {dLeader.last3_points} pts last 3
            </p>
          </div>
          <span className="font-(family-name:--font-orbitron) text-2xl font-black text-text-primary tabular-nums shrink-0">
            {dLeader.points}
          </span>
        </div>

        {/* Constructors' leader */}
        {cLeader && (
          <div
            className="relative flex items-center gap-3 p-3 rounded-md bg-surface-1/60 overflow-hidden"
            style={{ boxShadow: `inset 3px 0 0 ${teamColor(cLeader.team_slug)}` }}
          >
            <TeamLogo slug={cLeader.team_slug} size={36} />
            <div className="min-w-0 flex-1 relative z-10">
              <p className="text-[0.5rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-dim mb-0.5">
                Constructors&apos; Leader
              </p>
              <p className="font-(family-name:--font-orbitron) text-sm font-bold text-text-primary truncate">
                {cLeader.team}
              </p>
              <p className="text-[0.58rem] font-(family-name:--font-dm-mono) text-text-muted">
                {cGap > 0 ? `+${cGap} over ${cRunnerUp}` : "tied lead"} · {cLeader.wins} wins
              </p>
            </div>
            {/* Leading team's car — faded backdrop on the right */}
            <CarImage
              slug={cLeader.team_slug}
              className="absolute right-1 bottom-0 h-14 w-auto opacity-25 pointer-events-none select-none"
            />
            <span className="relative z-10 font-(family-name:--font-orbitron) text-2xl font-black text-text-primary tabular-nums shrink-0">
              {cLeader.points}
            </span>
          </div>
        )}
      </div>

      {/* Top 5 standings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        <div>
          <p className="text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-dim mb-2">Drivers</p>
          <div className="space-y-0.5">
            {data.drivers.slice(0, 5).map((d) => (
              <div key={d.code} className="flex items-center gap-2 py-1">
                <Rank pos={d.position} />
                <DriverAvatar code={d.code} slug={d.team_slug} size={22} />
                <span className="font-(family-name:--font-f1-regular) text-sm tracking-wider" style={{ color: teamColor(d.team_slug) }}>
                  {d.code}
                </span>
                {d.wins > 0 && <span className="text-[0.5rem] font-(family-name:--font-dm-mono) text-text-dim">{d.wins}W</span>}
                <span className="ml-auto font-(family-name:--font-orbitron) font-bold text-text-primary tabular-nums text-sm">
                  {d.points}
                </span>
                <span className="w-9 text-right text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim tabular-nums">
                  {d.gap_to_leader === 0 ? "—" : `-${d.gap_to_leader}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-dim mb-2">Constructors</p>
          <div className="space-y-0.5">
            {data.constructors.slice(0, 5).map((c) => (
              <div key={c.team} className="flex items-center gap-2 py-1">
                <Rank pos={c.position} />
                <TeamLogo slug={c.team_slug} size={16} />
                <span className="font-(family-name:--font-orbitron) text-xs font-medium truncate" style={{ color: teamColor(c.team_slug) }}>
                  {c.team}
                </span>
                <span className="ml-auto font-(family-name:--font-orbitron) font-bold text-text-primary tabular-nums text-sm">
                  {c.points}
                </span>
                <span className="w-9 text-right text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim tabular-nums">
                  {c.gap_to_leader === 0 ? "—" : `-${c.gap_to_leader}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Season leaders */}
      <div>
        <p className="text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-dim mb-2">Season Leaders</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <Superlative label="Most Wins" d={maxBy(data.drivers, (d) => d.wins)} value={maxBy(data.drivers, (d) => d.wins)?.wins} />
          <Superlative label="Most Poles" d={maxBy(data.drivers, (d) => d.poles)} value={maxBy(data.drivers, (d) => d.poles)?.poles} />
          <Superlative label="Most Podiums" d={maxBy(data.drivers, (d) => d.podiums)} value={maxBy(data.drivers, (d) => d.podiums)?.podiums} />
          <Superlative label="Fastest Laps" d={maxBy(data.drivers, (d) => d.fastest_laps)} value={maxBy(data.drivers, (d) => d.fastest_laps)?.fastest_laps} />
          <Superlative label="Most DNFs" d={maxBy(data.drivers, (d) => d.dnfs)} value={maxBy(data.drivers, (d) => d.dnfs)?.dnfs} />
        </div>
      </div>
    </div>
  )
}
