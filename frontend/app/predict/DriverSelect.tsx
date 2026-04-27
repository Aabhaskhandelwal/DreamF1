"use client"

import { useEffect, useRef, useState } from "react"
import { TEAM_COLORS } from "@/lib/design"

const TEAM_GROUPS = [
  { team: "Red Bull",     drivers: ["VER", "HAD"] },
  { team: "McLaren",      drivers: ["NOR", "PIA"] },
  { team: "Ferrari",      drivers: ["LEC", "HAM"] },
  { team: "Mercedes",     drivers: ["RUS", "ANT"] },
  { team: "Aston Martin", drivers: ["ALO", "STR"] },
  { team: "Alpine",       drivers: ["GAS", "COL"] },
  { team: "Williams",     drivers: ["ALB", "SAI"] },
  { team: "Racing Bulls", drivers: ["LAW", "LIN"] },
  { team: "Audi",         drivers: ["HUL", "BOR"] },
  { team: "Haas",         drivers: ["BEA", "OCO"] },
  { team: "Cadillac",     drivers: ["BOT", "PER"] },
]

interface Props {
  value: string | null
  onChange: (v: string | null) => void
  placeholder?: string
  optional?: boolean
  disabledCodes?: Set<string>
}

export default function DriverSelect({
  value,
  onChange,
  placeholder = "Driver",
  optional = false,
  disabledCodes,
}: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const color = value ? (TEAM_COLORS[value] ?? "#444") : "#444"

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-3 py-2 glass-card border border-border-default
                   hover:border-border-muted transition-colors text-left cursor-pointer"
      >
        <span
          className="w-1 h-5 rounded-full shrink-0 transition-colors"
          style={{ backgroundColor: color }}
        />
        {value ? (
          <span
            className="font-(family-name:--font-f1-regular) text-sm tracking-wider"
            style={{ color }}
          >
            {value}
          </span>
        ) : (
          <span className="text-text-dim text-xs font-(family-name:--font-dm-mono) uppercase tracking-widest">
            {placeholder}
          </span>
        )}
        <span className="ml-auto text-text-dim text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full glass-card border border-border-muted
                        shadow-2xl max-h-72 overflow-y-auto">
          {optional && (
            <button
              type="button"
              onClick={() => { onChange(null); setOpen(false) }}
              className="w-full px-3 py-2 text-left text-xs font-(family-name:--font-dm-mono)
                         text-text-dim hover:bg-border-subtle transition-colors uppercase tracking-widest"
            >
              — None
            </button>
          )}
          {TEAM_GROUPS.map(({ team, drivers }) => (
            <div key={team}>
              <div className="px-3 pt-2 pb-1 text-[0.55rem] font-(family-name:--font-dm-mono)
                              text-text-dim uppercase tracking-widest border-t border-[#111] first:border-0">
                {team}
              </div>
              {drivers.map((code) => {
                const c = TEAM_COLORS[code] ?? "#444"
                const isDisabled = disabledCodes?.has(code) ?? false
                return (
                  <button
                    key={code}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => { onChange(code); setOpen(false) }}
                    className="w-full flex items-center gap-3 px-3 py-2 transition-colors cursor-pointer
                               disabled:opacity-25 disabled:cursor-not-allowed
                               enabled:hover:bg-border-subtle"
                    style={{
                      background: value === code ? `${c}15` : undefined,
                    }}
                  >
                    <span className="w-1 h-4 rounded-full" style={{ backgroundColor: c }} />
                    <span
                      className="font-(family-name:--font-f1-regular) text-sm tracking-wider"
                      style={{ color: c }}
                    >
                      {code}
                    </span>
                    {value === code && (
                      <span className="ml-auto text-f1-red text-xs">✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
