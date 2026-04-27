"use client";

import Link from "next/link";
import Image from "next/image";

type NavKey = "dashboard" | "telemetry" | "predict" | "circles";

export default function NavHeader({ active }: { active?: NavKey }) {
  const links: { href: string; label: string; key: NavKey }[] = [
    { href: "/dashboard", label: "Dashboard", key: "dashboard" },
    { href: "/telemetry", label: "Telemetry", key: "telemetry" },
    { href: "/predict", label: "Predict", key: "predict" },
    { href: "/circles", label: "Circles", key: "circles" },
  ];

  return (
    <header className="flex items-center justify-between gap-4">
      <Link href="/dashboard" className="shrink-0">
        <Image
          src="/logo.svg"
          alt="DreamF1"
          width={80}
          height={27}
          priority
          className="w-14 sm:w-20 h-auto"
        />
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
  );
}
