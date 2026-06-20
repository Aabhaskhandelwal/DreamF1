"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import type { F1Event } from "./page"
import { FLAG_CODES, getTrackImage, parseUTC } from "@/lib/trackData"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getTimeLeft(ms: number): TimeLeft {
  const diff = ms - Date.now()
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

function CountdownUnit({ value, label, mounted }: { value: number; label: string; mounted: boolean }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: "3px" }}>
      <span
        className="font-(family-name:--font-orbitron) text-[3.25rem] sm:text-[4.5rem] md:text-[6rem] font-black
                   tabular-nums text-text-primary leading-none"
        suppressHydrationWarning
      >
        {mounted ? String(value).padStart(2, "0") : "--"}
      </span>
      <span className="text-[0.42rem] sm:text-[0.46rem] font-(family-name:--font-dm-mono) uppercase tracking-[0.22em] text-text-dim">
        {label}
      </span>
    </div>
  )
}

interface Props {
  event: F1Event
}

export default function NextRaceCard({ event }: Props) {
  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [now, setNow] = useState(0)

  const sessions = getSessions(event)

  // Find the next upcoming session; fall back to race date at noon UTC
  const raceDateFallback = new Date(event.event_date + "T12:00:00Z").getTime()
  const nextSession = sessions.find((s) => s.date.getTime() > (mounted ? Date.now() : 0))
  const countdownTarget = nextSession?.date.getTime() ?? raceDateFallback

  useEffect(() => {
    setMounted(true)
    setNow(Date.now())
    setTime(getTimeLeft(countdownTarget))
    const id = setInterval(() => {
      setNow(Date.now())
      setTime(getTimeLeft(countdownTarget))
    }, 1000)
    return () => clearInterval(id)
  }, [countdownTarget])

  const flagCode = FLAG_CODES[event.country] ?? "UN"
  const trackImage = getTrackImage(event.country, event.event_name)
  const formattedDate = new Date(event.event_date + "T12:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  })
  const nextLabel = nextSession ? `Next: ${nextSession.abbrev}` : "Race Weekend"

  // colon separator — scales proportionally with the digit size
  const sep = (
    <span
      className="font-(family-name:--font-orbitron) text-[1.75rem] sm:text-[2.5rem] md:text-[3.5rem]
                 font-black text-border-muted leading-none self-end mb-[0.7rem] sm:mb-[0.95rem] md:mb-[1.3rem]"
    >
      :
    </span>
  )

  return (
    <div className="glass-card-accent overflow-hidden h-full flex flex-col">
      <div className="flex flex-col lg:flex-row flex-1">
        {/* Left: race info + countdown + session schedule */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 flex flex-col justify-between gap-4 sm:gap-6">
          {/* Race header */}
          <div>
            <p className="section-label mb-2.5 text-f1-red">
              Round {event.round_number} · {nextLabel}
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

          {/* Giant countdown */}
          <div className="flex items-end gap-1 sm:gap-2 md:gap-3">
            <CountdownUnit value={time.days}    label="DAYS" mounted={mounted} />
            {sep}
            <CountdownUnit value={time.hours}   label="HRS"  mounted={mounted} />
            {sep}
            <CountdownUnit value={time.minutes} label="MIN"  mounted={mounted} />
            {sep}
            <CountdownUnit value={time.seconds} label="SEC"  mounted={mounted} />
          </div>

          {/* Session schedule */}
          {sessions.length > 0 && (
            <div className="space-y-0" suppressHydrationWarning>
              {sessions.map((s) => {
                const isPast = mounted && s.date.getTime() < now
                const isNext = mounted && !isPast && s === nextSession
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

        {/* Right: track image — desktop only */}
        {trackImage && (
          <div className="relative w-full lg:w-72 h-48 lg:h-auto shrink-0 opacity-30 lg:opacity-50">
            <Image
              src={trackImage}
              alt={`${event.country} circuit`}
              fill
              className="object-contain p-6"
            />
          </div>
        )}
      </div>
    </div>
  )
}
