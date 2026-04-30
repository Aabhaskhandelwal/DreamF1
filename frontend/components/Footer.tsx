export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          {/* Brand */}
          <div className="space-y-2 text-center sm:text-left">
            <p className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim leading-relaxed max-w-56">
              Fantasy F1 prediction platform for private friend groups. Powered
              by FastF1 and real 2026 race data.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col items-center sm:items-end gap-3">
            <a
              href="https://github.com/Aabhaskhandelwal/DreamF1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors group"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="currentColor"
                className="opacity-60 group-hover:opacity-100 transition-opacity"
                aria-hidden="true"
              >
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-4 border-t border-[#111] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim tracking-widest uppercase">
            © {year} Aabhas Khandelwal · All rights reserved
          </p>
          <p className="text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim tracking-widest uppercase">
            Not affiliated with Formula 1 or the FIA
          </p>
        </div>
      </div>
    </footer>
  );
}
