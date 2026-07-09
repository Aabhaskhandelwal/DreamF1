import type { F1Event } from "./page"
import { FLAG_CODES } from "@/lib/trackData"

/**
 * Whole-season-at-a-glance: a segmented calendar bar (one tick per round) plus
 * completion stats. Pure server component — all data comes from the schedule
 * already fetched by the dashboard page.
 */
export default function SeasonProgress({
  events,
  completed,
  remaining,
  nextRace,
}: {
  events: F1Event[]
  completed: number
  remaining: number
  nextRace: F1Event | null
}) {
  const total = events.length
  const pct = total ? Math.round((completed / total) * 100) : 0
  const nextFlag = nextRace ? FLAG_CODES[nextRace.country] ?? "UN" : null

  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <div>
          <p className="section-label mb-2">2026 Season Progress</p>
          <p className="flex items-baseline gap-2">
            <span className="font-(family-name:--font-orbitron) text-3xl sm:text-4xl font-black text-text-primary tabular-nums leading-none">
              {completed}
            </span>
            <span className="font-(family-name:--font-orbitron) text-lg text-text-muted leading-none">/ {total}</span>
            <span className="text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-dim">
              rounds run
            </span>
          </p>
        </div>
        <div className="text-right">
          <span className="font-(family-name:--font-orbitron) text-2xl sm:text-3xl font-black text-text-primary tabular-nums leading-none">
            {pct}%
          </span>
          <p className="text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-dim mt-1">
            complete
          </p>
        </div>
      </div>

      {/* Segmented calendar — one tick per round */}
      <div className="flex items-stretch gap-[3px] h-9">
        {events.map((e, i) => {
          const done = i < completed
          const isNext = nextRace != null && e.round_number === nextRace.round_number
          return (
            <div
              key={e.id}
              title={`R${e.round_number} · ${e.event_name}`}
              className="flex-1 rounded-[2px] transition-all"
              style={{
                background: isNext
                  ? "var(--color-f1-red)"
                  : done
                    ? "rgba(237,17,49,0.45)"
                    : "var(--color-surface-3)",
                boxShadow: isNext ? "0 0 8px rgba(237,17,49,0.5)" : undefined,
              }}
            />
          )
        })}
      </div>

      {/* Footer stats */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <FootStat value={completed} label="Completed" />
        <FootStat value={remaining} label="Remaining" />
        <div className="flex items-center gap-2 min-w-0" style={{ boxShadow: "inset 2px 0 0 var(--color-border-muted)", paddingLeft: "0.6rem" }}>
          {nextFlag && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://flagsapi.com/${nextFlag}/flat/32.png`}
              alt={nextRace?.country ?? ""}
              className="h-4 w-auto rounded-sm shrink-0"
            />
          )}
          <div className="min-w-0">
            <p className="text-[0.5rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-dim leading-none mb-1">
              {nextRace ? `Next · R${nextRace.round_number}` : "Next"}
            </p>
            <p className="text-[0.66rem] font-(family-name:--font-dm-mono) text-text-secondary truncate leading-none">
              {nextRace?.event_name ?? "Season complete"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FootStat({ value, label, accent }: { value: number; label: string; accent?: string }) {
  return (
    <div
      className="pl-2.5"
      style={{ boxShadow: `inset 2px 0 0 ${accent ?? "var(--color-border-muted)"}` }}
    >
      <p className="font-(family-name:--font-orbitron) text-xl font-bold tabular-nums leading-none" style={{ color: accent ?? "var(--color-text-primary)" }}>
        {value}
      </p>
      <p className="text-[0.5rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-dim mt-1.5">
        {label}
      </p>
    </div>
  )
}
