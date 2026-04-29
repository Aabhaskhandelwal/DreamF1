export interface MapData {
  session: string
  x: number[]
  y: number[]
}

export default function CircuitMap({ data }: { data: MapData }) {
  const { x, y } = data
  if (!x.length || !y.length) return null

  // Flip Y — GPS north is up, SVG Y is down
  const ys = y.map((v) => -v)

  const xMin = Math.min(...x), xMax = Math.max(...x)
  const yMin = Math.min(...ys), yMax = Math.max(...ys)
  const size = Math.max(xMax - xMin, yMax - yMin)

  // Generous padding so glow blur doesn't clip
  const pad = size * 0.14

  const vbX = xMin - pad, vbY = yMin - pad
  const vbW = xMax - xMin + pad * 2
  const vbH = yMax - yMin + pad * 2

  const pts = x.map((v, i) => `${v},${ys[i]}`).join(" ")

  // Track widths — all relative to circuit size so they scale correctly
  const T = size * 0.008      // base unit ≈ actual track width at real scale
  const coreW   = T * 0.5     // brightest centre line
  const rimW    = T * 1.4     // track surface
  const glow1W  = T * 3.5     // tight inner glow
  const glow2W  = T * 9       // medium halo
  const auraW   = T * 22      // outer aura

  // Blur radii must be large enough relative to stroke width to look like a halo
  const blur1 = T * 1.2
  const blur2 = T * 4
  const blur3 = T * 11

  // Start/finish perpendicular tick
  const dx = x[3] - x[0], dy = ys[3] - ys[0]
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const nx = (-dy / len) * rimW * 2.5
  const ny = (dx / len) * rimW * 2.5

  return (
    <div className="overflow-hidden rounded-sm" style={{ background: "#050505" }}>
      <svg
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        width="100%"
        className="block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Tight inner glow — crisp halo close to track */}
          <filter id="g1" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={blur1} result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          {/* Medium bloom */}
          <filter id="g2" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation={blur2} result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          {/* Wide outer aura */}
          <filter id="g3" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={blur3} result="b"/>
            <feMergeNode in="b"/>
          </filter>
        </defs>

        {/* ── Layer 1: far outer aura (pure blur, no source graphic) ── */}
        <polyline
          points={pts} fill="none"
          stroke="#ffffff" strokeWidth={auraW}
          strokeLinecap="round" strokeLinejoin="round"
          opacity={0.028} filter="url(#g3)"
        />

        {/* ── Layer 2: medium bloom ── */}
        <polyline
          points={pts} fill="none"
          stroke="#ffffff" strokeWidth={glow2W}
          strokeLinecap="round" strokeLinejoin="round"
          opacity={0.06} filter="url(#g2)"
        />

        {/* ── Layer 3: tight inner bloom ── */}
        <polyline
          points={pts} fill="none"
          stroke="#ffffff" strokeWidth={glow1W}
          strokeLinecap="round" strokeLinejoin="round"
          opacity={0.18} filter="url(#g1)"
        />

        {/* ── Layer 4: dark track bed (fills the inside dark) ── */}
        <polyline
          points={pts} fill="none"
          stroke="#0a0a0a" strokeWidth={rimW * 1.1}
          strokeLinecap="round" strokeLinejoin="round"
        />

        {/* ── Layer 5: bright track rim with tight glow ── */}
        <polyline
          points={pts} fill="none"
          stroke="#e8e8e8" strokeWidth={rimW}
          strokeLinecap="round" strokeLinejoin="round"
          opacity={0.55} filter="url(#g1)"
        />

        {/* ── Layer 6: bright core line ── */}
        <polyline
          points={pts} fill="none"
          stroke="#ffffff" strokeWidth={coreW}
          strokeLinecap="round" strokeLinejoin="round"
          opacity={0.95}
        />

        {/* ── Start / finish marker ── */}
        <line
          x1={x[0] + nx} y1={ys[0] + ny}
          x2={x[0] - nx} y2={ys[0] - ny}
          stroke="#ED1131" strokeWidth={coreW * 4}
          strokeLinecap="round" opacity={0.95}
          filter="url(#g1)"
        />
        <line
          x1={x[0] + nx} y1={ys[0] + ny}
          x2={x[0] - nx} y2={ys[0] - ny}
          stroke="#ffffff" strokeWidth={coreW * 1.5}
          strokeLinecap="round" opacity={0.9}
        />
      </svg>

      {/* Footer label */}
      <p className="text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim text-center tracking-widest uppercase py-2">
        {data.session} · GPS telemetry fastest lap
      </p>
    </div>
  )
}
