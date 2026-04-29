"use client"

import { useState, useRef, useCallback } from "react"
import { TEAM_COLORS } from "@/lib/design"

interface DriverSpeed {
  distance: number[]
  speed: number[]
}

interface Props {
  drivers: Record<string, DriverSpeed>
  top?: number
}

const W = 1000
const H = 300
const PAD = { top: 12, right: 14, bottom: 34, left: 44 }

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

export default function SpeedTrace({ drivers, top = 10 }: Props) {
  const driverCodes = Object.keys(drivers).slice(0, top)
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [tooltip, setTooltip] = useState<{
    x: number; dist: number; entries: { code: string; speed: number }[]
  } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  if (driverCodes.length === 0) return null

  const toggle = (code: string) =>
    setHidden((prev) => { const n = new Set(prev); n.has(code) ? n.delete(code) : n.add(code); return n })

  const cL = PAD.left, cR = W - PAD.right, cT = PAD.top, cB = H - PAD.bottom

  const allDist = driverCodes.flatMap((d) => drivers[d].distance)
  const allSpeed = driverCodes.flatMap((d) => drivers[d].speed)
  const minDist = Math.min(...allDist), maxDist = Math.max(...allDist)
  const minSpeed = Math.min(...allSpeed), maxSpeed = Math.max(...allSpeed)

  const toX = (dist: number) => lerp(dist, minDist, maxDist, cL, cR)
  const toY = (speed: number) => lerp(speed, minSpeed, maxSpeed, cB, cT)

  const handleMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const vx = ((e.clientX - rect.left) / rect.width) * W
    if (vx < cL || vx > cR) { setTooltip(null); return }

    const distF = lerp(vx, cL, cR, minDist, maxDist)

    const entries: { code: string; speed: number }[] = []
    for (const code of driverCodes) {
      if (hidden.has(code)) continue
      const { distance, speed } = drivers[code]
      if (!distance.length) continue
      const i = closestIdx(distance, distF)
      entries.push({ code, speed: speed[i] })
    }
    entries.sort((a, b) => b.speed - a.speed)
    setTooltip({ x: vx, dist: Math.round(distF), entries })
  }, [driverCodes, hidden, drivers, minDist, maxDist, cL, cR])

  const gridSpeeds: number[] = []
  for (let s = Math.ceil(minSpeed / 50) * 50; s <= maxSpeed; s += 50) gridSpeeds.push(s)

  return (
    <div className="glass-card p-4 space-y-3">
      {/* Driver toggles */}
      <div className="flex flex-wrap gap-2">
        {driverCodes.map((code) => {
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
          {/* Speed grid lines */}
          {gridSpeeds.map((speed) => {
            const y = toY(speed)
            return (
              <g key={speed}>
                <line x1={cL} y1={y} x2={cR} y2={y} stroke="#1e1e1e" strokeWidth={1} />
                <text x={cL - 4} y={y + 4} fontSize={13} fill="#444" textAnchor="end" fontFamily="var(--font-dm-mono)">{speed}</text>
              </g>
            )
          })}

          <text x={(cL + cR) / 2} y={H - 4} fontSize={11} fill="#444" textAnchor="middle" fontFamily="var(--font-dm-mono)">
            DISTANCE (m)
          </text>

          {/* Speed traces */}
          {driverCodes.filter((c) => !hidden.has(c)).map((code) => {
            const { distance, speed } = drivers[code]
            const pts = distance.map((d, i) => `${toX(d).toFixed(1)},${toY(speed[i]).toFixed(1)}`).join(" ")
            return (
              <polyline
                key={code}
                points={pts}
                fill="none"
                stroke={TEAM_COLORS[code] ?? "#666"}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.85}
              />
            )
          })}

          {/* Crosshair + dots */}
          {tooltip && (
            <>
              <line x1={tooltip.x} y1={cT} x2={tooltip.x} y2={cB} stroke="#ffffff1a" strokeWidth={1} strokeDasharray="4 3" />
              {tooltip.entries.map(({ code, speed }) => (
                <circle key={code} cx={tooltip.x} cy={toY(speed)} r={4} fill={TEAM_COLORS[code] ?? "#666"} stroke="#0a0a0a" strokeWidth={1.5} />
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
            <div className="text-[0.55rem] font-(family-name:--font-dm-mono) text-text-muted mb-1 tracking-wider">{tooltip.dist}m</div>
            {tooltip.entries.map(({ code, speed }) => (
              <div key={code} className="flex justify-between gap-4 text-[0.6rem] font-(family-name:--font-dm-mono)">
                <span style={{ color: TEAM_COLORS[code] ?? "#666" }}>{code}</span>
                <span className="text-text-secondary">{Math.round(speed)} km/h</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
