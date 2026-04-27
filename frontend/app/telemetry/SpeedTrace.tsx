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
const H = 280
const PAD = { top: 10, right: 10, bottom: 30, left: 40 }

function normalize(val: number, min: number, max: number, outMin: number, outMax: number) {
  if (max === min) return outMin
  return outMin + ((val - min) / (max - min)) * (outMax - outMin)
}

export default function SpeedTrace({ drivers, top = 10 }: Props) {
  const driverCodes = Object.keys(drivers).slice(0, top)
  if (driverCodes.length === 0) return null

  const allDistances = driverCodes.flatMap((d) => drivers[d].distance)
  const allSpeeds = driverCodes.flatMap((d) => drivers[d].speed)
  const minDist = Math.min(...allDistances)
  const maxDist = Math.max(...allDistances)
  const minSpeed = Math.min(...allSpeeds)
  const maxSpeed = Math.max(...allSpeeds)

  const chartL = PAD.left
  const chartR = W - PAD.right
  const chartT = PAD.top
  const chartB = H - PAD.bottom

  function toX(dist: number) {
    return normalize(dist, minDist, maxDist, chartL, chartR)
  }
  function toY(speed: number) {
    // SVG y goes down — faster = higher on screen = lower y value
    return normalize(speed, minSpeed, maxSpeed, chartB, chartT)
  }

  // Y-axis gridlines at 50 km/h intervals
  const gridSpeeds: number[] = []
  for (let s = Math.ceil(minSpeed / 50) * 50; s <= maxSpeed; s += 50) {
    gridSpeeds.push(s)
  }

  return (
    <div className="glass-card p-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-3">
        {driverCodes.map((code) => (
          <span
            key={code}
            className="flex items-center gap-1.5 text-[0.6rem] font-(family-name:--font-dm-mono) uppercase"
          >
            <span
              className="inline-block w-3 h-0.5 rounded"
              style={{ backgroundColor: TEAM_COLORS[code] ?? "#666" }}
            />
            <span style={{ color: TEAM_COLORS[code] ?? "#666" }}>{code}</span>
          </span>
        ))}
      </div>

      {/* SVG chart — technique adapted from f1-telemetry-master/components/telemetry/Map.tsx */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        className="block"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Grid lines */}
        {gridSpeeds.map((speed) => {
          const y = toY(speed)
          return (
            <g key={speed}>
              <line
                x1={chartL}
                y1={y}
                x2={chartR}
                y2={y}
                stroke="#1e1e1e"
                strokeWidth={1}
              />
              <text
                x={chartL - 4}
                y={y + 4}
                fontSize={14}
                fill="#444"
                textAnchor="end"
                fontFamily="var(--font-dm-mono)"
              >
                {speed}
              </text>
            </g>
          )
        })}

        {/* X-axis label */}
        <text
          x={(chartL + chartR) / 2}
          y={H - 4}
          fontSize={12}
          fill="#444"
          textAnchor="middle"
          fontFamily="var(--font-dm-mono)"
        >
          DISTANCE (m)
        </text>

        {/* Speed traces per driver */}
        {driverCodes.map((code) => {
          const { distance, speed } = drivers[code]
          const points = distance
            .map((d, i) => `${toX(d).toFixed(1)},${toY(speed[i]).toFixed(1)}`)
            .join(" ")

          return (
            <polyline
              key={code}
              points={points}
              fill="none"
              stroke={TEAM_COLORS[code] ?? "#666"}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.85}
            />
          )
        })}
      </svg>
    </div>
  )
}
