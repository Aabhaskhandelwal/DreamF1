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

export default function QualiTimes({ results }: { results: QualiResult[] }) {
  // Fastest Q3 time for delta calculation
  const fastestQ3 = Math.min(...results.map((r) => r.Q3 ?? Infinity).filter((v) => v !== Infinity))

  return (
    <div className="glass-card overflow-hidden">
      <div
        className="grid text-[0.6rem] font-(family-name:--font-dm-mono) uppercase tracking-widest
                   text-text-muted px-4 py-2 border-b border-[#1e1e1e]"
        style={{ gridTemplateColumns: "2.5rem 4rem 5rem 5rem 5rem 5rem" }}
      >
        <span>POS</span>
        <span>DRIVER</span>
        <span className="text-right">Q1</span>
        <span className="text-right">Q2</span>
        <span className="text-right">Q3</span>
        <span className="text-right">DELTA</span>
      </div>

      {results.map((r, idx) => {
        const teamColor = TEAM_COLORS[r.Abbreviation] ?? "#333"
        const delta =
          r.Q3 !== null && isFinite(fastestQ3) && fastestQ3 !== Infinity
            ? r.Q3 - fastestQ3
            : null
        const isPole = idx === 0 && r.Q3 !== null

        return (
          <div
            key={r.Abbreviation}
            className="grid items-center px-4 py-2 border-b border-[#111] last:border-0 hover:bg-[#111] transition-colors"
            style={{
              gridTemplateColumns: "2.5rem 4rem 5rem 5rem 5rem 5rem",
              background: `linear-gradient(90deg, ${teamColor}18 0%, transparent 40%)`,
            }}
          >
            <span className="font-(family-name:--font-orbitron) text-sm font-bold text-text-primary">
              {idx + 1}
            </span>

            <span
              className="font-(family-name:--font-f1-regular) text-xs tracking-wider"
              style={{ color: teamColor }}
            >
              {r.Abbreviation}
              {isPole && (
                <span className="ml-1 text-[#c084fc] text-[0.5rem] align-super">P</span>
              )}
            </span>

            <span className="text-right text-xs font-(family-name:--font-dm-mono) text-text-muted">
              {fmtQ(r.Q1)}
            </span>
            <span className="text-right text-xs font-(family-name:--font-dm-mono) text-text-muted">
              {fmtQ(r.Q2)}
            </span>
            <span
              className={`text-right text-xs font-(family-name:--font-dm-mono) ${
                isPole ? "text-[#c084fc]" : "text-text-secondary"
              }`}
            >
              {fmtQ(r.Q3)}
            </span>
            <span className="text-right text-xs font-(family-name:--font-dm-mono) text-text-muted">
              {delta !== null ? (delta === 0 ? "POLE" : `+${delta.toFixed(3)}`) : "—"}
            </span>
          </div>
        )
      })}
    </div>
  )
}
