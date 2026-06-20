import { TEAM_COLORS } from "@/lib/design"

export interface QualiResult {
  Abbreviation: string
  Q1: number | null
  Q2: number | null
  Q3: number | null
}

function fmtQ(s: number | null): string {
  if (!s) return "—"
  const m = Math.floor(s / 60)
  const rem = (s % 60).toFixed(3).padStart(6, "0")
  return `${m}:${rem}`
}

/** Which knockout segment a driver was eliminated in / reached. */
function segmentOf(r: QualiResult): "Q3" | "Q2" | "Q1" {
  if (r.Q3 !== null) return "Q3"
  if (r.Q2 !== null) return "Q2"
  return "Q1"
}

const SEGMENTS: Record<"Q3" | "Q2" | "Q1", { label: string; color: string }> = {
  Q3: { label: "Q3 · POLE SHOOTOUT", color: "var(--color-f1-purple)" },
  Q2: { label: "Q2 · ELIMINATED 11–15", color: "#facc15" },
  Q1: { label: "Q1 · ELIMINATED 16+", color: "var(--color-f1-red)" },
}

export default function QualiTimes({ results }: { results: QualiResult[] }) {
  const q3Times = results.map((r) => r.Q3 ?? Infinity).filter((v) => v !== Infinity)
  const fastestQ3 = q3Times.length ? Math.min(...q3Times) : Infinity
  const sortedQ3 = [...q3Times].sort((a, b) => a - b)
  const poleGap = sortedQ3.length > 1 ? sortedQ3[1] - sortedQ3[0] : null

  const pole = results[0]
  const poleColor = pole ? TEAM_COLORS[pole.Abbreviation] ?? "#fff" : "#444"
  const cols = "0.25rem 2.25rem 4rem 1fr 5rem 5rem 5rem 5.5rem"

  let lastSeg: "Q3" | "Q2" | "Q1" | null = null

  return (
    <div className="space-y-4">
      {/* ── Pole strip ───────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-md border border-border-default bg-surface-1/80 px-4 py-3"
        style={{ boxShadow: `inset 3px 0 0 ${poleColor}` }}
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <p className="section-label leading-none mb-1.5">Pole Position</p>
            <div className="flex items-baseline gap-2">
              <span
                className="font-(family-name:--font-f1-regular) text-xl font-bold tracking-wider"
                style={{ color: poleColor }}
              >
                {pole?.Abbreviation ?? "—"}
              </span>
              <span className="font-(family-name:--font-orbitron) text-base font-bold text-f1-purple tabular-nums">
                {fmtQ(pole?.Q3 ?? null)}
              </span>
            </div>
          </div>
          {poleGap !== null && (
            <div className="border-l border-border-muted pl-6">
              <p className="section-label leading-none mb-1.5">Margin to P2</p>
              <span className="font-(family-name:--font-orbitron) text-base font-bold text-text-primary tabular-nums">
                +{poleGap.toFixed(3)}s
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Knockout table ───────────────────────────────────── */}
      <div className="overflow-x-auto">
        <div className="glass-card overflow-hidden min-w-md">
          <div
            className="grid text-[0.6rem] font-(family-name:--font-dm-mono) uppercase tracking-widest
                       text-text-muted px-3 py-2.5 border-b border-border-default bg-surface-1/40"
            style={{ gridTemplateColumns: cols }}
          >
            <span />
            <span>POS</span>
            <span>DRIVER</span>
            <span />
            <span className="text-right">Q1</span>
            <span className="text-right">Q2</span>
            <span className="text-right">Q3</span>
            <span className="text-right">GAP</span>
          </div>

          {results.map((r, idx) => {
            const teamColor = TEAM_COLORS[r.Abbreviation] ?? "#333"
            const seg = segmentOf(r)
            const delta =
              r.Q3 !== null && isFinite(fastestQ3) ? r.Q3 - fastestQ3 : null
            const isPole = idx === 0 && r.Q3 !== null
            const showSeg = seg !== lastSeg
            lastSeg = seg

            return (
              <div key={r.Abbreviation}>
                {showSeg && (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 bg-surface-0/60 border-b border-border-subtle"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: SEGMENTS[seg].color, boxShadow: `0 0 6px ${SEGMENTS[seg].color}` }}
                    />
                    <span
                      className="font-(family-name:--font-dm-mono) text-[0.58rem] font-bold uppercase tracking-[0.18em]"
                      style={{ color: SEGMENTS[seg].color }}
                    >
                      {SEGMENTS[seg].label}
                    </span>
                  </div>
                )}

                <div
                  className="group grid items-center px-3 py-2 border-b border-border-subtle hover:bg-surface-2/60 transition-colors"
                  style={{
                    gridTemplateColumns: cols,
                    background: `linear-gradient(90deg, ${teamColor}1f 0%, transparent 42%)`,
                  }}
                >
                  {/* Team stripe */}
                  <span
                    className="h-6 w-[3px] rounded-full transition-all group-hover:h-7"
                    style={{ background: teamColor, boxShadow: `0 0 8px ${teamColor}99` }}
                  />

                  <span
                    className={`font-(family-name:--font-orbitron) text-sm font-bold tabular-nums ${
                      isPole ? "text-f1-purple" : "text-text-secondary"
                    }`}
                  >
                    {idx + 1}
                  </span>

                  <span
                    className="font-(family-name:--font-f1-regular) text-sm font-bold tracking-wider"
                    style={{ color: teamColor }}
                  >
                    {r.Abbreviation}
                    {isPole && (
                      <span className="ml-1 align-super text-[0.5rem] font-bold text-f1-purple">P</span>
                    )}
                  </span>

                  {/* Delta-to-pole bar (visual pace gap) */}
                  <span className="hidden sm:flex items-center pr-3">
                    {delta !== null && (
                      <span
                        className="h-[3px] rounded-full"
                        style={{
                          width: `${Math.min(delta, 2) / 2 * 100}%`,
                          minWidth: delta === 0 ? "0" : "3px",
                          background: isPole ? "var(--color-f1-purple)" : teamColor,
                          opacity: isPole ? 1 : 0.5,
                        }}
                      />
                    )}
                  </span>

                  <span className="text-right text-xs font-(family-name:--font-dm-mono) tabular-nums text-text-muted">
                    {fmtQ(r.Q1)}
                  </span>
                  <span className="text-right text-xs font-(family-name:--font-dm-mono) tabular-nums text-text-muted">
                    {fmtQ(r.Q2)}
                  </span>
                  <span
                    className={`text-right text-xs font-(family-name:--font-dm-mono) tabular-nums ${
                      isPole ? "text-f1-purple font-semibold" : "text-text-secondary"
                    }`}
                  >
                    {fmtQ(r.Q3)}
                  </span>
                  <span
                    className={`text-right text-xs font-(family-name:--font-dm-mono) tabular-nums ${
                      delta === 0 ? "text-f1-purple font-semibold" : "text-text-muted"
                    }`}
                  >
                    {delta !== null ? (delta === 0 ? "POLE" : `+${delta.toFixed(3)}`) : "—"}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
