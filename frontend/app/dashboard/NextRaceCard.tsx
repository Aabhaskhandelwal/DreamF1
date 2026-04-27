"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import type { F1Event } from "./page"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getTimeLeft(targetDate: string): TimeLeft {
  const diff = new Date(targetDate).getTime() - Date.now()
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
    const name = eventName.toLowerCase()
    if (name.includes("miami")) return "/assets/tracks/Miami.png"
    if (name.includes("las vegas")) return "/assets/tracks/LasVegas.png"
    return "/assets/tracks/UnitedStates.png"
  }
  if (country === "Italy") {
    const name = eventName.toLowerCase()
    if (name.includes("emilia") || name.includes("imola")) return "/assets/tracks/Imola.png"
    return "/assets/tracks/Italy.png"
  }
  const key = TRACK_IMAGES[country]
  return key ? `/assets/tracks/${key}.png` : null
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[3.5rem]">
      <span className="font-[family-name:var(--font-orbitron)] text-4xl md:text-5xl font-bold tabular-nums text-[#f3f3f3] leading-none">
        {String(value).padStart(2, "0")}
      </span>
      <span className="section-label mt-1.5">{label}</span>
    </div>
  )
}

export default function NextRaceCard({ event }: { event: F1Event }) {
  const [time, setTime] = useState<TimeLeft>(() => getTimeLeft(event.event_date))

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft(event.event_date)), 1000)
    return () => clearInterval(id)
  }, [event.event_date])

  const flagCode = FLAG_CODES[event.country] ?? "UN"
  const trackImage = getTrackImage(event.country, event.event_name)
  const formattedDate = new Date(event.event_date).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  })

  return (
    <div className="glass-card-accent p-6 flex flex-col md:flex-row gap-8 items-center">
      {/* Track map */}
      <div className="relative flex-shrink-0 w-full md:w-80 h-48">
        {trackImage ? (
          <Image
            src={trackImage}
            alt={`${event.country} circuit layout`}
            fill
            className="object-contain opacity-75"
          />
        ) : (
          <div className="w-full h-full rounded flex items-center justify-center text-[#2a2a2a] font-[family-name:var(--font-dm-mono)] text-xs uppercase tracking-widest">
            No track map
          </div>
        )}
      </div>

      {/* Info + countdown */}
      <div className="flex flex-col justify-between flex-1 gap-6">
        <div>
          <p className="section-label mb-2">Round {event.round_number} · Next Race</p>
          <div className="flex items-center gap-3 mb-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://flagsapi.com/${flagCode}/flat/32.png`}
              alt={event.country}
              className="h-5 w-auto rounded-sm"
            />
            <h2 className="font-[family-name:var(--font-orbitron)] text-xl md:text-2xl font-bold tracking-wide text-[#f3f3f3]">
              {event.event_name}
            </h2>
          </div>
          <p className="text-sm text-[#555] font-[family-name:var(--font-dm-mono)]">
            {event.country} · {formattedDate}
          </p>
        </div>

        {/* Countdown */}
        <div className="flex gap-6">
          <CountdownUnit value={time.days} label="DAYS" />
          <CountdownUnit value={time.hours} label="HRS" />
          <CountdownUnit value={time.minutes} label="MIN" />
          <CountdownUnit value={time.seconds} label="SEC" />
        </div>
      </div>
    </div>
  )
}
