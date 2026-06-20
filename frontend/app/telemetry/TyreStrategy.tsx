import { TEAM_COLORS } from "@/lib/design"

export interface TyreStint {
  driver: string
  compound: string
  lap_start: number
  lap_end: number
  laps?: number
  tyre_life_start?: number | null
  fresh?: boolean | null
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

// Light compounds need dark text for the in-bar lap count.
const DARK_TEXT = new Set(["MEDIUM", "HARD"])

// Diagonal hatch overlay marks a used (scrubbed) set.
const USED_HATCH =
  "repeating-linear-gradient(45deg, transparent 0 3px, rgba(0,0,0,0.28) 3px 5px)"

export default function TyreStrategy({
  stints,
  driverOrder,
}: {
  stints: TyreStint[]
  driverOrder: string[]
}) {
  const totalLaps = Math.max(...stints.map((s) => s.lap_end), 1)

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
      <div className="flex flex-wrap gap-4 pb-2 border-b border-[#1e1e1e]">
        {Object.entries(COMPOUND_COLORS)
          .filter(([k]) => !["INTER", "UNKNOWN"].includes(k))
          .map(([compound, color]) => (
            <span key={compound} className="flex items-center gap-1 text-[0.6rem] font-(family-name:--font-dm-mono) text-text-muted uppercase">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {compound}
            </span>
          ))}
        <span className="flex items-center gap-1 text-[0.6rem] font-(family-name:--font-dm-mono) text-text-muted uppercase ml-auto">
          <span className="inline-block w-3 h-2 rounded-sm" style={{ background: `${USED_HATCH}, #777` }} />
          used set
        </span>
      </div>

      {/* Lap number axis */}
      <div className="flex ml-12 mr-12 text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim">
        <span className="flex-1 text-left">0</span>
        <span className="flex-1 text-center">{Math.round(totalLaps / 2)}</span>
        <span className="flex-1 text-right">{totalLaps}</span>
      </div>

      {/* Driver rows */}
      {driverOrder.map((driver) => {
        const driverStints = stintsByDriver.get(driver) ?? []
        if (driverStints.length === 0) return null
        const teamColor = TEAM_COLORS[driver] ?? "#333"
        const stops = driverStints.length - 1

        return (
          <div key={driver} className="flex items-center gap-3">
            <span
              className="w-9 text-[0.65rem] font-(family-name:--font-f1-regular) tracking-wider shrink-0 text-right"
              style={{ color: teamColor }}
            >
              {driver}
            </span>

            {/* Stint bars */}
            <div className="flex-1 h-3.5 bg-[#0a0a0a] rounded-sm flex overflow-hidden">
              {driverStints.map((stint, idx) => {
                const laps = stint.laps ?? stint.lap_end - stint.lap_start + 1
                const widthPct = (laps / totalLaps) * 100
                const compound = stint.compound.toUpperCase()
                const color = COMPOUND_COLORS[compound] ?? "#555"
                // Fresh sets report TyreLife starting at 1, so trust `fresh`;
                // only fall back to age when the flag is missing.
                const used = stint.fresh === false || (stint.fresh == null && (stint.tyre_life_start ?? 0) > 1)
                const age = stint.tyre_life_start ?? 0
                const tip = `${compound} · L${stint.lap_start}–${stint.lap_end} · ${laps} laps · ${
                  used ? `used (${age}L old)` : "new"
                }`
                return (
                  <div
                    key={idx}
                    title={tip}
                    className="h-full flex items-center justify-center"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: color,
                      backgroundImage: used ? USED_HATCH : undefined,
                      borderLeft: idx > 0 ? "2px solid #0a0a0a" : undefined,
                    }}
                  >
                    {widthPct > 6 && (
                      <span
                        className="text-[0.5rem] font-(family-name:--font-dm-mono) leading-none tabular-nums"
                        style={{ color: DARK_TEXT.has(compound) ? "#111" : "#fff" }}
                      >
                        {laps}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Strategy summary */}
            <span className="w-10 text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim shrink-0 tabular-nums">
              {stops}-stop
            </span>
          </div>
        )
      })}
    </div>
  )
}
