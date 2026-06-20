"use client"

import { useEffect, useState } from "react"
import { TEAM_COLORS } from "@/lib/design"

interface CircuitHistoryData {
  year: number
  event_name: string | null
  winner: string | null
  winner_team: string | null
  pole: string | null
  fastest_lap_driver: string | null
  fastest_lap_time: string | null
  safety_car: boolean
  dnf_count: number
  total_laps: number | null
  _error?: string
}

function DriverBadge({ code }: { code: string | null }) {
  const color = code ? (TEAM_COLORS[code] ?? "#666") : "#333"
  return (
    <span
      className="font-(family-name:--font-f1-regular) text-xs tracking-wider px-1.5 py-0.5"
      style={{
        color: code ? color : "#444",
        backgroundColor: code ? `${color}18` : "transparent",
        border: `1px solid ${code ? `${color}33` : "#222"}`,
      }}
    >
      {code ?? "—"}
    </span>
  )
}

export default function CircuitHistory({ year, roundNum }: { year: number; roundNum: number }) {
  const [data, setData] = useState<CircuitHistoryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/circuit_history/${year}/${roundNum}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [year, roundNum])

  if (loading) {
    return (
      <div className="glass-card h-full p-5 space-y-3 animate-pulse min-h-[220px]">
        <div className="h-2.5 bg-border-subtle rounded w-1/2 mb-4" />
        <div className="h-4 bg-border-subtle rounded w-3/4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-border-subtle">
            <div className="h-2 bg-border-subtle rounded w-1/3" />
            <div className="h-5 bg-border-subtle rounded w-12" />
          </div>
        ))}
      </div>
    )
  }

  if (!data || data._error) {
    return (
      <div className="glass-card h-full p-5 flex flex-col justify-center items-center gap-2 min-h-[220px]">
        <p className="section-label text-text-dim">Last Year</p>
        <p className="text-text-dim text-xs font-(family-name:--font-dm-mono) text-center leading-relaxed">
          No historical data available for this circuit.
        </p>
      </div>
    )
  }

  const rows = [
    {
      label: "Winner",
      content: <DriverBadge code={data.winner} />,
    },
    {
      label: "Pole",
      content: <DriverBadge code={data.pole} />,
    },
    {
      label: "Fastest Lap",
      content: (
        <span className="flex items-center gap-2">
          <DriverBadge code={data.fastest_lap_driver} />
          {data.fastest_lap_time && (
            <span className="text-[0.58rem] font-(family-name:--font-dm-mono) text-text-dim tabular-nums">
              {data.fastest_lap_time}
            </span>
          )}
        </span>
      ),
    },
    {
      label: "Safety Car",
      content: (
        <span
          className={`text-[0.65rem] font-(family-name:--font-dm-mono) ${
            data.safety_car ? "text-f1-red" : "text-text-muted"
          }`}
        >
          {data.safety_car ? "Deployed" : "None"}
        </span>
      ),
    },
    {
      label: "DNFs",
      content: (
        <span className="text-[0.65rem] font-(family-name:--font-dm-mono) text-text-muted tabular-nums">
          {data.dnf_count}
        </span>
      ),
    },
  ]

  return (
    <div className="glass-card h-full p-5 flex flex-col gap-4">
      <div>
        <p className="section-label text-text-dim mb-1.5">{data.year} · Same Circuit</p>
        <p className="font-(family-name:--font-orbitron) text-sm font-bold text-text-primary leading-snug line-clamp-2">
          {data.event_name ?? "—"}
        </p>
      </div>

      <div className="flex-1">
        {rows.map(({ label, content }) => (
          <div
            key={label}
            className="flex items-center justify-between py-2.5 border-b border-border-subtle last:border-0"
          >
            <span className="text-[0.57rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest shrink-0">
              {label}
            </span>
            {content}
          </div>
        ))}
      </div>

      {data.total_laps && (
        <p className="text-[0.52rem] font-(family-name:--font-dm-mono) text-text-dim">
          {data.total_laps} laps completed
        </p>
      )}
    </div>
  )
}
