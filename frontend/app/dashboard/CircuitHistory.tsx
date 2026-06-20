"use client"

import { useEffect, useState } from "react"
import { TEAM_COLORS } from "@/lib/design"
import DriverAvatar from "@/components/DriverAvatar"

interface PodiumEntry {
  position: number
  code: string
  team_slug: string
}

interface Weather {
  air_temp: number | null
  track_temp: number | null
  track_temp_max: number | null
  humidity: number | null
  wind_speed: number | null
  rain: boolean
}

interface CircuitHistoryData {
  year: number
  event_name: string | null
  winner: string | null
  winner_team: string | null
  winner_team_slug: string | null
  podium: PodiumEntry[]
  pole: string | null
  fastest_lap_driver: string | null
  fastest_lap_time: string | null
  safety_car: boolean
  dnf_count: number
  total_laps: number | null
  weather: Weather | null
  _error?: string
}

const MEDAL: Record<number, string> = { 1: "#ffd700", 2: "#c0c0c0", 3: "#cd7f32" }

function DriverBadge({ code }: { code: string | null }) {
  const color = code ? TEAM_COLORS[code] ?? "#666" : "#333"
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

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
      <span className="text-[0.57rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest shrink-0">
        {label}
      </span>
      {children}
    </div>
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
        <p className="section-label text-text-dim">Last Race</p>
        <p className="text-text-dim text-xs font-(family-name:--font-dm-mono) text-center leading-relaxed">
          Race result not available yet.
        </p>
      </div>
    )
  }

  const podium = data.podium ?? []
  const w = data.weather

  return (
    <div className="glass-card h-full p-5 flex flex-col gap-4">
      <div>
        <p className="section-label text-f1-red mb-1.5">Last Race · {data.year}</p>
        <p className="font-(family-name:--font-orbitron) text-sm font-bold text-text-primary leading-snug line-clamp-2">
          {data.event_name ?? "—"}
        </p>
      </div>

      {/* Podium */}
      {podium.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-dim">
            Podium
          </p>
          {podium.map((p) => {
            const color = TEAM_COLORS[p.code] ?? "#888"
            return (
              <div
                key={p.code}
                className="flex items-center gap-2.5 py-1 px-2 rounded-sm"
                style={{ background: `${color}0d`, boxShadow: `inset 2px 0 0 ${MEDAL[p.position] ?? color}` }}
              >
                <span
                  className="font-(family-name:--font-orbitron) font-bold text-xs w-3 shrink-0"
                  style={{ color: MEDAL[p.position] ?? "#888" }}
                >
                  {p.position}
                </span>
                <DriverAvatar code={p.code} slug={p.team_slug} size={24} />
                <span className="font-(family-name:--font-f1-regular) text-sm tracking-wider" style={{ color }}>
                  {p.code}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Stats */}
      <div>
        <Stat label="Pole">
          <DriverBadge code={data.pole} />
        </Stat>
        <Stat label="Fastest Lap">
          <span className="flex items-center gap-2">
            <DriverBadge code={data.fastest_lap_driver} />
            {data.fastest_lap_time && (
              <span className="text-[0.58rem] font-(family-name:--font-dm-mono) text-text-dim tabular-nums">
                {data.fastest_lap_time}
              </span>
            )}
          </span>
        </Stat>
        <Stat label="Safety Car">
          <span className={`text-[0.65rem] font-(family-name:--font-dm-mono) ${data.safety_car ? "text-f1-red" : "text-text-muted"}`}>
            {data.safety_car ? "Deployed" : "None"}
          </span>
        </Stat>
        <Stat label="DNFs">
          <span className="text-[0.65rem] font-(family-name:--font-dm-mono) text-text-muted tabular-nums">
            {data.dnf_count}
          </span>
        </Stat>
      </div>

      {/* Weather */}
      {w && (
        <div className="border-t border-border-subtle pt-3">
          <p className="text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-dim mb-2">
            Conditions
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {w.track_temp != null && (
              <WeatherStat label="Track" value={`${w.track_temp}°${w.track_temp_max ? ` · ${w.track_temp_max}°max` : ""}`} />
            )}
            {w.air_temp != null && <WeatherStat label="Air" value={`${w.air_temp}°C`} />}
            {w.humidity != null && <WeatherStat label="Humidity" value={`${w.humidity}%`} />}
            {w.wind_speed != null && <WeatherStat label="Wind" value={`${w.wind_speed} m/s`} />}
            <WeatherStat label="Rain" value={w.rain ? "Yes" : "Dry"} accent={w.rain ? "#4781D7" : undefined} />
          </div>
        </div>
      )}

      {data.total_laps && (
        <p className="text-[0.52rem] font-(family-name:--font-dm-mono) text-text-dim">
          {data.total_laps} laps · winner {data.winner ?? "—"}
        </p>
      )}
    </div>
  )
}

function WeatherStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-wider">
        {label}
      </span>
      <span
        className="text-[0.62rem] font-(family-name:--font-dm-mono) tabular-nums"
        style={{ color: accent ?? "var(--color-text-secondary)" }}
      >
        {value}
      </span>
    </div>
  )
}
