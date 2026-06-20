"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import type { F1Event } from "./page"
import { FLAG_CODES, parseUTC } from "@/lib/trackData"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getTimeLeft(target: number, now: number): TimeLeft {
  const diff = target - now
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

export function abbrevSession(name: string): string {
  const n = name.toLowerCase()
  if (n === "race") return "RACE"
  if (n.includes("practice 1")) return "FP1"
  if (n.includes("practice 2")) return "FP2"
  if (n.includes("practice 3")) return "FP3"
  if (n.includes("sprint shootout") || n.includes("sprint qualifying")) return "SQ"
  if (n.includes("sprint")) return "SPRINT"
  if (n.includes("qualifying")) return "QUALI"
  return name.toUpperCase()
}

interface Session {
  name: string
  abbrev: string
  date: Date
}

function getSessions(event: F1Event): Session[] {
  return [1, 2, 3, 4, 5]
    .map((i) => {
      const name = event[`session${i}_name` as keyof F1Event] as string | null
      const raw = event[`session${i}_date` as keyof F1Event] as string | null
      const date = parseUTC(raw)
      if (!name || !date) return null
      return { name, abbrev: abbrevSession(name), date }
    })
    .filter(Boolean) as Session[]
}

function CountdownUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: "3px" }}>
      <span
        className="font-(family-name:--font-orbitron) text-[3.25rem] sm:text-[4.5rem] md:text-[6rem] font-black
                   tabular-nums text-text-primary leading-none"
      >
        {value}
      </span>
      <span className="text-[0.42rem] sm:text-[0.46rem] font-(family-name:--font-dm-mono) uppercase tracking-[0.22em] text-text-dim">
        {label}
      </span>
    </div>
  )
}

const SEP = (
  <span
    className="font-(family-name:--font-orbitron) text-[1.75rem] sm:text-[2.5rem] md:text-[3.5rem]
               font-black text-border-muted leading-none self-end mb-[0.7rem] sm:mb-[0.95rem] md:mb-[1.3rem]"
  >
    :
  </span>
)

/**
 * Isolated ticker. This is the ONLY part of the card that holds the per-second
 * clock, so only the digits re-render each second — the surrounding header,
 * schedule and CTA render once and never flicker. Computing the next session
 * from the live clock also lets the countdown roll over to the following
 * session at each boundary without the parent re-rendering.
 */
function Countdown({ sessions, fallback }: { sessions: Session[]; fallback: number }) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const nextSession = now === null ? undefined : sessions.find((s) => s.date.getTime() > now)
  const target = nextSession?.date.getTime() ?? fallback
  const t = now === null ? null : getTimeLeft(target, now)
  const fmt = (n: number) => String(n).padStart(2, "0")

  return (
    <div className="space-y-2" suppressHydrationWarning>
      <p className="text-[0.58rem] font-(family-name:--font-dm-mono) uppercase tracking-[0.2em] text-f1-red h-3">
        {nextSession ? `Counting down to ${nextSession.abbrev}` : ""}
      </p>
      <div className="flex items-end gap-1 sm:gap-2 md:gap-3">
        <CountdownUnit value={t ? fmt(t.days) : "--"} label="DAYS" />
        {SEP}
        <CountdownUnit value={t ? fmt(t.hours) : "--"} label="HRS" />
        {SEP}
        <CountdownUnit value={t ? fmt(t.minutes) : "--"} label="MIN" />
        {SEP}
        <CountdownUnit value={t ? fmt(t.seconds) : "--"} label="SEC" />
      </div>
    </div>
  )
}

interface Props {
  event: F1Event
}

export default function NextRaceCard({ event }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const sessions = getSessions(event)
  const fallback = new Date(event.event_date + "T12:00:00Z").getTime()
  const nowAtRender = mounted ? Date.now() : 0
  const nextSession = sessions.find((s) => s.date.getTime() > nowAtRender)

  const flagCode = FLAG_CODES[event.country] ?? "UN"
  const formattedDate = new Date(event.event_date + "T12:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  })

  return (
    <div className="glass-card-accent overflow-hidden h-full flex flex-col">
      <div className="flex-1 p-4 sm:p-6 md:p-8 flex flex-col justify-between gap-4 sm:gap-6">
        {/* Race header */}
        <div>
          <p className="section-label mb-2.5 text-f1-red">
            Round {event.round_number} · Race Weekend
          </p>
          <div className="flex items-center gap-3 mb-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://flagsapi.com/${flagCode}/flat/32.png`}
              alt={event.country}
              className="h-5 w-auto rounded-sm"
            />
            <h2
              className="font-(family-name:--font-orbitron) text-xl sm:text-2xl md:text-3xl font-bold
                         tracking-wide text-text-primary leading-tight"
            >
              {event.event_name}
            </h2>
          </div>
          <p className="text-text-muted text-xs font-(family-name:--font-dm-mono)">
            {event.country} · {formattedDate}
          </p>
        </div>

        {/* Giant countdown — isolated ticker */}
        <Countdown sessions={sessions} fallback={fallback} />

        {/* Session schedule */}
        {sessions.length > 0 && (
          <div className="space-y-0" suppressHydrationWarning>
            {sessions.map((s) => {
              const isPast = mounted && s.date.getTime() < nowAtRender
              const isNext = mounted && s === nextSession
              return (
                <div
                  key={s.name}
                  className={`flex items-center justify-between py-1.5 px-2 border-b border-border-subtle
                              ${isPast ? "opacity-25" : ""}`}
                >
                  <span
                    className={`text-[0.62rem] font-(family-name:--font-dm-mono) uppercase tracking-widest
                                ${isNext ? "text-f1-red" : isPast ? "text-text-dim" : "text-text-muted"}`}
                  >
                    {s.abbrev}
                    {isNext && <span className="ml-2 text-[0.48rem] text-f1-red">▶ NEXT</span>}
                  </span>
                  <span className="text-[0.62rem] font-(family-name:--font-dm-mono) text-text-dim tabular-nums">
                    {mounted
                      ? s.date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
                        + " · "
                        + s.date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* CTA — suppressed until mounted to avoid hydration mismatch */}
        {!mounted ? null : sessions[0] && sessions[0].date.getTime() < Date.now() ? (
          <span
            className="self-start px-5 py-2.5 text-xs font-(family-name:--font-dm-mono)
                       uppercase tracking-widest text-text-dim border border-border-subtle
                       opacity-50 cursor-not-allowed"
          >
            Predictions Closed
          </span>
        ) : (
          <Link
            href="/predict"
            className="self-start px-5 py-2.5 bg-f1-red text-white text-xs
                       font-(family-name:--font-dm-mono) uppercase tracking-widest
                       hover:bg-f1-red-dark transition-colors"
          >
            Lock Prediction →
          </Link>
        )}
      </div>
    </div>
  )
}
