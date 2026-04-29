"use client"

import { useState, useRef, useCallback } from "react"
import { TEAM_COLORS } from "@/lib/design"

export interface LapTimesData {
  session: string
  drivers: Record<string, {
    lap_numbers: number[]
    lap_times: (number | null)[]
    compound: string[]
  }>
}

const W = 1000
const H = 340
const PAD = { top: 14, right: 64, bottom: 38, left: 54 }

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: "#E8002D",
  MEDIUM: "#FFF200",
  HARD: "#DCDCDC",
  INTERMEDIATE: "#39B54A",
  INTER: "#39B54A",
  WET: "#0067FF",
}

function lerp(val: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  if (inMax === inMin) return outMin
  return outMin + ((val - inMin) / (inMax - inMin)) * (outMax - outMin)
}

function closestIdx(arr: number[], target: number): number {
  let best = 0, bestDiff = Math.abs(arr[0] - target)
  for (let i = 1; i < arr.length; i++) {
    const d = Math.abs(arr[i] - target)
    if (d < bestDiff) { bestDiff = d; best = i }
  }
  return best
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60)
  const rem = (s % 60).toFixed(3).padStart(6, "0")
  return `${m}:${rem}`
}

export default function LapTimesChart({ data }: { data: LapTimesData }) {
  const codes = Object.keys(data.drivers)
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [tooltip, setTooltip] = useState<{
    x: number; lap: number; entries: { code: string; time: number; compound: string }[]
  } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const toggle = (code: string) =>
    setHidden((prev) => { const n = new Set(prev); n.has(code) ? n.delete(code) : n.add(code); return n })

  const cL = PAD.left, cR = W - PAD.right, cT = PAD.top, cB = H - PAD.bottom

  // Collect all valid (lap, time) pairs across visible drivers for axis range
  const allValid = codes.flatMap((c) =>
    data.drivers[c].lap_numbers
      .map((l, i) => ({ l, t: data.drivers[c].lap_times[i] }))
      .filter((x): x is { l: number; t: number } => x.t !== null)
  )
  const allLaps = codes.flatMap((c) => data.drivers[c].lap_numbers)
  const minLap = Math.min(...allLaps), maxLap = Math.max(...allLaps)
  const allTimes = allValid.map((x) => x.t)
  const minTime = Math.min(...allTimes) - 0.3
  const maxTime = Math.max(...allTimes) + 0.3

  const toX = (lap: number) => lerp(lap, minLap, maxLap, cL, cR)
  const toY = (t: number) => lerp(t, minTime, maxTime, cT, cB)

  const handleMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const vx = ((e.clientX - rect.left) / rect.width) * W
    if (vx < cL || vx > cR) { setTooltip(null); return }

    const lapF = lerp(vx, cL, cR, minLap, maxLap)
    const lap = Math.max(minLap, Math.min(maxLap, Math.round(lapF)))

    const entries: { code: string; time: number; compound: string }[] = []
    for (const code of codes) {
      if (hidden.has(code)) continue
      const { lap_numbers, lap_times, compound } = data.drivers[code]
      if (!lap_numbers.length) continue
      const i = closestIdx(lap_numbers, lap)
      const t = lap_times[i]
      if (t !== null && Math.abs(lap_numbers[i] - lap) <= 2)
        entries.push({ code, time: t, compound: compound[i] ?? "UNKNOWN" })
    }
    entries.sort((a, b) => a.time - b.time)
    setTooltip({ x: toX(lap), lap, entries })
  }, [codes, hidden, data, minLap, maxLap, cL, cR])

  // Y-axis gridlines: every ~0.5s, capped to 8 lines
  const timeTick = (maxTime - minTime) > 3 ? 1 : 0.5
  const timeTicks: number[] = []
  for (let t = Math.ceil(minTime / timeTick) * timeTick; t <= maxTime; t += timeTick)
    timeTicks.push(parseFloat(t.toFixed(3)))

  const lapTicks: number[] = []
  for (let l = Math.ceil(minLap / 10) * 10; l <= maxLap; l += 10) lapTicks.push(l)

  return (
    <div className="glass-card p-4 space-y-3">
      {/* Compound legend */}
      <div className="flex items-center gap-4 pb-2 border-b border-[#1e1e1e] flex-wrap">
        {Object.entries(COMPOUND_COLORS).filter(([k]) => k !== "INTER").map(([c, color]) => (
          <span key={c} className="flex items-center gap-1.5 text-[0.6rem] font-(family-name:--font-dm-mono) text-text-muted uppercase">
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            {c}
          </span>
        ))}
      </div>

      {/* Driver toggles */}
      <div className="flex flex-wrap gap-2">
        {codes.map((code) => {
          const color = TEAM_COLORS[code] ?? "#666"
          const on = !hidden.has(code)
          return (
            <button
              key={code}
              onClick={() => toggle(code)}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-[0.6rem] font-(family-name:--font-dm-mono) uppercase tracking-wider transition-all cursor-pointer border"
              style={{
                opacity: on ? 1 : 0.25,
                backgroundColor: on ? `${color}1a` : "transparent",
                color: on ? color : "#444",
                borderColor: on ? `${color}44` : "#222",
              }}
            >
              <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: on ? color : "#444" }} />
              {code}
            </button>
          )
        })}
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          className="block cursor-crosshair select-none"
          onMouseMove={handleMove}
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Time grid */}
          {timeTicks.map((t) => {
            const y = toY(t)
            return (
              <g key={t}>
                <line x1={cL} y1={y} x2={cR} y2={y} stroke="#1a1a1a" strokeWidth={1} />
                <text x={cL - 6} y={y + 4} fontSize={11} fill="#444" textAnchor="end" fontFamily="var(--font-dm-mono)">
                  {fmtTime(t)}
                </text>
              </g>
            )
          })}

          {/* Lap ticks */}
          {lapTicks.map((lap) => {
            const x = toX(lap)
            return (
              <g key={lap}>
                <line x1={x} y1={cT} x2={x} y2={cB} stroke="#111" strokeWidth={1} />
                <text x={x} y={H - 10} fontSize={11} fill="#444" textAnchor="middle" fontFamily="var(--font-dm-mono)">{lap}</text>
              </g>
            )
          })}

          <text x={(cL + cR) / 2} y={H - 2} fontSize={11} fill="#333" textAnchor="middle" fontFamily="var(--font-dm-mono)">LAP</text>

          {/* Lines + compound dots per driver */}
          {codes.filter((c) => !hidden.has(c)).map((code) => {
            const { lap_numbers, lap_times, compound } = data.drivers[code]
            const valid = lap_numbers
              .map((l, i) => ({ l, t: lap_times[i], c: compound[i] ?? "UNKNOWN" }))
              .filter((x): x is { l: number; t: number; c: string } => x.t !== null)

            if (!valid.length) return null
            const color = TEAM_COLORS[code] ?? "#666"

            // Build polyline segments — break line at compound changes (pit stops)
            const segments: { l: number; t: number; c: string }[][] = []
            let seg: { l: number; t: number; c: string }[] = []
            for (let i = 0; i < valid.length; i++) {
              if (i > 0 && valid[i].c !== valid[i - 1].c) {
                segments.push(seg)
                seg = [valid[i - 1]] // carry last point as connector
              }
              seg.push(valid[i])
            }
            if (seg.length) segments.push(seg)

            return (
              <g key={code}>
                {/* Thin guide line in team color */}
                <polyline
                  points={valid.map(({ l, t }) => `${toX(l).toFixed(1)},${toY(t).toFixed(1)}`).join(" ")}
                  fill="none"
                  stroke={color}
                  strokeWidth={1}
                  opacity={0.3}
                />
                {/* Compound-colored dots */}
                {valid.map(({ l, t, c }) => (
                  <circle
                    key={l}
                    cx={toX(l)}
                    cy={toY(t)}
                    r={3}
                    fill={COMPOUND_COLORS[c.toUpperCase()] ?? "#555"}
                    opacity={0.9}
                  />
                ))}
                {/* End label */}
                {(() => {
                  const last = valid[valid.length - 1]
                  return (
                    <text x={toX(last.l) + 5} y={toY(last.t) + 4} fontSize={10} fill={color} fontFamily="var(--font-dm-mono)">{code}</text>
                  )
                })()}
              </g>
            )
          })}

          {/* Crosshair */}
          {tooltip && (
            <>
              <line x1={tooltip.x} y1={cT} x2={tooltip.x} y2={cB} stroke="#ffffff1a" strokeWidth={1} strokeDasharray="4 3" />
              {tooltip.entries.map(({ code, time }) => (
                <circle key={code} cx={tooltip.x} cy={toY(time)} r={4} fill={TEAM_COLORS[code] ?? "#666"} stroke="#0a0a0a" strokeWidth={1.5} />
              ))}
            </>
          )}
        </svg>

        {tooltip && tooltip.entries.length > 0 && (
          <div
            className="absolute top-2 pointer-events-none z-10 glass-card border border-[#1e1e1e] px-3 py-2 min-w-32"
            style={{
              left: tooltip.x / W > 0.72 ? "auto" : `calc(${(tooltip.x / W) * 100}% + 10px)`,
              right: tooltip.x / W > 0.72 ? `calc(${(1 - tooltip.x / W) * 100}% + 10px)` : "auto",
            }}
          >
            <div className="text-[0.55rem] font-(family-name:--font-dm-mono) text-text-muted mb-1 tracking-wider">LAP {tooltip.lap}</div>
            {tooltip.entries.map(({ code, time, compound }) => (
              <div key={code} className="flex items-center justify-between gap-4 text-[0.6rem] font-(family-name:--font-dm-mono)">
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: COMPOUND_COLORS[compound.toUpperCase()] ?? "#555" }}
                  />
                  <span style={{ color: TEAM_COLORS[code] ?? "#666" }}>{code}</span>
                </span>
                <span className="text-text-secondary">{fmtTime(time)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
