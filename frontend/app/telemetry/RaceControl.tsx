"use client"

export interface RaceControlMessage {
  lap: number | null
  category: string
  flag: string | null
  scope: string | null
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

/** Accent colour for a message — flag first, then keyword heuristics. */
function accentFor(m: RaceControlMessage): string {
  if (m.flag && FLAG_COLOR[m.flag]) return FLAG_COLOR[m.flag]
  const u = m.message.toUpperCase()
  if (u.includes("PENALTY")) return "#ED1131"
  if (u.includes("INVESTIGAT")) return "#f59e0b"
  if (u.includes("DELETED")) return "#c084fc"
  if (u.includes("SAFETY CAR")) return "#facc15"
  if (u.includes("DRS")) return "#00D7B6"
  return "#3f3f3f"
}

function SummaryChip({ label, value, accent }: { label: string; value: number; accent: string }) {
  const on = value > 0
  return (
    <div
      className="glass-card px-3 py-2.5 flex flex-col gap-1"
      style={{ boxShadow: on ? `inset 2px 0 0 ${accent}` : undefined }}
    >
      <span className="font-(family-name:--font-orbitron) text-lg font-bold tabular-nums" style={{ color: on ? accent : "#444" }}>
        {value}
      </span>
      <span className="text-[0.5rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-muted leading-tight">
        {label}
      </span>
    </div>
  )
}

export default function RaceControl({ data }: { data: RaceControlData }) {
  const s = data.summary
  return (
    <div className="space-y-5">
      {/* summary */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        <SummaryChip label="Yellow Flags" value={s.yellow_flags} accent="#facc15" />
        <SummaryChip label="Red Flags" value={s.red_flags} accent="#ED1131" />
        <SummaryChip label="Safety Car" value={s.safety_car} accent="#facc15" />
        <SummaryChip label="Virtual SC" value={s.virtual_sc} accent="#f59e0b" />
        <SummaryChip label="Penalties" value={s.penalties} accent="#ED1131" />
        <SummaryChip label="Investigations" value={s.investigations} accent="#f59e0b" />
        <SummaryChip label="Deleted Laps" value={s.deleted_laps} accent="#c084fc" />
      </div>

      {/* feed */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
          <p className="section-label">Race Control · {data.summary.total} messages</p>
        </div>
        <div className="max-h-[30rem] overflow-y-auto">
          {data.messages.map((m, i) => {
            const accent = accentFor(m)
            return (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-2 border-b border-border-subtle last:border-0"
                style={{ boxShadow: `inset 2px 0 0 ${accent}` }}
              >
                <span className="font-(family-name:--font-orbitron) text-[0.6rem] tabular-nums text-text-dim w-9 shrink-0 pt-0.5">
                  {m.lap != null ? `L${m.lap}` : "—"}
                </span>
                <span className="flex-1 min-w-0 text-[0.7rem] font-(family-name:--font-dm-mono) text-text-secondary leading-relaxed">
                  {m.message}
                </span>
                {m.flag && m.flag !== "CLEAR" && (
                  <span
                    className="text-[0.5rem] font-(family-name:--font-dm-mono) uppercase tracking-widest px-1.5 py-0.5 rounded-sm shrink-0"
                    style={{ color: accent, border: `1px solid ${accent}55` }}
                  >
                    {m.flag}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
