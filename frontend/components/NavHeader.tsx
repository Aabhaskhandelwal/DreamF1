import Link from "next/link"

type NavKey = "dashboard" | "telemetry" | "predict" | "circles"

export default function NavHeader({ active }: { active?: NavKey }) {
  const links: { href: string; label: string; key: NavKey }[] = [
    { href: "/dashboard", label: "Dashboard", key: "dashboard" },
    { href: "/telemetry", label: "Telemetry", key: "telemetry" },
    { href: "/predict", label: "Predict", key: "predict" },
    { href: "/circles", label: "Circles", key: "circles" },
  ]

  return (
    <header className="flex items-center justify-between gap-4">
      <Link href="/dashboard" className="shrink-0">
        <span className="font-(family-name:--font-f1-regular) text-lg sm:text-xl tracking-widest text-f1-red">
          DREAMF1
        </span>
      </Link>
      <nav className="flex gap-3 sm:gap-6 text-[0.65rem] sm:text-sm font-(family-name:--font-dm-mono) uppercase tracking-wider">
        {links.map(({ href, label, key }) => (
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
      </nav>
    </header>
  )
}
