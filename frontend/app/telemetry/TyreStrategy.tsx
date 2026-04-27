import { TEAM_COLORS } from "@/lib/design"

export interface TyreStint {
  driver: string
  compound: string
  lap_start: number
  lap_end: number
}

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: "#E8002D",
  MEDIUM: "#FFF200",
  HARD: "#F0F0EC",
  INTERMEDIATE: "#39B54A",
  INTER: "#39B54A",
  WET: "#0067FF",
  UNKNOWN: "#555555",
}

function CompoundDot({ compound }: { compound: string }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full mr-1"
      style={{ backgroundColor: COMPOUND_COLORS[compound] ?? "#555" }}
    />
  )
}

export default function TyreStrategy({
  stints,
  driverOrder,
}: {
  stints: TyreStint[]
  driverOrder: string[]
}) {
  const totalLaps = Math.max(...stints.map((s) => s.lap_end), 1)

  // Group stints by driver, preserving finish order
  const stintsByDriver = new Map<string, TyreStint[]>()
  for (const driver of driverOrder) {
    stintsByDriver.set(
      driver,
      stints.filter((s) => s.driver === driver).sort((a, b) => a.lap_start - b.lap_start)
    )
  }

  return (
    <div className="glass-card p-4 space-y-3">
      {/* Legend */}
      <div className="flex gap-4 pb-2 border-b border-[#1e1e1e]">
        {Object.entries(COMPOUND_COLORS)
          .filter(([k]) => !["INTER", "UNKNOWN"].includes(k))
          .map(([compound, color]) => (
            <span key={compound} className="flex items-center gap-1 text-[0.6rem] font-(family-name:--font-dm-mono) text-text-muted uppercase">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {compound}
            </span>
          ))}
      </div>

      {/* Lap number axis */}
      <div className="flex ml-14 text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim">
        <span className="flex-1 text-left">0</span>
        <span className="flex-1 text-center">{Math.round(totalLaps / 2)}</span>
        <span className="flex-1 text-right">{totalLaps}</span>
      </div>

      {/* Driver rows — adapted from TyresList.tsx in f1-telemetry-master */}
      {driverOrder.map((driver) => {
        const driverStints = stintsByDriver.get(driver) ?? []
        if (driverStints.length === 0) return null
        const teamColor = TEAM_COLORS[driver] ?? "#333"

        return (
          <div key={driver} className="flex items-center gap-3">
            {/* Driver code */}
            <span
              className="w-10 text-[0.65rem] font-(family-name:--font-f1-regular) tracking-wider shrink-0 text-right"
              style={{ color: teamColor }}
            >
              {driver}
            </span>

            {/* Stint bars */}
            <div className="flex-1 h-[6px] bg-[#0a0a0a] rounded-sm flex">
              {driverStints.map((stint, idx) => {
                const widthPct = ((stint.lap_end - stint.lap_start + 1) / totalLaps) * 100
                const compound = stint.compound.toUpperCase()
                const color = COMPOUND_COLORS[compound] ?? "#555"
                return (
                  <div
                    key={idx}
                    title={`${compound} · L${stint.lap_start}–${stint.lap_end}`}
                    className="h-full relative group"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: color,
                      borderLeft: idx > 0 ? "2px solid #0a0a0a" : undefined,
                      borderRight: idx < driverStints.length - 1 ? "2px solid #0a0a0a" : undefined,
                    }}
                  >
                    {/* Pit-stop lap label */}
                    {idx < driverStints.length - 1 && (
                      <span
                        className="absolute -right-px top-2 text-[0.5rem] font-(family-name:--font-dm-mono) text-text-muted translate-x-1/2 whitespace-nowrap"
                      >
                        {stint.lap_end}L
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
