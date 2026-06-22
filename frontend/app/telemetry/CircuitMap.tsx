"use client"

import { useEffect, useState } from "react"
import { getCircuitImageCandidates, getCircuitFacts } from "@/lib/circuits"

export interface MapData {
  session: string
  x: number[]
  y: number[]
}

/** The neon GPS glow map — used as the fallback when no circuit diagram exists. */
function GlowMap({ x, y }: { x: number[]; y: number[] }) {
  if (!x.length || !y.length) return null
  const ys = y.map((v) => -v) // GPS north is up, SVG Y is down

  const xMin = Math.min(...x), xMax = Math.max(...x)
  const yMin = Math.min(...ys), yMax = Math.max(...ys)
  const size = Math.max(xMax - xMin, yMax - yMin)
  const pad = size * 0.14

  const vbX = xMin - pad, vbY = yMin - pad
  const vbW = xMax - xMin + pad * 2
  const vbH = yMax - yMin + pad * 2
  const pts = x.map((v, i) => `${v},${ys[i]}`).join(" ")

  const T = size * 0.008
  const coreW = T * 0.5, rimW = T * 1.4, glow1W = T * 3.5, glow2W = T * 9, auraW = T * 22
  const blur1 = T * 1.2, blur2 = T * 4, blur3 = T * 11

  const dx = x[3] - x[0], dy = ys[3] - ys[0]
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const nx = (-dy / len) * rimW * 2.5
  const ny = (dx / len) * rimW * 2.5

  return (
    <svg viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} width="100%" className="block" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="g1" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={blur1} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="g2" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={blur2} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="g3" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={blur3} result="b" />
          <feMergeNode in="b" />
        </filter>
      </defs>
      <polyline points={pts} fill="none" stroke="#ffffff" strokeWidth={auraW} strokeLinecap="round" strokeLinejoin="round" opacity={0.028} filter="url(#g3)" />
      <polyline points={pts} fill="none" stroke="#ffffff" strokeWidth={glow2W} strokeLinecap="round" strokeLinejoin="round" opacity={0.06} filter="url(#g2)" />
      <polyline points={pts} fill="none" stroke="#ffffff" strokeWidth={glow1W} strokeLinecap="round" strokeLinejoin="round" opacity={0.18} filter="url(#g1)" />
      <polyline points={pts} fill="none" stroke="#0a0a0a" strokeWidth={rimW * 1.1} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={pts} fill="none" stroke="#e8e8e8" strokeWidth={rimW} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} filter="url(#g1)" />
      <polyline points={pts} fill="none" stroke="#ffffff" strokeWidth={coreW} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />
      <line x1={x[0] + nx} y1={ys[0] + ny} x2={x[0] - nx} y2={ys[0] - ny} stroke="#ED1131" strokeWidth={coreW * 4} strokeLinecap="round" opacity={0.95} filter="url(#g1)" />
      <line x1={x[0] + nx} y1={ys[0] + ny} x2={x[0] - nx} y2={ys[0] - ny} stroke="#ffffff" strokeWidth={coreW * 1.5} strokeLinecap="round" opacity={0.9} />
    </svg>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[0.62rem] font-(family-name:--font-dm-mono) uppercase tracking-[0.14em] text-text-muted mb-1.5">
        {label}
      </p>
      <p className="font-(family-name:--font-orbitron) text-xl sm:text-2xl font-bold text-text-primary tabular-nums leading-none">
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-[0.62rem] font-(family-name:--font-dm-mono) text-text-dim">{sub}</p>
      )}
    </div>
  )
}

export default function CircuitMap({
  data,
  country,
  eventName,
  fastestLap,
}: {
  data: MapData
  country?: string
  eventName?: string
  fastestLap?: { driver: string; time: string } | null
}) {
  const candidates = country && eventName ? getCircuitImageCandidates(country, eventName) : []
  const facts = country && eventName ? getCircuitFacts(country, eventName) : null

  // Walk the candidate image formats; give up (→ glow map) once all have failed.
  const [imgIdx, setImgIdx] = useState(0)
  const key = candidates[0] ?? ""
  useEffect(() => {
    setImgIdx(0)
  }, [key])

  const showImage = imgIdx < candidates.length
  const imageSrc = candidates[imgIdx]
  const raceDistance = facts ? (facts.length_km * facts.laps).toFixed(3) : null

  return (
    <div className="glass-card overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr]">
        {/* ── Circuit visual ───────────────────────────────────── */}
        <div
          className="relative flex items-center justify-center border-b lg:border-b-0 lg:border-r border-border-default p-4 sm:p-6"
          style={{ background: "radial-gradient(ellipse at center, #0d0d0d 0%, #050505 80%)" }}
        >
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt={`${facts?.name ?? eventName} circuit map`}
              className="w-full h-auto object-contain"
              onError={() => setImgIdx((i) => i + 1)}
            />
          ) : (
            <GlowMap x={data.x} y={data.y} />
          )}
        </div>

        {/* ── Stats panel ──────────────────────────────────────── */}
        <div className="flex flex-col gap-5 p-5 sm:p-6">
          <div>
            <p className="section-label mb-1">{facts?.name ?? data.session}</p>
            <p className="text-[0.62rem] font-(family-name:--font-dm-mono) uppercase tracking-[0.14em] text-text-muted mb-2">
              Circuit Length
            </p>
            <p className="font-(family-name:--font-orbitron) text-4xl sm:text-5xl font-bold text-text-primary tabular-nums leading-none">
              {facts ? `${facts.length_km}` : "—"}
              {facts && <span className="text-2xl sm:text-3xl text-text-secondary">km</span>}
            </p>
          </div>

          <div className="h-px bg-border-default" />

          <div className="grid grid-cols-2 gap-5">
            <Stat label="First Grand Prix" value={facts ? `${facts.first_gp}` : "—"} />
            <Stat label="Number of Laps" value={facts ? `${facts.laps}` : "—"} />
            <Stat
              label="Fastest Lap"
              value={fastestLap?.time ?? "—"}
              sub={fastestLap ? `${fastestLap.driver} · this race` : undefined}
            />
            <Stat
              label="Race Distance"
              value={raceDistance ? `${raceDistance}` : "—"}
              sub={raceDistance ? "km" : undefined}
            />
          </div>

          {!showImage && (
            <p className="mt-auto text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim tracking-widest uppercase leading-relaxed">
              GPS telemetry · fastest lap outline
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
