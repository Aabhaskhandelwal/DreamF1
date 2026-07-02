"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import type { F1Event } from "./page"
import { FLAG_CODES, parseUTC } from "@/lib/trackData"
import { getCircuitFacts } from "@/lib/circuits"

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
    <div
      className="flex flex-col items-center rounded-md border border-border-default bg-surface-2/70
                 px-2.5 sm:px-4 md:px-5 pt-1.5 pb-1 sm:pt-2.5 sm:pb-1.5
                 min-w-[3.1rem] sm:min-w-[4.4rem] md:min-w-[5.4rem]"
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 8px rgba(0,0,0,0.35)" }}
    >
      <span
        className="font-(family-name:--font-orbitron) text-[2.6rem] sm:text-[3.75rem] md:text-[4.75rem] font-black
                   tabular-nums text-text-primary leading-none"
      >
        {value}
      </span>
      <span className="mt-1 text-[0.4rem] sm:text-[0.46rem] font-(family-name:--font-dm-mono) uppercase tracking-[0.22em] text-text-dim">
        {label}
      </span>
    </div>
  )
}

const SEP = (
  <span
    className="font-(family-name:--font-orbitron) text-[1.6rem] sm:text-[2.4rem] md:text-[3.25rem]
               font-black text-f1-red/45 leading-none self-center"
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
    <div className="space-y-2.5" suppressHydrationWarning>
      <p className="flex items-center gap-2 text-[0.58rem] font-(family-name:--font-dm-mono) uppercase tracking-[0.2em] text-f1-red h-3">
        {nextSession && (
          <>
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-f1-red opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-f1-red" />
            </span>
            {`Counting down to ${nextSession.abbrev}`}
          </>
        )}
      </p>
      <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3">
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
  const facts = getCircuitFacts(event.country, event.event_name)
  const lockSession = sessions[0] // picks lock when the first session (FP1) starts

  return (
    <div className="glass-card-accent relative overflow-hidden h-full flex flex-col">
      {/* Ambient red bloom — depth without re-adding the track map */}
      <div
        aria-hidden
        className="absolute -top-24 -right-20 w-80 h-80 rounded-full opacity-[0.09] blur-[90px] pointer-events-none"
        style={{ background: "radial-gradient(circle, #ED1131 0%, transparent 70%)" }}
      />

      {/* Decorative circuit ribbon — draws in, then a car light laps it forever */}
      <svg
        aria-hidden
        viewBox="0 0 280 140"
        className="absolute -right-6 top-3 w-64 sm:w-80 pointer-events-none select-none opacity-[0.16] hidden sm:block"
      >
        <path
          id="hero-track"
          d="M20,60 C20,30 50,20 90,20 L200,20 C230,20 240,35 220,45 L160,70 C145,77 150,95 170,95 L240,95 C270,95 270,120 240,120 L60,120 C30,120 20,90 20,60 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth={2}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          className="track-draw"
        />
        <circle r={3.5} fill="#ED1131">
          <animateMotion
            dur="9s"
            repeatCount="indefinite"
            begin="2.2s"
            path="M20,60 C20,30 50,20 90,20 L200,20 C230,20 240,35 220,45 L160,70 C145,77 150,95 170,95 L240,95 C270,95 270,120 240,120 L60,120 C30,120 20,90 20,60 Z"
          />
        </circle>
      </svg>
      <div className="relative flex-1 p-4 sm:p-6 md:p-8 flex flex-col justify-between gap-4 sm:gap-6">
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
            {facts?.name ? `${facts.name} · ` : ""}{event.country} · {formattedDate}
          </p>

          {/* Circuit facts strip */}
          {facts && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3">
              <Fact label="Length" value={`${facts.length_km} km`} />
              <Fact label="Laps" value={`${facts.laps}`} />
              <Fact label="Distance" value={`${Math.round(facts.length_km * facts.laps)} km`} />
              <Fact label="First GP" value={`${facts.first_gp}`} />
            </div>
          )}
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
                  className={`flex items-center justify-between py-1.5 px-2 border-b border-border-subtle transition-colors
                              ${isPast ? "opacity-25" : ""} ${isNext ? "bg-f1-red/[0.07]" : ""}`}
                  style={isNext ? { boxShadow: "inset 2px 0 0 var(--color-f1-red)" } : undefined}
                >
                  <span
                    className={`text-[0.62rem] font-(family-name:--font-dm-mono) uppercase tracking-widest
                                ${isNext ? "text-f1-red font-bold" : isPast ? "text-text-dim" : "text-text-muted"}`}
                  >
                    {s.abbrev}
                    {isNext && <span className="ml-2 text-[0.48rem] text-f1-red">▶ NEXT</span>}
                  </span>
                  <span className={`text-[0.62rem] font-(family-name:--font-dm-mono) tabular-nums ${isNext ? "text-text-secondary" : "text-text-dim"}`}>
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
        {!mounted ? null : lockSession && lockSession.date.getTime() < Date.now() ? (
          <span
            className="self-start px-5 py-2.5 text-xs font-(family-name:--font-dm-mono)
                       uppercase tracking-widest text-text-dim border border-border-subtle
                       opacity-50 cursor-not-allowed"
          >
            Predictions Closed
          </span>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Link
              href="/predict"
              className="self-start px-5 py-2.5 bg-f1-red text-white text-xs
                         font-(family-name:--font-dm-mono) uppercase tracking-widest
                         hover:bg-f1-red-dark transition-colors"
            >
              Lock Prediction →
            </Link>
            {mounted && lockSession && (
              <p className="text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest">
                Picks lock at {lockSession.abbrev} ·{" "}
                {lockSession.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                {", "}
                {lockSession.date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[0.46rem] font-(family-name:--font-dm-mono) uppercase tracking-[0.18em] text-text-dim leading-none">
        {label}
      </span>
      <span className="font-(family-name:--font-orbitron) text-sm font-bold text-text-secondary tabular-nums leading-none">
        {value}
      </span>
    </div>
  )
}
