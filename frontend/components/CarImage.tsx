"use client"

import { useState } from "react"

// Maps the canonical team slug to the car asset filename (kept as supplied).
const CAR_FILES: Record<string, string> = {
  alpine: "2026alpinecarright.avif",
  astonmartin: "2026astonmartincarright.avif",
  audi: "2026audicarright.avif",
  cadillac: "2026cadillaccarright.avif",
  ferrari: "2026ferraricarright.avif",
  haas: "2026haasf1teamcarright.avif",
  mclaren: "2026mclarencarright.avif",
  mercedes: "2026mercedescarright.avif",
  racingbulls: "2026racingbullscarright.avif",
  redbull: "2026redbullracingcarright.avif",
  williams: "2026williamscarright.avif",
}

export default function CarImage({ slug, className }: { slug: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  const file = CAR_FILES[slug]
  if (failed || !file) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/assets/cars/${file}`} alt={`${slug} car`} onError={() => setFailed(true)} className={className} />
  )
}
