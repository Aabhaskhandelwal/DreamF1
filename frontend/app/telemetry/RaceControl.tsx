"use client"

import { useMemo, useState } from "react"

export interface RaceControlMessage {
  lap: number | null
  category: string
  flag: string | null
  scope: string | null
  kind: "safety" | "flag" | "steward" | "track_limits" | "drs" | "other"
  message: string
}

export interface RaceControlData {
  session: string
  summary: {
    total: number
    yellow_flags: number
    red_flags: number
    safety_car: number
    virtual_sc: number
    penalties: number
    investigations: number
    deleted_laps: number
  }
  messages: RaceControlMessage[]
}

const FLAG_COLOR: Record<string, string> = {
  GREEN: "#4ade80",
  YELLOW: "#facc15",
  "DOUBLE YELLOW": "#f59e0b",
  RED: "#ED1131",
  BLUE: "#3b82f6",
  CHEQUERED: "#e0e0e0",
  CLEAR: "#3f3f3f",
}

const KIND: Record<
  RaceControlMessage["kind"],
  { label: string; color: string; glyph: string }
> = {
  safety: { label: "Safety Car", color: "#facc15", glyph: "SC" },
  flag: { label: "Flags", color: "#4ade80", glyph: "⚑" },
  steward: { label: "Stewards", color: "#ED1131", glyph: "§" },
  track_limits: { label: "Track Limits", color: "#c084fc", glyph: "⊘" },
  drs: { label: "DRS", color: "#00D7B6", glyph: "DRS" },
  other: { label: "Other", color: "#5a5a5a", glyph: "•" },
}

/** Normalise kind — older backends may not send it; bucket those as "other". */
function kindOf(m: RaceControlMessage): RaceControlMessage["kind"] {
  return m.kind && m.kind in KIND ? m.kind : "other"
}

/** Accent colour for a message — flag colour wins, else the kind colour. */
function accentFor(m: RaceControlMessage): string {
  if (m.flag && FLAG_COLOR[m.flag]) return FLAG_COLOR[m.flag]
  return KIND[kindOf(m)].color
}

function SummaryChip({
  label,
  value,
  accent,
  highlight,
}: {
  label: string
  value: number
  accent: string
  highlight?: boolean
}) {
  const on = value > 0
  return (
    <div
      className="glass-card px-3 py-2.5 flex flex-col gap-1 transition-colors"
      style={{
        boxShadow: on ? `inset 2px 0 0 ${accent}` : undefined,
        borderColor: highlight && on ? `${accent}55` : undefined,
      }}
    >
      <span
        className="font-(family-name:--font-orbitron) text-lg font-bold tabular-nums leading-none"
        style={{ color: on ? accent : "#3a3a3a" }}
      >
        {value}
      </span>
      <span className="text-[0.5rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-muted leading-tight">
        {label}
      </span>
    </div>
  )
}

type Filter = "all" | RaceControlMessage["kind"]

export default function RaceControl({ data }: { data: RaceControlData }) {
  const s = data.summary
  const [filter, setFilter] = useState<Filter>("all")

  // Which kinds actually appear, with counts, to build the filter bar.
  const kindCounts = useMemo(() => {
    const c = new Map<RaceControlMessage["kind"], number>()
    for (const m of data.messages) {
      const k = kindOf(m)
      c.set(k, (c.get(k) ?? 0) + 1)
    }
    return c
  }, [data.messages])

  const filtered =
    filter === "all" ? data.messages : data.messages.filter((m) => kindOf(m) === filter)

  const filters: Filter[] = [
    "all",
    ...(["safety", "flag", "steward", "track_limits", "drs", "other"] as const).filter(
      (k) => kindCounts.get(k),
    ),
  ]

  return (
    <div className="space-y-5">
      {/* ── Incident summary ─────────────────────────────────── */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        <SummaryChip label="Yellow Periods" value={s.yellow_flags} accent="#facc15" />
        <SummaryChip label="Red Flags" value={s.red_flags} accent="#ED1131" highlight />
        <SummaryChip label="Safety Car" value={s.safety_car} accent="#facc15" highlight />
        <SummaryChip label="Virtual SC" value={s.virtual_sc} accent="#f59e0b" highlight />
        <SummaryChip label="Penalties" value={s.penalties} accent="#ED1131" />
        <SummaryChip label="Investigations" value={s.investigations} accent="#f59e0b" />
        <SummaryChip label="Deleted Laps" value={s.deleted_laps} accent="#c084fc" />
      </div>

      {/* ── Feed ─────────────────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        {/* filter bar */}
        <div className="flex flex-wrap items-center gap-1.5 px-3 py-2.5 border-b border-border-default bg-surface-1/40">
          {filters.map((f) => {
            const active = filter === f
            const meta = f === "all" ? null : KIND[f]
            const count = f === "all" ? data.messages.length : kindCounts.get(f) ?? 0
            const color = meta?.color ?? "#e0e0e0"
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="group flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6rem]
                           font-(family-name:--font-dm-mono) uppercase tracking-widest transition-all cursor-pointer"
                style={{
                  background: active ? `${color}1f` : "transparent",
                  border: `1px solid ${active ? `${color}66` : "var(--color-border-muted)"}`,
                  color: active ? color : "var(--color-text-muted)",
                }}
              >
                {meta && (
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: color, boxShadow: active ? `0 0 6px ${color}` : undefined }}
                  />
                )}
                {f === "all" ? "All" : meta!.label}
                <span className="tabular-nums opacity-60">{count}</span>
              </button>
            )
          })}
        </div>

        {/* messages */}
        <div className="max-h-[32rem] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs font-(family-name:--font-dm-mono) text-text-muted">
              No messages in this category.
            </p>
          ) : (
            filtered.map((m, i) => {
              const accent = accentFor(m)
              const meta = KIND[kindOf(m)]
              return (
                <div
                  key={i}
                  className="group flex items-start gap-3 px-4 py-2 border-b border-border-subtle last:border-0
                             hover:bg-surface-2/50 transition-colors"
                  style={{ boxShadow: `inset 2px 0 0 ${accent}` }}
                >
                  {/* lap */}
                  <span className="font-(family-name:--font-orbitron) text-[0.6rem] tabular-nums text-text-dim w-9 shrink-0 pt-0.5 text-right">
                    {m.lap != null ? `L${m.lap}` : "—"}
                  </span>

                  {/* kind glyph */}
                  <span
                    className="shrink-0 mt-px flex h-4 min-w-4 items-center justify-center rounded px-1
                               text-[0.5rem] font-(family-name:--font-dm-mono) font-bold uppercase"
                    style={{ background: `${accent}1f`, color: accent }}
                    title={meta.label}
                  >
                    {meta.glyph}
                  </span>

                  {/* message */}
                  <span className="flex-1 min-w-0 text-[0.72rem] font-(family-name:--font-dm-mono) text-text-secondary leading-relaxed">
                    {m.message}
                  </span>

                  {/* flag badge */}
                  {m.flag && m.flag !== "CLEAR" && m.flag !== "None" && (
                    <span
                      className="shrink-0 rounded-sm px-1.5 py-0.5 text-[0.5rem] font-(family-name:--font-dm-mono)
                                 uppercase tracking-widest"
                      style={{ color: accent, border: `1px solid ${accent}55` }}
                    >
                      {m.flag}
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
