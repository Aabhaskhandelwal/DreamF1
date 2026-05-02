# MyF1Circle (DreamF1) - Project Master Handoff

Welcome, Claude! This document is the single source of truth for the project. Read it fully before touching any code.

---

## 1. Project Goal

A fantasy F1 prediction platform for private friend groups ("Circles"). Users predict race outcomes, earn points when correct, and compete on a group leaderboard. All data comes from real 2026 F1 results via FastF1.

The UI should feel premium and technical — dark glassmorphism, F1-branded typography. The reference design is `f1-telemetry-master/` in the repo root.

---

## 2. Technology Stack

### `backend/` — Port 8080
- **FastAPI** + `uvicorn`
- **PostgreSQL** via SQLAlchemy (connection configured via env vars: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`)
- **Auth:** JWT tokens, bcrypt password hashing, OAuth2 form-data login
- **Data:** `fastf1` library for schedule, race results, qualifying, telemetry
- **Cache:** FastF1 cache at `backend/cache/` (persisted as Docker named volume `ff1cache`)
- **Entry point:** `backend/main.py`; shared modules in `backend/app/` (`config.py`, `database.py`, `models.py`, `auth.py`)

### `frontend-prototype/` — Port 8501
- **Streamlit** (Python) — reference prototype, kept for comparison
- Connects to backend at `http://localhost:8080`
- Uses Plotly for charts
- Telemetry data pre-fetched to `frontend-prototype/data/` via `prefetch.py` for instant loads
- Fetchers use `persist="disk"` + local JSON fallback — run `uv run prefetch.py` after each race weekend

### `frontend/` — Port 3000 ✅ FULLY BUILT
- **Next.js 16.2.1** (App Router) + **Tailwind CSS v4**
- All 4 main pages complete and responsive
- JWT stored in `localStorage` under key `"token"` — all authenticated fetches use `Authorization: Bearer <token>`
- `next.config.ts` sets `output: "standalone"` for Docker

---

## 3. Next.js Frontend — Current State

### Pages built

| Route | File | Status |
|---|---|---|
| `/dashboard` | `app/dashboard/page.tsx` + `NextRaceCard`, `SeasonMetrics`, `CirclesOverview` | ✅ Done |
| `/telemetry` | `app/telemetry/page.tsx` + `TelemetryClient`, `RaceClassification`, `TyreStrategy`, `QualiTimes`, `SpeedTrace`, `PositionChart`, `GapChart`, `LapTimesChart`, `SectorTimes`, `CircuitMap` | ✅ Done |
| `/predict` | `app/predict/page.tsx` + `PredictClient`, `DriverSelect` | ✅ Done |
| `/predictions` | `app/predictions/page.tsx` | ✅ Done |
| `/circles` | `app/circles/page.tsx` + `CirclesClient` | ✅ Done |
| `/login` | `app/login/page.tsx` | ✅ Done |
| `/register` | `app/register/page.tsx` | ✅ Done |

### Key implementation details

**Dashboard (`/dashboard`)**
- `NextRaceCard` — live countdown timer with `mounted` guard to avoid SSR hydration mismatch. Uses `event_date + "T12:00:00Z"` to anchor to noon UTC so the counter doesn't expire at midnight.
- Upcoming races horizontal strip shows **all** remaining rounds (no slice limit) — horizontally scrollable via `overflow-x-auto`. Track map thumbnails are `h-24`.
- `FLAG_CODES` and `TRACK_IMAGES` in `NextRaceCard.tsx` carry **both** `"Great Britain"` and `"United Kingdom"` as aliases — FastF1 can return either; do not remove either key.
- **Critical**: `nextRace` and `completedCount` are both date-based (`event_date >= today` / `event_date < today`), NOT `is_completed`. The `is_completed` flag only flips when admin calls `/api/score/{event_id}`, so using it for display would show wrong data.

**Predict (`/predict`)**
- `DriverSelect` — custom dropdown grouped by team. Accepts `disabledCodes: Set<string>` to prevent picking the same driver across slots.
- `PredictClient` — checks `GET /api/predictions` on mount to show existing prediction if already submitted for the next race.
- Same date-based `nextRace` selection as dashboard (not `is_completed`).
- Form has two sections separated by a divider:
  - **Required** (`REQUIRED_SLOTS`): Pole Position, P1, P2, P3, Fastest Lap — must all be filled to submit.
  - **Optional** (`OPTIONAL_DRIVER_SLOTS`): P4 (+8 pts), P5 (+6 pts), DNF (+5 pts), Safety Car yes/no toggle (+5 pts).
- `POSITION_KEYS` set drives deduplication — same driver can't fill two position slots; DNF is exempt.
- Safety Car is `boolean | null` stored in `FormState.safety_car`; rendered as YES/NO toggle buttons (not a DriverSelect).

**My Picks (`/predictions`)**
- Full prediction history: fetches `/api/predictions` (auth) and `/api/schedule` in parallel, joins on `event_id`.
- Status logic: `event_date >= today` → "upcoming", `is_completed` → "scored", else "pending".
- Summary bar: total points, races predicted, accuracy % (`totalPoints / (scoredCount * 64) * 100`).
- `DRIVER_PICK_LABELS` array covers P1–P5, Pole, FL, DNF. Safety Car shown as a separate chip.
- Cards sorted newest-first by `round_number`.

**Telemetry (`/telemetry`)**
- **9 tabs**: Race | Lap Times | Positions | Gaps | Tyres | Qualifying | Sectors | Speed Trace | Circuit
- Race/Tyres/Qualifying fetched eagerly on round change; all other tabs lazy-load on first visit.
- `RaceClassification` and `QualiTimes` wrapped in `overflow-x-auto` with `min-w` so fixed pixel grid columns scroll horizontally on mobile.
- **Circuit tab** (`CircuitMap.tsx`) — 6-layer neon SVG glow using stacked `feGaussianBlur` filters. All widths relative to `T = size * 0.008` (0.8% of GPS bounding box) so the track scales correctly for any circuit. GPS Y is negated (`ys = y.map(v => -v)`) because SVG Y is down-positive. Start/finish marker is a perpendicular red tick at `x[0], ys[0]`.

**Circles (`/circles`)**
- Single page with `view` enum: `"list" | "create" | "join" | "leaderboard"`.
- Gold/silver/bronze rank colors for top 3 positions.

### Design system

**Fonts** (set up in `layout.tsx`)
- `Orbitron` — headers, metrics, brand name. CSS var: `--font-orbitron`
- `DM Mono` — labels, data, badges, section labels. CSS var: `--font-dm-mono`
- `DM Sans` — body text. CSS var: `--font-dm-sans`
- `Formula1-Regular.otf` — local font at `public/fonts/`, driver codes only. CSS var: `--font-f1-regular`

**Font syntax** — always use modern Tailwind v4 form:
```
font-(family-name:--font-orbitron)   ✅
font-[family-name:var(--font-xxx)]   ❌ old syntax
```

**Color tokens** (in `globals.css`, inside `@theme inline`)
```
--color-f1-red: #ED1131        (primary accent)
--color-f1-red-dark: #b5001e   (hover state)
--color-f1-purple: #c084fc     (fastest lap / pole)
--color-f1-green: #4ade80      (positions gained / personal best)

--color-surface-0: #0a0a0a     (page bg)
--color-surface-1: #111111
--color-surface-2: #161616
--color-surface-3: #1e1e1e

--color-border-subtle: #1a1a1a
--color-border-default: #1e1e1e
--color-border-muted: #2a2a2a

--color-text-primary: #f3f3f3
--color-text-secondary: #e0e0e0
--color-text-muted: #666666
--color-text-dim: #444444
```

**CSS utility classes** (in `globals.css`)
- `.glass-card` — dark glassmorphism card
- `.glass-card-accent` — card with red left border
- `.section-label` — DM Mono uppercase label
- `.metric-value` — Orbitron large number
- `.metric-label` — DM Mono small uppercase
- `.f1-badge` — DM Mono badge text
- `.timing-row` — team-color gradient row (set `--team-color` inline)

**Shared constants** — `frontend/lib/design.ts` exports `TEAM_COLORS` and `DRIVERS_2026`.

**Responsive pattern** — all page wrappers use `px-4 sm:px-6 py-6 sm:py-8`. Data-dense tables (RaceClassification, QualiTimes) use `overflow-x-auto` wrapper + `min-w` rather than reflowing columns.

**NavHeader (`components/NavHeader.tsx`)**
- Desktop (`sm+`): horizontal nav links + auth button inline.
- Mobile: logo + auth button/avatar + animated hamburger. Links collapse into a slide-down drawer (CSS `max-h` transition, no JS animation library). Hamburger animates to an ✕ via rotate transforms.
- Auth state read from `localStorage` in `useEffect` (client-only). Logged out → red "Sign In" CTA. Logged in → username initial badge (red circle) + "Log Out" button with `border-l` divider.
- 5 nav links: Dashboard, Telemetry, Predict, My Picks (`/predictions`), Circles.

**Footer (`components/Footer.tsx`)**
- Mounted in `app/layout.tsx` — appears on every page.
- Contains: GitHub SVG icon linking to the repo, copyright line (`© {year} Aabhas Khandelwal`), "Not affiliated with Formula 1 or the FIA" disclaimer.

**Auth pages (`/login`, `/register`)**
- Both pages are **native HTML** — no shadcn `Card`/`Input`/`Button`. Use `.glass-card-accent`, plain `<input>` with `bg-surface-2 border-border-default focus:border-f1-red`, and a plain `<button>` with `bg-f1-red`.
- Desktop: two-column layout — left `w-80 bg-surface-1` branding panel (logo + tagline + "24 rounds" stat), right flex-1 form panel, separated by `border-r border-border-default`.
- Mobile: left panel is `hidden md:flex`; logo renders inline above form instead.
- Entry animation: `animate-fade-in-up` (from `tw-animate-css`) with `animationDuration: "0.45s"` and `animationFillMode: "both"` on the card wrapper.
- Back button: `fixed top-5 left-5`, calls `router.push("/dashboard")`.
- Login links to Register; Register links to Login — both use `text-text-secondary underline underline-offset-2`.

**Tailwind IntelliSense** — if not working with v4, add `"tailwindCSS.experimental.configFile": "frontend/postcss.config.mjs"` to VS Code settings.

---

## 4. The 2026 Driver Grid

**Always use these exact 3-letter abbreviations.** Do not use driver names or numbers.

| Team | Driver A | Driver B |
|---|---|---|
| Red Bull Racing | VER | HAD |
| McLaren | NOR | PIA |
| Ferrari | LEC | HAM |
| Mercedes | RUS | ANT |
| Aston Martin | ALO | STR |
| Alpine | GAS | COL |
| Williams | ALB | SAI |
| Racing Bulls | LAW | LIN |
| Audi (fka Sauber) | HUL | BOR |
| Haas | BEA | OCO |
| Cadillac (new) | BOT | PER |

22 drivers, 11 teams.

**Team colors** (source of truth in `frontend/lib/design.ts`):
```ts
export const TEAM_COLORS: Record<string, string> = {
  VER: "#4781D7", HAD: "#4781D7",  // Red Bull
  NOR: "#F47600", PIA: "#F47600",  // McLaren
  LEC: "#ED1131", HAM: "#ED1131",  // Ferrari
  RUS: "#00D7B6", ANT: "#00D7B6",  // Mercedes
  ALO: "#229971", STR: "#229971",  // Aston Martin
  GAS: "#00A1E8", COL: "#00A1E8",  // Alpine
  ALB: "#1868DB", SAI: "#1868DB",  // Williams
  LAW: "#6C98FF", LIN: "#6C98FF",  // Racing Bulls
  HUL: "#F50537", BOR: "#F50537",  // Audi
  BEA: "#9C9FA2", OCO: "#9C9FA2",  // Haas
  BOT: "#909090", PER: "#909090",  // Cadillac
}
```

---

## 5. Backend API — All Endpoints

### Auth
- `POST /api/register` — JSON body: `{username, email, password}`
- `POST /api/login` — **Form data** (OAuth2): `username`, `password`. Returns `{access_token, token_type}`

### Schedule
- `GET /api/schedule` — Returns all 2026 events. Seeds DB from FastF1 on first call.

### Predictions
- `POST /api/predict` — Bearer token required. Body: `{first_place, second_place, third_place, pole_position, fastest_lap, fourth_place?, fifth_place?, dnf_driver?, safety_car?}`. Backend auto-locks to next unscored race — no event_id in payload.
- `GET /api/predictions` — Bearer token required. Returns user's prediction history with points.

### Scoring (admin)
- `POST /api/score/{event_id}` — Triggers FastF1 result fetch, scores all predictions for that event, flips `is_completed = True`.

**Point values per category:**
| Category | Points | Notes |
|---|---|---|
| P1 | 10 | Required |
| P2 | 10 | Required |
| P3 | 10 | Required |
| Fastest Lap | 5 | Required |
| Pole Position | 5 | Required |
| P4 | 8 | Optional |
| P5 | 6 | Optional |
| DNF | 5 | Optional — any driver in actual DNF list |
| Safety Car | 5 | Optional — boolean, scored vs `TrackStatus.str.contains('4')` |
| **Max per race** | **64** | |

### Groups (Circles)
- `POST /api/groups` — Bearer token. Body: `{name}`. Creates group, returns invite_code.
- `POST /api/groups/join` — Bearer token. Body: `{invite_code}`.
- `GET /api/groups` — Bearer token. Returns user's groups with member counts.
- `GET /api/groups/{group_id}/leaderboard` — Bearer token. Returns ranked member list by total_points.

### Telemetry (all FastF1, cached 24h)
- `GET /api/telemetry/{year}/{round}/speed`
- `GET /api/telemetry/{year}/{round}/tyres`
- `GET /api/telemetry/{year}/{round}/quali`
- `GET /api/telemetry/{year}/{round}/laptimes`
- `GET /api/telemetry/{year}/{round}/positions`
- `GET /api/telemetry/{year}/{round}/gaps`
- `GET /api/telemetry/{year}/{round}/race_summary`
- `GET /api/telemetry/{year}/{round}/sector_times`
- `GET /api/telemetry/{year}/{round}/map` — GPS X/Y from fastest lap telemetry, downsampled to ~600 pts. Returns `{session, x[], y[]}`.

All telemetry endpoints return `{"_error": "..."}` on failure.

---

## 6. The 4 Golden Rules of Business Logic (DO NOT BREAK)

### Rule 1: Strictly Next Race
`POST /api/predict` does NOT accept an `event_id`. Frontend never shows a race picker on the predict form.

### Rule 2: Only 3-Letter Abbreviations
All driver inputs are dropdowns from the hardcoded 22-driver list. No free text.

### Rule 3: `is_completed` Toggle
System moves forward only when admin hits `/api/score/{event_id}`. **Do NOT use `is_completed` for UI display logic** — use `event_date` comparisons instead (`>= today` for upcoming, `< today` for completed).

### Rule 4: Optional Fields
`dnf_driver`, `fourth_place`, `fifth_place`, `safety_car` are all `Optional` — never required. The form's `canSubmit` only gates on the 5 required fields (Pole, P1–P3, FL). Do not make optional fields required.

---

## 7. FastF1 Usage Notes

- Cache enabled at `./cache` (relative to `backend/`)
- Always use `pd.notna(x)` to check timedelta values
- Load calls: `session.load(laps=True, telemetry=False, weather=False)` for most; `telemetry=True` for speed trace and circuit map
- Qualifying session identifier: `'Q'` (sprint weekends: `'SQ'`)
- `pick_quicklaps()` filters to 107% threshold
- All `LapTime` / sector time conversions: `x.total_seconds()` guarded by `pd.notna(x) and hasattr(x, 'total_seconds')`
- Safety car detection: `race_session.laps['TrackStatus'].dropna().str.contains('4').any()` — code `'4'` = full SC, `'6'` = VSC. This catches composite codes like `'14'` too.
- **Schema migrations**: `create_all()` only creates missing tables, never alters existing columns. New columns are added via `ALTER TABLE t ADD COLUMN IF NOT EXISTS col type` run inside `lifespan` using `engine.begin()` — idempotent on every restart.

---

## 8. CORS

Backend allows:
```python
["http://localhost:3000", "http://127.0.0.1:3000",
 "http://localhost:5173", "http://127.0.0.1:5173",
 "http://localhost:8501"]
```

---

## 9. Docker / Infra

`docker-compose.yml` runs three services:

| Service | Port | Notes |
|---|---|---|
| `db` | 5432 | PostgreSQL with healthcheck |
| `backend` | 8080 | FastAPI; mounts `ff1cache` volume at `/app/cache` |
| `nextjs` | 3000 | Next.js standalone build |
| `streamlit` | 8501 | Streamlit prototype |

FastF1 cache is persisted as Docker named volume `ff1cache` so data survives container restarts.

Backend Dockerfile uses Python 3.13-slim + `uv pip install --system`.
Frontend Dockerfile uses `output: "standalone"` mode.

---

## 10. Streamlit Prototype — Reference State

**Tabs:**
1. **Season** — Race calendar, metrics (total/completed/remaining), next race card
2. **Telemetry** — Auto-selects most recent race. Prediction Intel section + charts + head-to-head
3. **Predict** — Form locked to next race, 22-driver dropdowns
4. **My Predictions** — Table with points, total metric
5. **My Circles** — Create/join groups, leaderboard drill-down

**Design:** Orbitron + DM Mono + DM Sans, `#ED1131` accent, `#0a0a0a` bg, glassmorphism cards.

---

## 11. CI/CD

### GitHub Actions (`.github/workflows/`)

**`ci.yml`** — runs on every push and PR to `main`, three jobs in order:
1. `test-backend` — Python 3.13, installs with `uv pip install --system .`, runs `pytest tests/ -v` with test env vars (no real DB needed for current tests)
2. `build-frontend` — Node 20, `npm ci`, then `npm run build` with `NEXT_PUBLIC_API_URL=http://localhost:8080`
3. `docker-build` — only runs if both above pass; builds backend and frontend Docker images using `docker/build-push-action` with GitHub Actions cache (`type=gha`). Images are tagged with `github.sha` but **not pushed** (CI validation only)

**`deploy.yml`** — runs on push to `main` only, deploys to Azure:
- Uses OIDC (no long-lived secrets) — requires `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` in repo secrets
- `deploy-backend` — `az acr build` pushes to Azure Container Registry, then `az containerapp update` rolls out to Container App named `myf1circle-api` in resource group `myf1circle-rg`
- `deploy-frontend` — deploys Next.js to Azure Static Web Apps via `Azure/static-web-apps-deploy@v1`, requires `AZURE_STATIC_WEB_APPS_TOKEN` secret

### Backend tests (`backend/tests/`)
- `conftest.py` — pytest fixtures (FastAPI `TestClient`)
- `test_health.py` — health check, and unit tests for `_clean()` (the NaN/Inf sanitiser used in telemetry responses)
- Tests run without a real database — current suite only covers the root endpoint and pure functions

---

## 12. Tech Debt (Pending)

1. **Refactor `backend/main.py` into routers** — `backend/app/routers/`
2. **UTC timestamps** — Replace `datetime.now().date()` with `datetime.now(timezone.utc).date()`
3. **Enhanced Circuit map** — Add turn numbers (from `session.get_circuit_info().corners`), DRS zone highlights (from fastest-lap `TrackStatus` telemetry), and a side panel showing track length/laps/schedule — matching the official F1 site layout.
4. **Minisectors** — lap segment bars from `f1-telemetry-master` not yet ported
5. **ML pick advisor** — historical FastF1 data → podium probabilities, DNF risk per driver/circuit
6. **Per-race point breakdown** — predictions page shows total points per race but not a field-by-field breakdown (which picks scored)

---

*Last updated: 2026-04-30*
