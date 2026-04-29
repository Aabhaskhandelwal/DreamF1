"use client"

import { useState, useRef, useCallback } from "react"
import { TEAM_COLORS } from "@/lib/design"

export interface PositionData {
  session: string
  drivers: Record<string, { lap_numbers: number[]; positions: number[] }>
}

const W = 1000
const H = 340
const PAD = { top: 14, right: 64, bottom: 38, left: 42 }
const MAX_POS = 22

function lerp(val: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  if (inMax === inMin) return outMin
  return outMin + ((val - inMin) / (inMax - inMin)) * (outMax - outMin)
}

function closestIdx(arr: number[], target: number): number {
  let best = 0
  let bestDiff = Math.abs(arr[0] - target)
  for (let i = 1; i < arr.length; i++) {
    const d = Math.abs(arr[i] - target)
    if (d < bestDiff) { bestDiff = d; best = i }
  }
  return best
}

export default function PositionChart({ data }: { data: PositionData }) {
  const codes = Object.keys(data.drivers)
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [tooltip, setTooltip] = useState<{
    x: number; lap: number; entries: { code: string; pos: number }[]
  } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const toggle = (code: string) =>
    setHidden((prev) => { const n = new Set(prev); n.has(code) ? n.delete(code) : n.add(code); return n })

  const cL = PAD.left, cR = W - PAD.right, cT = PAD.top, cB = H - PAD.bottom
  const allLaps = codes.flatMap((c) => data.drivers[c].lap_numbers)
  const minLap = Math.min(...allLaps), maxLap = Math.max(...allLaps)

  const toX = (lap: number) => lerp(lap, minLap, maxLap, cL, cR)
  const toY = (pos: number) => lerp(pos, 1, MAX_POS, cT, cB)

  const handleMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const vx = ((e.clientX - rect.left) / rect.width) * W
    if (vx < cL || vx > cR) { setTooltip(null); return }

    const lapF = lerp(vx, cL, cR, minLap, maxLap)
    const lap = Math.max(minLap, Math.min(maxLap, Math.round(lapF)))

    const entries: { code: string; pos: number }[] = []
    for (const code of codes) {
      if (hidden.has(code)) continue
      const { lap_numbers, positions } = data.drivers[code]
      if (!lap_numbers.length) continue
      const i = closestIdx(lap_numbers, lap)
      if (Math.abs(lap_numbers[i] - lap) <= 2)
        entries.push({ code, pos: positions[i] })
    }
    entries.sort((a, b) => a.pos - b.pos)
    setTooltip({ x: toX(lap), lap, entries })
  }, [codes, hidden, data, minLap, maxLap, cL, cR])

  const posTicks = [1, 5, 10, 15, 20]
  const lapTicks: number[] = []
  for (let l = Math.ceil(minLap / 10) * 10; l <= maxLap; l += 10) lapTicks.push(l)

  return (
    <div className="glass-card p-4 space-y-3">
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
          {/* Horizontal grid — one per position tick */}
          {posTicks.map((pos) => {
            const y = toY(pos)
            return (
              <g key={pos}>
                <line x1={cL} y1={y} x2={cR} y2={y} stroke="#1a1a1a" strokeWidth={1} />
                <text x={cL - 6} y={y + 4} fontSize={12} fill="#444" textAnchor="end" fontFamily="var(--font-dm-mono)">
                  P{pos}
                </text>
              </g>
            )
          })}

          {/* Vertical lap ticks */}
          {lapTicks.map((lap) => {
            const x = toX(lap)
            return (
              <g key={lap}>
                <line x1={x} y1={cT} x2={x} y2={cB} stroke="#111" strokeWidth={1} />
                <text x={x} y={H - 10} fontSize={11} fill="#444" textAnchor="middle" fontFamily="var(--font-dm-mono)">
                  {lap}
                </text>
              </g>
            )
          })}

          <text x={(cL + cR) / 2} y={H - 2} fontSize={11} fill="#333" textAnchor="middle" fontFamily="var(--font-dm-mono)">
            LAP
          </text>

          {/* Driver lines */}
          {codes.filter((c) => !hidden.has(c)).map((code) => {
            const { lap_numbers, positions } = data.drivers[code]
            const pts = lap_numbers.map((l, i) => `${toX(l).toFixed(1)},${toY(positions[i]).toFixed(1)}`).join(" ")
            const color = TEAM_COLORS[code] ?? "#666"
            const lastLap = lap_numbers[lap_numbers.length - 1]
            const lastPos = positions[positions.length - 1]
            return (
              <g key={code}>
                <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
                <text x={toX(lastLap) + 5} y={toY(lastPos) + 4} fontSize={10} fill={color} fontFamily="var(--font-dm-mono)">{code}</text>
              </g>
            )
          })}

          {/* Crosshair + dots */}
          {tooltip && (
            <>
              <line x1={tooltip.x} y1={cT} x2={tooltip.x} y2={cB} stroke="#ffffff1a" strokeWidth={1} strokeDasharray="4 3" />
              {tooltip.entries.map(({ code, pos }) => (
                <circle key={code} cx={tooltip.x} cy={toY(pos)} r={4} fill={TEAM_COLORS[code] ?? "#666"} stroke="#0a0a0a" strokeWidth={1.5} />
              ))}
            </>
          )}
        </svg>

        {/* Floating tooltip */}
        {tooltip && tooltip.entries.length > 0 && (
          <div
            className="absolute top-2 pointer-events-none z-10 glass-card border border-[#1e1e1e] px-3 py-2 min-w-24"
            style={{
              left: tooltip.x / W > 0.72 ? "auto" : `calc(${(tooltip.x / W) * 100}% + 10px)`,
              right: tooltip.x / W > 0.72 ? `calc(${(1 - tooltip.x / W) * 100}% + 10px)` : "auto",
            }}
          >
            <div className="text-[0.55rem] font-(family-name:--font-dm-mono) text-text-muted mb-1 tracking-wider">LAP {tooltip.lap}</div>
            {tooltip.entries.map(({ code, pos }) => (
              <div key={code} className="flex justify-between gap-4 text-[0.6rem] font-(family-name:--font-dm-mono)">
                <span style={{ color: TEAM_COLORS[code] ?? "#666" }}>{code}</span>
                <span className="text-text-secondary">P{pos}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
