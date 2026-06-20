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

const PODIUM: Record<number, string> = { 1: "#FFD700", 2: "#C7CCD1", 3: "#CD7F32" }

/** Grid → Finish movement chip with a proportional bar. */
function Movement({ delta }: { delta: number | null }) {
  if (delta === null || delta === 0)
    return <span className="font-(family-name:--font-dm-mono) text-[0.7rem] text-text-dim">—</span>

  const gained = delta > 0
  const color = gained ? "var(--color-f1-green)" : "var(--color-f1-red)"
  const w = Math.min(Math.abs(delta), 12) / 12 // normalise to widest realistic swing

  return (
    <span className="flex items-center justify-end gap-1.5">
      <span
        className="hidden sm:block h-[3px] rounded-full"
        style={{ width: `${20 + w * 28}px`, background: color, opacity: 0.55 }}
      />
      <span
        className="font-(family-name:--font-dm-mono) text-[0.7rem] tabular-nums"
        style={{ color }}
      >
        {gained ? "▲" : "▼"}
        {Math.abs(delta)}
      </span>
    </span>
  )
}

function StatChip({
  label,
  driver,
  value,
  color,
  valueColor,
}: {
  label: string
  driver?: string
  value: string
  color: string
  valueColor?: string
}) {
  return (
    <div
      className="relative overflow-hidden rounded-md bg-surface-1/80 border border-border-default px-3 py-2"
      style={{ boxShadow: `inset 2px 0 0 ${color}` }}
    >
      <p className="section-label leading-none mb-1.5">{label}</p>
      <div className="flex items-baseline gap-1.5">
        {driver && (
          <span
            className="font-(family-name:--font-f1-regular) text-sm font-bold tracking-wider"
            style={{ color }}
          >
            {driver}
          </span>
        )}
        <span
          className="font-(family-name:--font-orbitron) text-sm font-bold tabular-nums"
          style={{ color: valueColor ?? "var(--color-text-primary)" }}
        >
          {value}
        </span>
      </div>
    </div>
  )
}

export default function RaceClassification({ results }: { results: RaceResult[] }) {
  const winner = results.find((r) => r.finish_position === 1)
  const flHolder = results.find((r) => r.fastest_lap)
  const mover = results
    .filter((r) => r.positions_gained !== null)
    .reduce<RaceResult | null>(
      (best, r) => (!best || (r.positions_gained ?? 0) > (best.positions_gained ?? 0) ? r : best),
      null,
    )
  const dnfCount = results.filter((r) => r.is_dnf).length
  const cols = "0.25rem 2.25rem 4rem 1fr 4.25rem 4.75rem 4.75rem 2rem"

  return (
    <div className="space-y-4">
      {/* ── Race summary strip ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <StatChip
          label="Winner"
          driver={winner?.abbreviation}
          value={winner ? `${winner.points} PTS` : "—"}
          color={winner ? TEAM_COLORS[winner.abbreviation] ?? "#fff" : "#444"}
        />
        <StatChip
          label="Fastest Lap"
          driver={flHolder?.abbreviation}
          value={flHolder ? fmtTime(flHolder.best_lap_time) : "—"}
          color="var(--color-f1-purple)"
          valueColor="var(--color-f1-purple)"
        />
        <StatChip
          label="Biggest Mover"
          driver={mover && (mover.positions_gained ?? 0) > 0 ? mover.abbreviation : undefined}
          value={mover && (mover.positions_gained ?? 0) > 0 ? `▲${mover.positions_gained}` : "—"}
          color="var(--color-f1-green)"
          valueColor="var(--color-f1-green)"
        />
        <StatChip
          label="Retirements"
          value={`${dnfCount} DNF`}
          color="var(--color-f1-red)"
          valueColor={dnfCount > 0 ? "var(--color-f1-red)" : undefined}
        />
      </div>

      {/* ── Timing tower ─────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <div className="glass-card overflow-hidden min-w-140">
          {/* Header row */}
          <div
            className="grid text-[0.6rem] font-(family-name:--font-dm-mono) uppercase tracking-widest
                       text-text-muted px-3 py-2.5 border-b border-border-default bg-surface-1/40"
            style={{ gridTemplateColumns: cols }}
          >
            <span />
            <span>POS</span>
            <span>DRIVER</span>
            <span>STATUS</span>
            <span className="text-right">GRID→FIN</span>
            <span className="text-right">BEST LAP</span>
            <span className="text-right">AVG LAP</span>
            <span className="text-right">PTS</span>
          </div>

          {results.map((r) => {
            const teamColor = TEAM_COLORS[r.abbreviation] ?? "#333"
            const podium = r.finish_position ? PODIUM[r.finish_position] : undefined
            return (
              <div
                key={r.abbreviation}
                className={`group grid items-center px-3 py-2 border-b border-border-subtle last:border-0
                           transition-colors hover:bg-surface-2/60 ${r.is_dnf ? "opacity-55" : ""}`}
                style={{
                  gridTemplateColumns: cols,
                  background: `linear-gradient(90deg, ${teamColor}1f 0%, transparent 42%)`,
                }}
              >
                {/* Team stripe */}
                <span
                  className="h-7 w-[3px] rounded-full transition-all group-hover:h-8"
                  style={{ background: teamColor, boxShadow: `0 0 8px ${teamColor}99` }}
                />

                {/* Pos — podium gets a filled medallion */}
                <span className="flex justify-center">
                  {podium ? (
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full
                                 font-(family-name:--font-orbitron) text-xs font-bold text-surface-0"
                      style={{ background: podium, boxShadow: `0 0 10px ${podium}66` }}
                    >
                      {r.finish_position}
                    </span>
                  ) : (
                    <span className="font-(family-name:--font-orbitron) text-sm font-bold text-text-secondary tabular-nums">
                      {r.finish_position ?? "—"}
                    </span>
                  )}
                </span>

                {/* Driver code */}
                <span
                  className="font-(family-name:--font-f1-regular) text-sm font-bold tracking-wider"
                  style={{ color: teamColor }}
                >
                  {r.abbreviation}
                  {r.fastest_lap && (
                    <span className="ml-1 align-super text-[0.5rem] font-bold text-f1-purple">FL</span>
                  )}
                </span>

                {/* Status */}
                <span
                  className={`text-[0.7rem] font-(family-name:--font-dm-mono) ${
                    r.is_dnf ? "text-f1-red" : "text-text-muted"
                  }`}
                >
                  {r.is_dnf ? `DNF · L${r.total_laps}` : r.status}
                </span>

                {/* Grid → Finish movement */}
                <span className="text-right">
                  <Movement delta={r.positions_gained} />
                </span>

                {/* Best lap */}
                <span
                  className={`text-right text-xs font-(family-name:--font-dm-mono) tabular-nums ${
                    r.fastest_lap ? "text-f1-purple font-semibold" : "text-text-secondary"
                  }`}
                >
                  {fmtTime(r.best_lap_time)}
                </span>

                {/* Avg lap */}
                <span className="text-right text-xs font-(family-name:--font-dm-mono) tabular-nums text-text-muted">
                  {fmtTime(r.avg_lap_time)}
                </span>

                {/* Points */}
                <span className="flex justify-end">
                  {r.points > 0 ? (
                    <span
                      className="min-w-7 rounded bg-surface-3 px-1.5 py-0.5 text-center
                                 font-(family-name:--font-orbitron) text-xs font-bold text-text-primary tabular-nums"
                    >
                      {r.points}
                    </span>
                  ) : (
                    <span className="text-text-dim text-xs">—</span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
