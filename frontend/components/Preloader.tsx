"use client"

import { useEffect, useState } from "react"

/**
 * F1 start-procedure preloader: five red lights come on one by one, hold,
 * then it's lights out — the overlay lifts and the app is revealed.
 *
 * Runs once per browser session (sessionStorage) so in-app navigation is
 * never blocked. Respects prefers-reduced-motion by skipping entirely.
 */

const LIGHT_INTERVAL = 320 // ms between each light coming on
const HOLD = 650 // all five lit, breath-hold before lights out
const LIFT = 700 // overlay lift duration (matches CSS transition)

type Phase = "lights" | "out" | "done"

export default function Preloader() {
  const [phase, setPhase] = useState<Phase | null>(null)
  const [lit, setLit] = useState(0)

  useEffect(() => {
    if (sessionStorage.getItem("df1-preloaded")) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sessionStorage.setItem("df1-preloaded", "1")
      return
    }
    sessionStorage.setItem("df1-preloaded", "1")
    setPhase("lights")

    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 1; i <= 5; i++) {
      timers.push(setTimeout(() => setLit(i), LIGHT_INTERVAL * i))
    }
    const outAt = LIGHT_INTERVAL * 5 + HOLD
    timers.push(
      setTimeout(() => {
        setLit(0) // lights out…
        setPhase("out") // …and away we go
      }, outAt),
    )
    timers.push(setTimeout(() => setPhase("done"), outAt + LIFT + 60))
    return () => timers.forEach(clearTimeout)
  }, [])

  // Lock scroll while the overlay is up
  useEffect(() => {
    if (phase === "lights") {
      document.documentElement.style.overflow = "hidden"
    } else {
      document.documentElement.style.overflow = ""
    }
    return () => {
      document.documentElement.style.overflow = ""
    }
  }, [phase])

  if (phase === null || phase === "done") return null

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505]"
      style={{
        transform: phase === "out" ? "translateY(-100%)" : "translateY(0)",
        transition: `transform ${LIFT}ms cubic-bezier(0.76, 0, 0.24, 1)`,
      }}
    >
      {/* Gantry */}
      <div className="flex gap-2.5 sm:gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 rounded-md border border-[#1a1a1a] bg-[#0c0c0c] px-2 py-2.5 sm:px-3 sm:py-3"
          >
            {/* each pod has two bulbs, like the real gantry */}
            {[0, 1].map((b) => (
              <span
                key={b}
                className="block h-6 w-6 sm:h-9 sm:w-9 rounded-full transition-all duration-150"
                style={{
                  background: lit >= i ? "#ED1131" : "#161616",
                  boxShadow: lit >= i ? "0 0 18px 4px rgba(237,17,49,0.55)" : "inset 0 1px 3px rgba(0,0,0,0.8)",
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Wordmark */}
      <p className="mt-10 font-(family-name:--font-orbitron) text-lg sm:text-xl font-black tracking-[0.35em] text-text-primary">
        DREAM<span className="text-f1-red">F1</span>
      </p>
      <p className="mt-2 h-3 text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-[0.3em] text-text-dim">
        {lit === 5 ? "" : lit > 0 ? `${lit} of 5` : ""}
      </p>
    </div>
  )
}
