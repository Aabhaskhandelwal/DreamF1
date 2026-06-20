"use client"

export interface WeatherData {
  session: string
  time: number[]
  track_temp: (number | null)[] | null
  air_temp: (number | null)[] | null
  humidity: (number | null)[] | null
  wind_speed: (number | null)[] | null
  summary: {
    track_temp_min: number | null
    track_temp_max: number | null
    track_temp_avg: number | null
    air_temp_min: number | null
    air_temp_max: number | null
    air_temp_avg: number | null
    humidity_avg: number | null
    wind_avg: number | null
    wind_max: number | null
    rained: boolean
  }
}

const W = 900
const H = 260
const PAD = { l: 40, r: 16, t: 16, b: 28 }

function linePath(time: number[], vals: (number | null)[] | null, yMin: number, yMax: number, xMin: number, xMax: number): string {
  if (!vals) return ""
  const xs = (t: number) => PAD.l + ((t - xMin) / (xMax - xMin || 1)) * (W - PAD.l - PAD.r)
  const ys = (v: number) => H - PAD.b - ((v - yMin) / (yMax - yMin || 1)) * (H - PAD.t - PAD.b)
  let d = ""
  let started = false
  for (let i = 0; i < time.length; i++) {
    const v = vals[i]
    if (v == null) { started = false; continue }
    d += `${started ? "L" : "M"}${xs(time[i]).toFixed(1)},${ys(v).toFixed(1)} `
    started = true
  }
  return d.trim()
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="glass-card p-3 sm:p-4 flex flex-col gap-1">
      <span className="text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-muted">{label}</span>
      <span className="font-(family-name:--font-orbitron) text-xl font-bold tabular-nums" style={{ color: accent ?? "var(--color-text-primary)" }}>
        {value}
      </span>
      {sub && <span className="text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim">{sub}</span>}
    </div>
  )
}

export default function Weather({ data }: { data: WeatherData }) {
  const s = data.summary
  const temps = [
    ...(data.track_temp ?? []),
    ...(data.air_temp ?? []),
  ].filter((v): v is number => v != null)
  const yMin = temps.length ? Math.floor(Math.min(...temps) - 1) : 0
  const yMax = temps.length ? Math.ceil(Math.max(...temps) + 1) : 50
  const xMin = data.time[0] ?? 0
  const xMax = data.time[data.time.length - 1] ?? 1

  const yTicks = [yMin, Math.round((yMin + yMax) / 2), yMax]
  const yPos = (v: number) => H - PAD.b - ((v - yMin) / (yMax - yMin || 1)) * (H - PAD.t - PAD.b)

  return (
    <div className="space-y-5">
      {/* summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <Stat label="Track Temp" value={s.track_temp_max != null ? `${s.track_temp_max}°` : "—"}
          sub={s.track_temp_min != null ? `${s.track_temp_min}–${s.track_temp_max}° · avg ${s.track_temp_avg}°` : undefined} accent="#F47600" />
        <Stat label="Air Temp" value={s.air_temp_avg != null ? `${s.air_temp_avg}°` : "—"}
          sub={s.air_temp_min != null ? `${s.air_temp_min}–${s.air_temp_max}°` : undefined} accent="#4781D7" />
        <Stat label="Humidity" value={s.humidity_avg != null ? `${s.humidity_avg}%` : "—"} />
        <Stat label="Wind" value={s.wind_avg != null ? `${s.wind_avg} m/s` : "—"} sub={s.wind_max != null ? `max ${s.wind_max}` : undefined} />
        <Stat label="Rainfall" value={s.rained ? "Wet" : "Dry"} accent={s.rained ? "#4781D7" : "#4ade80"} />
      </div>

      {/* temp chart */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="section-label">Temperature · race</p>
          <div className="flex items-center gap-4 text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 inline-block" style={{ background: "#F47600" }} /> Track</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 inline-block" style={{ background: "#4781D7" }} /> Air</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[36rem]" style={{ height: "auto" }}>
            {yTicks.map((v) => (
              <g key={v}>
                <line x1={PAD.l} y1={yPos(v)} x2={W - PAD.r} y2={yPos(v)} stroke="#1e1e1e" strokeWidth={1} />
                <text x={PAD.l - 6} y={yPos(v) + 3} textAnchor="end" fill="#666" fontSize={10} fontFamily="monospace">{v}°</text>
              </g>
            ))}
            <text x={PAD.l} y={H - 8} fill="#666" fontSize={10} fontFamily="monospace">0 min</text>
            <text x={W - PAD.r} y={H - 8} textAnchor="end" fill="#666" fontSize={10} fontFamily="monospace">{Math.round(xMax)} min</text>
            <path d={linePath(data.time, data.track_temp, yMin, yMax, xMin, xMax)} fill="none" stroke="#F47600" strokeWidth={1.75} />
            <path d={linePath(data.time, data.air_temp, yMin, yMax, xMin, xMax)} fill="none" stroke="#4781D7" strokeWidth={1.75} />
          </svg>
        </div>
      </div>
    </div>
  )
}
