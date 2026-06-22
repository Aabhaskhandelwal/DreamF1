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
const H = 240
const PAD = { l: 38, r: 14, t: 14, b: 26 }

function scaleX(t: number, xMin: number, xMax: number) {
  return PAD.l + ((t - xMin) / (xMax - xMin || 1)) * (W - PAD.l - PAD.r)
}
function scaleY(v: number, yMin: number, yMax: number) {
  return H - PAD.b - ((v - yMin) / (yMax - yMin || 1)) * (H - PAD.t - PAD.b)
}

function linePath(
  time: number[],
  vals: (number | null)[] | null,
  yMin: number,
  yMax: number,
  xMin: number,
  xMax: number,
): string {
  if (!vals) return ""
  let d = ""
  let started = false
  for (let i = 0; i < time.length; i++) {
    const v = vals[i]
    if (v == null) {
      started = false
      continue
    }
    d += `${started ? "L" : "M"}${scaleX(time[i], xMin, xMax).toFixed(1)},${scaleY(v, yMin, yMax).toFixed(1)} `
    started = true
  }
  return d.trim()
}

/** Closed area path (line + baseline) for a soft gradient fill. */
function areaPath(
  time: number[],
  vals: (number | null)[] | null,
  yMin: number,
  yMax: number,
  xMin: number,
  xMax: number,
): string {
  const line = linePath(time, vals, yMin, yMax, xMin, xMax)
  if (!line) return ""
  const first = line.match(/M([\d.]+),/)
  const lastX = [...line.matchAll(/[ML]([\d.]+),/g)].pop()
  if (!first || !lastX) return ""
  const base = (H - PAD.b).toFixed(1)
  return `${line} L${lastX[1]},${base} L${first[1]},${base} Z`
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: string
}) {
  return (
    <div className="glass-card p-3 sm:p-4 flex flex-col gap-1" style={{ boxShadow: accent ? `inset 2px 0 0 ${accent}` : undefined }}>
      <span className="text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-muted">
        {label}
      </span>
      <span
        className="font-(family-name:--font-orbitron) text-xl font-bold tabular-nums leading-none"
        style={{ color: accent ?? "var(--color-text-primary)" }}
      >
        {value}
      </span>
      {sub && <span className="text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim">{sub}</span>}
    </div>
  )
}

/** Compact single-series sparkline card (humidity, wind). */
function Sparkline({
  label,
  unit,
  vals,
  time,
  color,
  avg,
  peak,
}: {
  label: string
  unit: string
  vals: (number | null)[] | null
  time: number[]
  color: string
  avg: number | null
  peak?: number | null
}) {
  const nums = (vals ?? []).filter((v): v is number => v != null)
  const sw = 320
  const sh = 64
  const sp = { l: 2, r: 2, t: 6, b: 6 }
  const yMin = nums.length ? Math.min(...nums) : 0
  const yMax = nums.length ? Math.max(...nums) : 1
  const xMin = time[0] ?? 0
  const xMax = time[time.length - 1] ?? 1
  const sx = (t: number) => sp.l + ((t - xMin) / (xMax - xMin || 1)) * (sw - sp.l - sp.r)
  const sy = (v: number) => sh - sp.b - ((v - yMin) / (yMax - yMin || 1)) * (sh - sp.t - sp.b)
  let d = ""
  let started = false
  if (vals) {
    for (let i = 0; i < time.length; i++) {
      const v = vals[i]
      if (v == null) {
        started = false
        continue
      }
      d += `${started ? "L" : "M"}${sx(time[i]).toFixed(1)},${sy(v).toFixed(1)} `
      started = true
    }
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-baseline justify-between mb-2">
        <span className="section-label">{label}</span>
        <span className="font-(family-name:--font-orbitron) text-sm font-bold tabular-nums" style={{ color }}>
          {avg != null ? `${avg}${unit}` : "—"}
          {peak != null && (
            <span className="ml-1.5 text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim">
              max {peak}{unit}
            </span>
          )}
        </span>
      </div>
      <svg viewBox={`0 0 ${sw} ${sh}`} className="w-full" style={{ height: "auto" }}>
        <line x1={sp.l} y1={sh - sp.b} x2={sw - sp.r} y2={sh - sp.b} stroke="#1a1a1a" strokeWidth={1} />
        <path d={d.trim()} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export default function Weather({ data }: { data: WeatherData }) {
  const s = data.summary
  const temps = [...(data.track_temp ?? []), ...(data.air_temp ?? [])].filter(
    (v): v is number => v != null,
  )
  const yMin = temps.length ? Math.floor(Math.min(...temps) - 1) : 0
  const yMax = temps.length ? Math.ceil(Math.max(...temps) + 1) : 50
  const xMin = data.time[0] ?? 0
  const xMax = data.time[data.time.length - 1] ?? 1

  const yTicks = [yMin, Math.round((yMin + yMax) / 2), yMax]

  return (
    <div className="space-y-5">
      {/* ── Conditions hero ──────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-lg border border-border-default p-4 sm:p-5"
        style={{
          background: s.rained
            ? "linear-gradient(110deg, #0c1726 0%, #0a0a0a 55%)"
            : "linear-gradient(110deg, #1a1206 0%, #0a0a0a 55%)",
        }}
      >
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden>
              {s.rained ? "🌧️" : "☀️"}
            </span>
            <div>
              <p className="section-label leading-none mb-1">Conditions</p>
              <p
                className="font-(family-name:--font-orbitron) text-2xl font-bold leading-none"
                style={{ color: s.rained ? "#4781D7" : "#F47600" }}
              >
                {s.rained ? "WET" : "DRY"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <HeroStat label="Track" value={s.track_temp_avg != null ? `${s.track_temp_avg}°` : "—"} color="#F47600" />
            <HeroStat label="Air" value={s.air_temp_avg != null ? `${s.air_temp_avg}°` : "—"} color="#4781D7" />
            <HeroStat label="Humidity" value={s.humidity_avg != null ? `${s.humidity_avg}%` : "—"} color="#00D7B6" />
            <HeroStat label="Wind" value={s.wind_avg != null ? `${s.wind_avg} m/s` : "—"} color="#c084fc" />
          </div>
        </div>
      </div>

      {/* ── Detailed tiles ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <Stat
          label="Track Temp"
          value={s.track_temp_avg != null ? `${s.track_temp_avg}°` : "—"}
          sub={s.track_temp_min != null ? `${s.track_temp_min}° – ${s.track_temp_max}°` : undefined}
          accent="#F47600"
        />
        <Stat
          label="Air Temp"
          value={s.air_temp_avg != null ? `${s.air_temp_avg}°` : "—"}
          sub={s.air_temp_min != null ? `${s.air_temp_min}° – ${s.air_temp_max}°` : undefined}
          accent="#4781D7"
        />
        <Stat
          label="Humidity"
          value={s.humidity_avg != null ? `${s.humidity_avg}%` : "—"}
          accent="#00D7B6"
        />
        <Stat
          label="Wind"
          value={s.wind_avg != null ? `${s.wind_avg} m/s` : "—"}
          sub={s.wind_max != null ? `gusts to ${s.wind_max} m/s` : undefined}
          accent="#c084fc"
        />
      </div>

      {/* ── Temperature chart ────────────────────────────────── */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="section-label">Track vs Air Temperature</p>
          <div className="flex items-center gap-4 text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 inline-block" style={{ background: "#F47600" }} /> Track
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 inline-block" style={{ background: "#4781D7" }} /> Air
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[36rem]" style={{ height: "auto" }}>
            <defs>
              <linearGradient id="trackFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F47600" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#F47600" stopOpacity="0" />
              </linearGradient>
            </defs>
            {yTicks.map((v) => (
              <g key={v}>
                <line x1={PAD.l} y1={scaleY(v, yMin, yMax)} x2={W - PAD.r} y2={scaleY(v, yMin, yMax)} stroke="#1a1a1a" strokeWidth={1} />
                <text x={PAD.l - 6} y={scaleY(v, yMin, yMax) + 3} textAnchor="end" fill="#666" fontSize={10} fontFamily="monospace">
                  {v}°
                </text>
              </g>
            ))}
            <text x={PAD.l} y={H - 7} fill="#666" fontSize={10} fontFamily="monospace">0 min</text>
            <text x={W - PAD.r} y={H - 7} textAnchor="end" fill="#666" fontSize={10} fontFamily="monospace">
              {Math.round(xMax)} min
            </text>
            <path d={areaPath(data.time, data.track_temp, yMin, yMax, xMin, xMax)} fill="url(#trackFill)" />
            <path d={linePath(data.time, data.track_temp, yMin, yMax, xMin, xMax)} fill="none" stroke="#F47600" strokeWidth={1.9} strokeLinejoin="round" />
            <path d={linePath(data.time, data.air_temp, yMin, yMax, xMin, xMax)} fill="none" stroke="#4781D7" strokeWidth={1.9} strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* ── Humidity + wind sparklines ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Sparkline label="Humidity · race" unit="%" vals={data.humidity} time={data.time} color="#00D7B6" avg={s.humidity_avg} />
        <Sparkline label="Wind speed · race" unit=" m/s" vals={data.wind_speed} time={data.time} color="#c084fc" avg={s.wind_avg} peak={s.wind_max} />
      </div>
    </div>
  )
}

function HeroStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p className="text-[0.5rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-muted leading-none mb-1">
        {label}
      </p>
      <p className="font-(family-name:--font-orbitron) text-base font-bold tabular-nums leading-none" style={{ color }}>
        {value}
      </p>
    </div>
  )
}
