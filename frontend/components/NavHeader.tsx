"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

type NavKey = "dashboard" | "telemetry" | "predict" | "predictions" | "circles"

const LINKS: { href: string; label: string; key: NavKey }[] = [
  { href: "/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/telemetry", label: "Telemetry", key: "telemetry" },
  { href: "/predict", label: "Predict", key: "predict" },
  { href: "/predictions", label: "My Picks", key: "predictions" },
  { href: "/circles", label: "Circles", key: "circles" },
]

export default function NavHeader({ active }: { active?: NavKey }) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
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

  function close() {
    setOpen(false)
  }

  return (
    <header>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/dashboard" className="shrink-0" onClick={close}>
          <Image
            src="/logo.svg"
            alt="DreamF1"
            width={80}
            height={27}
            priority
            className="w-14 sm:w-20 h-auto"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6 text-sm font-(family-name:--font-dm-mono) uppercase tracking-wider">
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
            <div className="flex items-center gap-3 pl-3 border-l border-[#1e1e1e]">
              {username && (
                <span
                  className="flex items-center justify-center w-6 h-6 rounded-full bg-f1-red
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
              className="px-3 py-1.5 bg-f1-red text-white text-xs
                         font-(family-name:--font-dm-mono) uppercase tracking-widest
                         hover:bg-f1-red-dark transition-colors shrink-0"
            >
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile right side: auth + hamburger */}
        <div className="flex sm:hidden items-center gap-3">
          {loggedIn ? (
            <span
              className="flex items-center justify-center w-6 h-6 rounded-full bg-f1-red
                         text-white text-[0.6rem] font-bold shrink-0"
              title={username ?? ""}
            >
              {username?.charAt(0).toUpperCase() ?? "U"}
            </span>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1 bg-f1-red text-white text-[0.6rem]
                         font-(family-name:--font-dm-mono) uppercase tracking-widest
                         hover:bg-f1-red-dark transition-colors shrink-0"
            >
              Sign In
            </Link>
          )}

          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            className="flex flex-col justify-center items-center gap-1.25 w-7 h-7 shrink-0"
          >
            <span
              className={`block h-px w-5 bg-text-secondary transition-all duration-200 origin-center
                          ${open ? "rotate-45 translate-y-1.5" : ""}`}
            />
            <span
              className={`block h-px w-5 bg-text-secondary transition-all duration-200
                          ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-px w-5 bg-text-secondary transition-all duration-200 origin-center
                          ${open ? "-rotate-45 -translate-y-1.5" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`sm:hidden overflow-hidden transition-all duration-200
                    ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <nav className="flex flex-col pt-4 pb-2 gap-1 border-t border-border-subtle mt-4
                        font-(family-name:--font-dm-mono) uppercase tracking-wider text-xs">
          {LINKS.map(({ href, label, key }) => (
            <Link
              key={key}
              href={href}
              onClick={close}
              className={`py-2.5 px-1 border-b border-border-subtle last:border-0
                          ${active === key ? "text-text-primary" : "text-text-muted"}`}
            >
              {label}
            </Link>
          ))}
          {loggedIn && (
            <button
              onClick={() => { logout(); close() }}
              className="py-2.5 px-1 text-left text-text-muted hover:text-f1-red transition-colors cursor-pointer"
            >
              Log Out
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
