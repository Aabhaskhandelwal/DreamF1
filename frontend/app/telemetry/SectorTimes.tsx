import { TEAM_COLORS } from "@/lib/design"

export interface SectorData {
  session: string
  drivers: Record<string, {
    s1: number | null
    s2: number | null
    s3: number | null
    s1_best: boolean
    s2_best: boolean
    s3_best: boolean
  }>
}

function fmtSec(s: number | null): string {
  if (s === null) return "—"
  return s.toFixed(3)
}

function fmtLap(s: number): string {
  const m = Math.floor(s / 60)
  const rem = (s % 60).toFixed(3).padStart(6, "0")
  return `${m}:${rem}`
}

function delta(t: number | null, best: number | null): string {
  if (t === null || best === null || t === best) return ""
  return `+${(t - best).toFixed(3)}`
}

export default function SectorTimes({ data }: { data: SectorData }) {
  const entries = Object.entries(data.drivers)

  // Best (overall purple) time per sector
  const bestS1 = Math.min(...entries.map(([, d]) => d.s1 ?? Infinity))
  const bestS2 = Math.min(...entries.map(([, d]) => d.s2 ?? Infinity))
  const bestS3 = Math.min(...entries.map(([, d]) => d.s3 ?? Infinity))

  // Who holds each purple sector
  const holder = (best: number, key: "s1" | "s2" | "s3") =>
    entries.find(([, d]) => d[key] === best)?.[0]
  const holders = {
    s1: holder(bestS1, "s1"),
    s2: holder(bestS2, "s2"),
    s3: holder(bestS3, "s3"),
  }

  // The theoretical "ideal lap" — sum of the three purple sectors
  const idealLap =
    isFinite(bestS1) && isFinite(bestS2) && isFinite(bestS3)
      ? bestS1 + bestS2 + bestS3
      : null

  // Sort by each driver's own theoretical best (s1+s2+s3)
  const sorted = entries
    .map(([code, d]) => ({
      code,
      d,
      total: (d.s1 ?? 0) + (d.s2 ?? 0) + (d.s3 ?? 0),
    }))
    .sort((a, b) => a.total - b.total)

  const cols = "2rem 4rem repeat(3, 1fr) 5rem"

  function SectorCell({
    t,
    isBest,
    best,
  }: {
    t: number | null
    isBest: boolean
    best: number
  }) {
    const off = t !== null && isFinite(best) ? t - best : null
    // Bar fades from full (purple holder) to short (slow) — caps gap at 0.6s
    const fill = off !== null ? 1 - Math.min(off, 0.6) / 0.6 : 0
    return (
      <div className="text-right pr-1">
        <span
          className={`text-xs font-(family-name:--font-dm-mono) tabular-nums ${
            t === null
              ? "text-text-dim"
              : isBest
                ? "text-f1-purple font-semibold"
                : "text-text-secondary"
          }`}
        >
          {fmtSec(t)}
        </span>
        {t !== null && (
          <>
            {!isBest && (
              <span className="block text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim">
                {delta(t, best)}
              </span>
            )}
            <span className="mt-1 ml-auto block h-[2px] w-full max-w-16 rounded-full bg-surface-3 overflow-hidden">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${Math.max(fill * 100, 4)}%`,
                  marginLeft: "auto",
                  background: isBest ? "var(--color-f1-purple)" : "var(--color-text-muted)",
                }}
              />
            </span>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Ideal lap card ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
        <div className="relative overflow-hidden rounded-md border border-f1-purple/30 bg-surface-1/80 px-4 py-3"
             style={{ boxShadow: "inset 3px 0 0 var(--color-f1-purple)" }}>
          <p className="section-label leading-none mb-1.5 text-f1-purple/80">Ideal Lap</p>
          <span className="font-(family-name:--font-orbitron) text-xl font-bold text-f1-purple tabular-nums">
            {idealLap !== null ? fmtLap(idealLap) : "—"}
          </span>
          <p className="mt-1 text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-wider text-text-dim">
            Sum of all purple sectors
          </p>
        </div>

        {(["s1", "s2", "s3"] as const).map((key, i) => {
          const best = [bestS1, bestS2, bestS3][i]
          const who = holders[key]
          const color = who ? TEAM_COLORS[who] ?? "#fff" : "#444"
          return (
            <div
              key={key}
              className="rounded-md border border-border-default bg-surface-1/80 px-4 py-3"
              style={{ boxShadow: `inset 3px 0 0 ${color}` }}
            >
              <p className="section-label leading-none mb-1.5">Best Sector {i + 1}</p>
              <div className="flex items-baseline gap-1.5">
                <span
                  className="font-(family-name:--font-f1-regular) text-sm font-bold tracking-wider"
                  style={{ color }}
                >
                  {who ?? "—"}
                </span>
                <span className="font-(family-name:--font-orbitron) text-sm font-bold text-f1-purple tabular-nums">
                  {isFinite(best) ? best.toFixed(3) : "—"}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Sector grid ──────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <div className="glass-card overflow-hidden min-w-120">
          <div
            className="grid text-[0.6rem] font-(family-name:--font-dm-mono) uppercase tracking-widest
                       text-text-muted px-4 py-2.5 border-b border-border-default bg-surface-1/40"
            style={{ gridTemplateColumns: cols }}
          >
            <span>#</span>
            <span>Driver</span>
            <span className="text-right pr-1">Sector 1</span>
            <span className="text-right pr-1">Sector 2</span>
            <span className="text-right pr-1">Sector 3</span>
            <span className="text-right">Theoretical</span>
          </div>

          {sorted.map(({ code, d, total }, i) => {
            const teamColor = TEAM_COLORS[code] ?? "#333"
            return (
              <div
                key={code}
                className="group grid items-center px-4 py-2 border-b border-border-subtle last:border-0
                           hover:bg-surface-2/60 transition-colors"
                style={{
                  gridTemplateColumns: cols,
                  background: `linear-gradient(90deg, ${teamColor}14 0%, transparent 38%)`,
                }}
              >
                <span className="font-(family-name:--font-dm-mono) text-xs text-text-dim tabular-nums">
                  {i + 1}
                </span>

                <span className="flex items-center gap-2">
                  <span
                    className="h-5 w-[3px] rounded-full"
                    style={{ background: teamColor, boxShadow: `0 0 8px ${teamColor}99` }}
                  />
                  <span
                    className="font-(family-name:--font-f1-regular) text-sm font-bold tracking-wider"
                    style={{ color: teamColor }}
                  >
                    {code}
                  </span>
                </span>

                <SectorCell t={d.s1} isBest={d.s1_best} best={bestS1} />
                <SectorCell t={d.s2} isBest={d.s2_best} best={bestS2} />
                <SectorCell t={d.s3} isBest={d.s3_best} best={bestS3} />

                {/* Theoretical best */}
                <div className="text-right">
                  <span
                    className={`text-xs font-(family-name:--font-dm-mono) tabular-nums ${
                      i === 0 ? "text-f1-green font-semibold" : "text-text-secondary"
                    }`}
                  >
                    {total > 0 ? total.toFixed(3) : "—"}
                  </span>
                  {i > 0 && total > 0 && (
                    <span className="block text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim">
                      {delta(total, sorted[0].total)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
