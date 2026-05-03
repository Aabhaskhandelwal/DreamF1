"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import type { F1Event } from "./page"

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

// Backend stores session dates as naive UTC — append Z so the browser parses as UTC
function parseUTC(iso: string | null): Date | null {
  if (!iso) return null
  return new Date(iso.endsWith("Z") ? iso : iso + "Z")
}

function abbrevSession(name: string): string {
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

const FLAG_CODES: Record<string, string> = {
  Australia: "AU", Bahrain: "BH", "Saudi Arabia": "SA", Japan: "JP",
  China: "CN", "United States": "US", Italy: "IT", Monaco: "MC",
  Spain: "ES", Canada: "CA", Austria: "AT", "Great Britain": "GB", "United Kingdom": "GB",
  Hungary: "HU", Belgium: "BE", Netherlands: "NL", Azerbaijan: "AZ",
  Singapore: "SG", Mexico: "MX", Brazil: "BR", Qatar: "QA",
  "Abu Dhabi": "AE", "United Arab Emirates": "AE",
}

const TRACK_IMAGES: Record<string, string> = {
  Australia: "Australia", Bahrain: "Bahrain", "Saudi Arabia": "SaudiArabia",
  Japan: "Japan", China: "China", Monaco: "Monaco", Spain: "Spain",
  Canada: "Canada", Austria: "Austria", "Great Britain": "UnitedKingdom", "United Kingdom": "UnitedKingdom",
  Hungary: "Hungary", Belgium: "Belgium", Netherlands: "Netherlands",
  Azerbaijan: "Azerbaijan", Singapore: "Singapore", Mexico: "Mexico",
  Brazil: "Brazil", Qatar: "Qatar", "Abu Dhabi": "UnitedArabEmirates",
  "United Arab Emirates": "UnitedArabEmirates",
}

function getTrackImage(country: string, eventName: string): string | null {
  if (country === "United States") {
    const n = eventName.toLowerCase()
    if (n.includes("miami")) return "/assets/tracks/Miami.png"
    if (n.includes("las vegas")) return "/assets/tracks/LasVegas.png"
    return "/assets/tracks/UnitedStates.png"
  }
  if (country === "Italy") {
    const n = eventName.toLowerCase()
    if (n.includes("emilia") || n.includes("imola")) return "/assets/tracks/Imola.png"
    return "/assets/tracks/Italy.png"
  }
  const key = TRACK_IMAGES[country]
  return key ? `/assets/tracks/${key}.png` : null
}

function CountdownUnit({ value, label, mounted }: { value: number; label: string; mounted: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="font-(family-name:--font-orbitron) text-4xl sm:text-5xl md:text-6xl font-bold
                   tabular-nums text-text-primary leading-none"
        suppressHydrationWarning
      >
        {mounted ? String(value).padStart(2, "0") : "--"}
      </span>
      <span className="section-label text-[0.5rem] sm:text-[0.55rem] tracking-[0.15em] sm:tracking-[0.2em]">{label}</span>
    </div>
  )
}

interface Props {
  event: F1Event
  upcomingRaces: F1Event[]
}

export default function NextRaceCard({ event, upcomingRaces }: Props) {
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

  return (
    <section className="space-y-4">
      {/* Hero card */}
      <div className="glass-card-accent overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Left: race info + countdown + session schedule */}
          <div className="flex-1 p-4 sm:p-6 md:p-8 flex flex-col justify-between gap-6 sm:gap-8">
            {/* Race header */}
            <div>
              <p className="section-label mb-3 text-f1-red">
                Round {event.round_number} · {nextLabel}
              </p>
              <div className="flex items-center gap-3 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagsapi.com/${flagCode}/flat/32.png`}
                  alt={event.country}
                  className="h-6 w-auto rounded-sm"
                />
                <h2 className="font-(family-name:--font-orbitron) text-xl sm:text-2xl md:text-3xl font-bold
                               tracking-wide text-text-primary leading-tight">
                  {event.event_name}
                </h2>
              </div>
              <p className="text-text-muted text-sm font-(family-name:--font-dm-mono)">
                {event.country} · {formattedDate}
              </p>
            </div>

            {/* Countdown */}
            <div className="flex items-end gap-2 sm:gap-4 md:gap-6">
              <CountdownUnit value={time.days}    label="DAYS"    mounted={mounted} />
              <span className="text-text-dim font-(family-name:--font-orbitron) text-2xl sm:text-3xl md:text-4xl font-bold mb-2">:</span>
              <CountdownUnit value={time.hours}   label="HRS"     mounted={mounted} />
              <span className="text-text-dim font-(family-name:--font-orbitron) text-2xl sm:text-3xl md:text-4xl font-bold mb-2">:</span>
              <CountdownUnit value={time.minutes} label="MIN"     mounted={mounted} />
              <span className="text-text-dim font-(family-name:--font-orbitron) text-2xl sm:text-3xl md:text-4xl font-bold mb-2">:</span>
              <CountdownUnit value={time.seconds} label="SEC"     mounted={mounted} />
            </div>

            {/* Session schedule */}
            {sessions.length > 0 && (
              <div className="space-y-1" suppressHydrationWarning>
                {sessions.map((s) => {
                  const isPast = mounted && s.date.getTime() < now
                  const isNext = mounted && !isPast && s === nextSession
                  return (
                    <div
                      key={s.name}
                      className={`flex items-center justify-between py-1.5 px-2 border-b border-border-subtle
                                  ${isPast ? "opacity-30" : ""}`}
                    >
                      <span className={`text-[0.65rem] font-(family-name:--font-dm-mono) uppercase tracking-widest
                                        ${isNext ? "text-f1-red" : isPast ? "text-text-dim" : "text-text-muted"}`}>
                        {s.abbrev}
                        {isNext && <span className="ml-2 text-[0.5rem] text-f1-red">▶ NEXT</span>}
                      </span>
                      <span className="text-[0.65rem] font-(family-name:--font-dm-mono) text-text-dim tabular-nums">
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

            {/* Button is suppressed until mounted to avoid hydration mismatch */}
            {!mounted ? null : sessions[0] && sessions[0].date.getTime() < Date.now() ? (
              <span className="self-start px-5 py-2.5 text-xs font-(family-name:--font-dm-mono)
                               uppercase tracking-widest text-text-dim border border-border-subtle
                               opacity-50 cursor-not-allowed">
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

          {/* Right: track image */}
          {trackImage && (
            <div className="relative w-full lg:w-80 h-48 lg:h-auto shrink-0 opacity-40 lg:opacity-60">
              <Image
                src={trackImage}
                alt={`${event.country} circuit`}
                fill
                className="object-contain p-4"
              />
            </div>
          )}
        </div>
      </div>

      {/* Upcoming races strip */}
      {upcomingRaces.length > 0 && (
        <div>
          <p className="section-label mb-3">Up Next</p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {upcomingRaces.map((race) => {
              const flag = FLAG_CODES[race.country] ?? "UN"
              const thumb = getTrackImage(race.country, race.event_name)
              const raceDate = race.session5_date
                ? parseUTC(race.session5_date)
                : new Date(race.event_date + "T12:00:00Z")
              const date = raceDate?.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) ?? ""
              return (
                <div
                  key={race.id}
                  className="glass-card shrink-0 w-52 p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://flagsapi.com/${flag}/flat/32.png`}
                      alt={race.country}
                      className="h-4 w-auto rounded-sm opacity-80"
                    />
                    <span className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest">
                      R{race.round_number}
                    </span>
                  </div>
                  {thumb && (
                    <div className="relative h-24 opacity-50">
                      <Image src={thumb} alt={race.country} fill className="object-contain" />
                    </div>
                  )}
                  <div>
                    <p className="text-text-secondary text-xs font-(family-name:--font-dm-mono) leading-snug line-clamp-1">
                      {race.event_name}
                    </p>
                    <p className="text-text-dim text-[0.6rem] font-(family-name:--font-dm-mono) mt-0.5">{date}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
