"use client"

import { useState } from "react"
import { teamColor } from "@/lib/design"

/**
 * Constructor logo with graceful fallback. Tries /assets/teams/{slug}.png
 * (drop real logos there) and falls back to a team-coloured block.
 */
export default function TeamLogo({ slug, size = 18 }: { slug: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  const color = teamColor(slug)

  if (failed || !slug) {
    return (
      <span
        className="inline-block rounded-sm shrink-0"
        style={{ width: size, height: size, background: color }}
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/assets/teams/${slug}.png`}
      alt={slug}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className="object-contain shrink-0"
      style={{ width: size, height: size }}
    />
  )
}
