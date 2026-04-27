import { TEAM_COLORS } from "@/lib/design"

export interface RaceResult {
  abbreviation: string
  finish_position: number | null
  grid_position: number | null
  positions_gained: number | null
  status: string
  is_dnf: boolean
  points: number
  avg_lap_time: number | null
  best_lap_time: number | null
  total_laps: number
  fastest_lap: boolean
}

function fmtTime(s: number | null): string {
  if (!s) return "—"
  const m = Math.floor(s / 60)
  const rem = (s % 60).toFixed(3).padStart(6, "0")
  return `${m}:${rem}`
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-text-muted">—</span>
  if (delta > 0)
    return <span className="text-f1-green font-(family-name:--font-dm-mono) text-xs">+{delta}</span>
  if (delta < 0)
    return <span className="text-f1-red font-(family-name:--font-dm-mono) text-xs">{delta}</span>
  return <span className="text-text-muted font-(family-name:--font-dm-mono) text-xs">—</span>
}

export default function RaceClassification({ results }: { results: RaceResult[] }) {
  return (
    <div className="glass-card overflow-hidden">
      {/* Header row */}
      <div
        className="grid text-[0.6rem] font-(family-name:--font-dm-mono) uppercase tracking-widest
                   text-text-muted px-4 py-2 border-b border-[#1e1e1e]"
        style={{ gridTemplateColumns: "2.5rem 4rem 1fr 3rem 3rem 5rem 5rem 1.5rem" }}
      >
        <span>POS</span>
        <span>DRIVER</span>
        <span>STATUS</span>
        <span className="text-right">GRID</span>
        <span className="text-right">DELTA</span>
        <span className="text-right">BEST LAP</span>
        <span className="text-right">AVG LAP</span>
        <span className="text-right">PTS</span>
      </div>

      {results.map((r) => {
        const teamColor = TEAM_COLORS[r.abbreviation] ?? "#333"
        return (
          <div
            key={r.abbreviation}
            className="grid items-center px-4 py-2 border-b border-[#111] last:border-0 transition-colors hover:bg-[#111]"
            style={{
              gridTemplateColumns: "2.5rem 4rem 1fr 3rem 3rem 5rem 5rem 1.5rem",
              background: `linear-gradient(90deg, ${teamColor}18 0%, transparent 40%)`,
            }}
          >
            {/* Pos */}
            <span className="font-(family-name:--font-orbitron) text-sm font-bold text-text-primary">
              {r.finish_position ?? "—"}
            </span>

            {/* Driver code */}
            <span
              className="font-(family-name:--font-f1-regular) text-xs font-bold tracking-wider"
              style={{ color: teamColor }}
            >
              {r.abbreviation}
              {r.fastest_lap && (
                <span className="ml-1 text-[#c084fc] text-[0.5rem] align-super">FL</span>
              )}
            </span>

            {/* Status */}
            <span
              className={`text-xs font-(family-name:--font-dm-mono) ${
                r.is_dnf ? "text-f1-red opacity-60" : "text-text-muted"
              }`}
            >
              {r.is_dnf ? `DNF (L${r.total_laps})` : r.status}
            </span>

            {/* Grid */}
            <span className="text-right text-xs font-(family-name:--font-dm-mono) text-text-muted">
              {r.grid_position ?? "—"}
            </span>

            {/* Delta */}
            <span className="text-right">
              <DeltaBadge delta={r.positions_gained} />
            </span>

            {/* Best lap */}
            <span
              className={`text-right text-xs font-(family-name:--font-dm-mono) ${
                r.fastest_lap ? "text-[#c084fc]" : "text-text-secondary"
              }`}
            >
              {fmtTime(r.best_lap_time)}
            </span>

            {/* Avg lap */}
            <span className="text-right text-xs font-(family-name:--font-dm-mono) text-text-muted">
              {fmtTime(r.avg_lap_time)}
            </span>

            {/* Points */}
            <span className="text-right text-xs font-(family-name:--font-orbitron) text-text-primary">
              {r.points > 0 ? r.points : ""}
            </span>
          </div>
        )
      })}
    </div>
  )
}
