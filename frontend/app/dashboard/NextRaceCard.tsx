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

function getTimeLeft(targetDate: string): TimeLeft {
  // Treat event_date as noon UTC so the countdown doesn't expire at midnight
  const target = new Date(targetDate + "T12:00:00Z").getTime()
  const diff = target - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

const FLAG_CODES: Record<string, string> = {
  Australia: "AU", Bahrain: "BH", "Saudi Arabia": "SA", Japan: "JP",
  China: "CN", "United States": "US", Italy: "IT", Monaco: "MC",
  Spain: "ES", Canada: "CA", Austria: "AT", "Great Britain": "GB",
  Hungary: "HU", Belgium: "BE", Netherlands: "NL", Azerbaijan: "AZ",
  Singapore: "SG", Mexico: "MX", Brazil: "BR", Qatar: "QA",
  "Abu Dhabi": "AE", "United Arab Emirates": "AE",
}

const TRACK_IMAGES: Record<string, string> = {
  Australia: "Australia", Bahrain: "Bahrain", "Saudi Arabia": "SaudiArabia",
  Japan: "Japan", China: "China", Monaco: "Monaco", Spain: "Spain",
  Canada: "Canada", Austria: "Austria", "Great Britain": "UnitedKingdom",
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
        className="font-(family-name:--font-orbitron) text-5xl md:text-6xl font-bold tabular-nums
                   text-text-primary leading-none"
        suppressHydrationWarning
      >
        {mounted ? String(value).padStart(2, "0") : "--"}
      </span>
      <span className="section-label text-[0.55rem] tracking-[0.2em]">{label}</span>
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

  // Defer to client — avoids SSR/client Date.now() hydration mismatch
  useEffect(() => {
    setMounted(true)
    setTime(getTimeLeft(event.event_date))
    const id = setInterval(() => setTime(getTimeLeft(event.event_date)), 1000)
    return () => clearInterval(id)
  }, [event.event_date])

  const flagCode = FLAG_CODES[event.country] ?? "UN"
  const trackImage = getTrackImage(event.country, event.event_name)
  const formattedDate = new Date(event.event_date + "T12:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  })

  return (
    <section className="space-y-4">
      {/* Hero card */}
      <div className="glass-card-accent overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Left: race info + countdown */}
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-between gap-8">
            {/* Race header */}
            <div>
              <p className="section-label mb-3 text-f1-red">
                Round {event.round_number} · Next Race
              </p>
              <div className="flex items-center gap-3 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagsapi.com/${flagCode}/flat/32.png`}
                  alt={event.country}
                  className="h-6 w-auto rounded-sm"
                />
                <h2 className="font-(family-name:--font-orbitron) text-2xl md:text-3xl font-bold
                               tracking-wide text-text-primary leading-tight">
                  {event.event_name}
                </h2>
              </div>
              <p className="text-text-muted text-sm font-(family-name:--font-dm-mono)">
                {event.country} · {formattedDate}
              </p>
            </div>

            {/* Countdown */}
            <div className="flex items-end gap-4 md:gap-8">
              <CountdownUnit value={time.days}    label="DAYS"    mounted={mounted} />
              <span className="text-text-dim font-(family-name:--font-orbitron) text-4xl font-bold mb-2">:</span>
              <CountdownUnit value={time.hours}   label="HOURS"   mounted={mounted} />
              <span className="text-text-dim font-(family-name:--font-orbitron) text-4xl font-bold mb-2">:</span>
              <CountdownUnit value={time.minutes} label="MINUTES" mounted={mounted} />
              <span className="text-text-dim font-(family-name:--font-orbitron) text-4xl font-bold mb-2">:</span>
              <CountdownUnit value={time.seconds} label="SECONDS" mounted={mounted} />
            </div>

            <Link
              href="/predict"
              className="self-start px-5 py-2.5 bg-f1-red text-white text-xs
                         font-(family-name:--font-dm-mono) uppercase tracking-widest
                         hover:bg-f1-red-dark transition-colors"
            >
              Lock Prediction →
            </Link>
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
              const date = new Date(race.event_date + "T12:00:00Z").toLocaleDateString("en-GB", {
                day: "numeric", month: "short",
              })
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
                    <div className="relative h-16 opacity-50">
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
