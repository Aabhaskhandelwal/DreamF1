"use client"

import { useEffect } from "react"
import Lenis from "lenis"

/**
 * Site-wide inertial smooth scrolling via Lenis. Mounted once in the root
 * layout; renders nothing. Skips itself when the user prefers reduced motion.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const lenis = new Lenis({
      lerp: 0.11, // interpolation strength — lower = floatier
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    })

    let raf = requestAnimationFrame(function loop(time) {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    })

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [])

  return null
}
