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

function delta(t: number | null, best: number | null): string {
  if (t === null || best === null || t === best) return ""
  return `+${(t - best).toFixed(3)}`
}

export default function SectorTimes({ data }: { data: SectorData }) {
  const entries = Object.entries(data.drivers)

  // Best time per sector for delta calculation
  const bestS1 = Math.min(...entries.map(([, d]) => d.s1 ?? Infinity))
  const bestS2 = Math.min(...entries.map(([, d]) => d.s2 ?? Infinity))
  const bestS3 = Math.min(...entries.map(([, d]) => d.s3 ?? Infinity))

  // Sort by theoretical best (s1+s2+s3)
  const sorted = entries
    .map(([code, d]) => ({
      code,
      d,
      total: (d.s1 ?? 0) + (d.s2 ?? 0) + (d.s3 ?? 0),
    }))
    .sort((a, b) => a.total - b.total)

  function cellClass(isBest: boolean, t: number | null): string {
    if (t === null) return "text-text-dim"
    if (isBest) return "text-f1-purple font-semibold"
    return "text-text-secondary"
  }

  return (
    <div className="overflow-x-auto">
      <div className="glass-card overflow-hidden min-w-120">
        {/* Header */}
        <div
          className="grid text-[0.6rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-muted px-4 py-2 border-b border-[#1e1e1e]"
          style={{ gridTemplateColumns: "2rem 4rem repeat(3, 1fr) 1fr" }}
        >
          <span>#</span>
          <span>Driver</span>
          <span className="text-right">S1</span>
          <span className="text-right">S2</span>
          <span className="text-right">S3</span>
          <span className="text-right">Theoretical</span>
        </div>

        {sorted.map(({ code, d, total }, i) => {
          const teamColor = TEAM_COLORS[code] ?? "#333"
          return (
            <div
              key={code}
              className="grid items-center px-4 py-2 border-b border-[#111] last:border-0 hover:bg-[#111] transition-colors"
              style={{
                gridTemplateColumns: "2rem 4rem repeat(3, 1fr) 1fr",
                background: `linear-gradient(90deg, ${teamColor}12 0%, transparent 35%)`,
              }}
            >
              <span className="font-(family-name:--font-dm-mono) text-xs text-text-dim">{i + 1}</span>

              <span
                className="font-(family-name:--font-f1-regular) text-xs font-bold tracking-wider"
                style={{ color: teamColor }}
              >
                {code}
              </span>

              {/* S1 */}
              <div className="text-right">
                <span className={`text-xs font-(family-name:--font-dm-mono) ${cellClass(d.s1_best, d.s1)}`}>
                  {fmtSec(d.s1)}
                </span>
                {!d.s1_best && d.s1 !== null && (
                  <span className="block text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim">
                    {delta(d.s1, bestS1)}
                  </span>
                )}
              </div>

              {/* S2 */}
              <div className="text-right">
                <span className={`text-xs font-(family-name:--font-dm-mono) ${cellClass(d.s2_best, d.s2)}`}>
                  {fmtSec(d.s2)}
                </span>
                {!d.s2_best && d.s2 !== null && (
                  <span className="block text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim">
                    {delta(d.s2, bestS2)}
                  </span>
                )}
              </div>

              {/* S3 */}
              <div className="text-right">
                <span className={`text-xs font-(family-name:--font-dm-mono) ${cellClass(d.s3_best, d.s3)}`}>
                  {fmtSec(d.s3)}
                </span>
                {!d.s3_best && d.s3 !== null && (
                  <span className="block text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim">
                    {delta(d.s3, bestS3)}
                  </span>
                )}
              </div>

              {/* Theoretical best */}
              <div className="text-right">
                <span className="text-xs font-(family-name:--font-dm-mono) text-text-secondary">
                  {total > 0 ? fmtSec(total) : "—"}
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
  )
}
