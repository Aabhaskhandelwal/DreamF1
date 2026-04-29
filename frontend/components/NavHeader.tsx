"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type NavKey = "dashboard" | "telemetry" | "predict" | "circles"

const LINKS: { href: string; label: string; key: NavKey }[] = [
  { href: "/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/telemetry", label: "Telemetry", key: "telemetry" },
  { href: "/predict", label: "Predict", key: "predict" },
  { href: "/circles", label: "Circles", key: "circles" },
]

export default function NavHeader({ active }: { active?: NavKey }) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("token"))
    setUsername(localStorage.getItem("username"))
  }, [])

  function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("username")
    router.push("/login")
  }

  return (
    <header className="flex items-center justify-between gap-4">
      <Link href="/dashboard" className="shrink-0">
        <span className="font-(family-name:--font-orbitron) text-sm sm:text-base font-black text-f1-red tracking-widest">
          DREAMF1
        </span>
      </Link>

      <nav className="flex items-center gap-3 sm:gap-6 text-[0.65rem] sm:text-sm font-(family-name:--font-dm-mono) uppercase tracking-wider">
        {LINKS.map(({ href, label, key }) => (
          <Link
            key={key}
            href={href}
            className={
              active === key
                ? "text-text-primary"
                : "text-text-muted hover:text-text-primary transition-colors"
            }
          >
            {label}
          </Link>
        ))}

        {loggedIn ? (
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-[#1e1e1e]">
            {username && (
              <span
                className="hidden sm:flex items-center justify-center w-6 h-6 rounded-full bg-f1-red
                           text-white text-[0.6rem] font-bold shrink-0"
                title={username}
              >
                {username.charAt(0).toUpperCase()}
              </span>
            )}
            <button
              onClick={logout}
              className="text-text-muted hover:text-f1-red transition-colors cursor-pointer"
            >
              Log Out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-3 py-1.5 bg-f1-red text-white text-[0.6rem] sm:text-xs
                       font-(family-name:--font-dm-mono) uppercase tracking-widest
                       hover:bg-f1-red-dark transition-colors shrink-0"
          >
            Sign In
          </Link>
        )}
      </nav>
    </header>
  )
}
