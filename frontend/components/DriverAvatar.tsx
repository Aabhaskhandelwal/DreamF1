"use client"

import { useState } from "react"
import { teamColor, TEAM_COLORS } from "@/lib/design"

/**
 * Driver headshot with graceful fallback. Tries /assets/Drivers/{CODE}.avif
 * (drop real photos there) and falls back to a team-coloured code badge so it
 * always renders something useful today.
 */
export default function DriverAvatar({
  code,
  slug,
  size = 28,
}: {
  code: string
  slug?: string
  size?: number
}) {
  const [failed, setFailed] = useState(false)
  // Use the team slug when provided, else fall back to the driver-code colour.
  const ring = slug ? teamColor(slug) : (TEAM_COLORS[code] ?? "#888888")

  if (failed || !code) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full shrink-0
                   font-(family-name:--font-f1-regular) tracking-wider"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.32,
          color: ring,
          background: `${ring}1f`,
          border: `1.5px solid ${ring}`,
        }}
      >
        {code || "—"}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/assets/Drivers/${code}.avif`}
      alt={code}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className="rounded-full object-cover object-top shrink-0"
      style={{ width: size, height: size, border: `1.5px solid ${ring}`, background: "#0f0f0f" }}
    />
  )
}
