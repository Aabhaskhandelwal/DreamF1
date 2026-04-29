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
  const pad = (Math.max(xMax - xMin, yMax - yMin)) * 0.06

  const vbX = xMin - pad
  const vbY = yMin - pad
  const vbW = xMax - xMin + pad * 2
  const vbH = yMax - yMin + pad * 2

  const pts = x.map((v, i) => `${v},${ys[i]}`).join(" ")

  // Start/finish line — perpendicular tick at first point
  const dx = x[3] - x[0], dy = ys[3] - ys[0]
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const nx = (-dy / len) * pad * 0.6
  const ny = (dx / len) * pad * 0.6

  return (
    <div className="glass-card p-4">
      <p className="section-label mb-3">{data.session}</p>
      <svg
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        width="100%"
        className="block"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Track base — thick dark shadow */}
        <polyline
          points={pts}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth={pad * 0.55}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Track surface */}
        <polyline
          points={pts}
          fill="none"
          stroke="#2a2a2a"
          strokeWidth={pad * 0.38}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Centre line */}
        <polyline
          points={pts}
          fill="none"
          stroke="#3a3a3a"
          strokeWidth={pad * 0.12}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${pad * 0.4} ${pad * 0.6}`}
          opacity={0.4}
        />
        {/* Start/finish line */}
        <line
          x1={x[0] + nx}
          y1={ys[0] + ny}
          x2={x[0] - nx}
          y2={ys[0] - ny}
          stroke="#ED1131"
          strokeWidth={pad * 0.18}
          strokeLinecap="round"
          opacity={0.9}
        />
        {/* Start dot */}
        <circle
          cx={x[0]}
          cy={ys[0]}
          r={pad * 0.14}
          fill="#ED1131"
          opacity={0.9}
        />
      </svg>
      <p className="text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim mt-2 text-center tracking-widest uppercase">
        Red mark = Start / Finish
      </p>
    </div>
  )
}
