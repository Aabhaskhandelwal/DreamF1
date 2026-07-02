/**
 * Root template — remounts on every route change (unlike layout), so each
 * page gets a soft entrance transition. CSS-only; respects reduced motion
 * via the media query in globals.css.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>
}
