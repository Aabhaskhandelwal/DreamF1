"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

export default function Register() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError((data as { detail?: string }).detail || "Registration failed")
        return
      }

      router.push("/login")
    } catch {
      setError("Could not connect to the server")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="fixed top-5 left-5 flex items-center gap-1.5 text-[0.65rem]
                   font-(family-name:--font-dm-mono) uppercase tracking-widest
                   text-text-muted hover:text-text-secondary transition-colors z-10"
      >
        ← Back
      </button>

      <div
        className="w-full max-w-sm md:max-w-3xl animate-fade-in-up"
        style={{ animationDuration: "0.45s", animationFillMode: "both" }}
      >
        <div className="glass-card border border-border-default overflow-hidden md:flex">

          {/* ── Left panel (desktop only) ───────────────────────── */}
          <div className="hidden md:flex flex-col justify-between p-10 bg-surface-1
                          border-r border-border-default w-80 shrink-0">
            <div className="space-y-6">
              <Image src="/logo.svg" alt="DreamF1" width={88} height={30} priority />
              <div className="space-y-3">
                <h2 className="font-(family-name:--font-orbitron) text-xl font-bold
                               text-text-primary leading-snug tracking-wide">
                  Join the Circle.
                </h2>
                <p className="text-text-muted text-sm font-(family-name:--font-dm-sans) leading-relaxed">
                  Create your account, invite friends, and compete on the leaderboard every race weekend.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="section-label">2026 Season</p>
              <p className="font-(family-name:--font-orbitron) text-3xl font-bold text-f1-red">24</p>
              <p className="section-label">Rounds to predict</p>
            </div>
          </div>

          {/* ── Right panel: form ───────────────────────────────── */}
          <div className="flex-1 p-8 space-y-7">
            {/* Mobile logo */}
            <div className="flex flex-col items-center gap-3 md:hidden">
              <Image src="/logo.svg" alt="DreamF1" width={80} height={27} priority />
            </div>

            <div className="space-y-1">
              <h1 className="font-(family-name:--font-orbitron) text-lg font-bold
                             text-text-primary tracking-wide">
                Create Account
              </h1>
              <p className="section-label">Start predicting race outcomes</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="username" className="block section-label text-text-muted">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="pick_a_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-surface-2 border border-border-default px-3 py-2.5
                             text-sm font-(family-name:--font-dm-mono) text-text-primary
                             placeholder:text-text-dim
                             focus:outline-none focus:border-f1-red transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="block section-label text-text-muted">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-surface-2 border border-border-default px-3 py-2.5
                             text-sm font-(family-name:--font-dm-mono) text-text-primary
                             placeholder:text-text-dim
                             focus:outline-none focus:border-f1-red transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block section-label text-text-muted">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-surface-2 border border-border-default px-3 py-2.5
                             text-sm font-(family-name:--font-dm-mono) text-text-primary
                             placeholder:text-text-dim
                             focus:outline-none focus:border-f1-red transition-colors"
                />
              </div>

              {error && (
                <p className="text-xs font-(family-name:--font-dm-mono) text-f1-red">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-f1-red text-white text-xs
                           font-(family-name:--font-dm-mono) uppercase tracking-widest
                           hover:bg-f1-red-dark transition-colors"
              >
                Create Account →
              </button>
            </form>

            <p className="text-center text-[0.65rem] font-(family-name:--font-dm-mono)
                          text-text-muted uppercase tracking-wider">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-text-secondary hover:text-text-primary underline underline-offset-2 transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
