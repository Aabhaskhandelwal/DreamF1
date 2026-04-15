<div align="center">

# DreamF1 🏎️

**Compete with friends on F1 race outcomes. Pick your podium, pole, fastest lap, and DNF before each race — earn points when results come in.**

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat-square&logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)
![Status](https://img.shields.io/badge/status-active%20development-orange?style=flat-square)

</div>

---

**DreamF1** is a self-hosted F1 fantasy prediction platform for groups of friends who actually know their F1. Before each Grand Prix, every player submits a race card — six predictions across podium, pole, fastest lap, and DNF. When results come in, FastF1 does the scoring automatically. No spreadsheets, no manual updates.

## UI

<img src="frontend-prototype/public/dashboard.png" height="250"/>
<img src="frontend-prototype/public/telemetry.png" height="250"/>
<img src="frontend-prototype/public/predict.png" height="250"/>

## How it works

1. **Register** — create an account, join or create a friend group.
2. **View the calendar** — browse the full 2026 F1 season schedule.
3. **Submit your race card** — lock in picks across six categories before race start.
4. **Auto-scoring** — FastF1 fetches official results post-race and calculates points.
5. **Leaderboard** — season standings update automatically after each Grand Prix.

```text
  [ User ]           [ FastAPI ]              [ FastF1 ]
     │                    │                       │
     │  submit race card  │                       │
     ├───────────────────>│  validate + persist   │
     │                    │                       │
     │                    │  fetch race results ──>
     │                    │<──────────────────────
     │  leaderboard update│  score + rank         │
     │<───────────────────│                       │
```

## Features

- **Six pick categories** — P1, P2, P3, Pole Position, Fastest Lap, and DNF per race.
- **Auto-scoring engine** — results pulled from FastF1 post-race, points computed without manual input.
- **Telemetry dashboard** — qualifying deltas, tyre strategy breakdowns, and pace rankings per driver.
- **JWT authentication** — OAuth2 password flow, bcrypt hashing, short-lived tokens.
- **Friends leaderboard** — group-based season standings across the full 2026 calendar.

## Stack

| Layer    | Tech                          |
| :------- | :---------------------------- |
| Backend  | FastAPI, SQLModel, PostgreSQL |
| Auth     | JWT, OAuth2, bcrypt           |
| Data     | FastF1, Pandas                |
| Frontend | Streamlit, Plotly             |
| AI layer | RAG chatbot, LLM pick advisor |
| Infra    | Docker, Docker Compose        |

## Quick start

### Docker (recommended)

```bash
git clone https://github.com/Aabhaskhandelwal/DreamF1
cd DreamF1
docker compose up --build
```

- Frontend: http://localhost:8501
- API docs: http://localhost:8080/docs

### Local

```bash
# backend
cd backend && uv sync
uvicorn main:app --port 8080

# frontend
cd ../frontend-prototype && uv sync
streamlit run main.py
```

### Environment variables

Create a `.env` file in `/backend`:

```env
# database
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=f1db

# auth
SECRET_KEY=your_secret_key
ALGORITHM=HS256
```

## Ongoing

- [ ] Next.js production frontend — replacing Streamlit with a proper React frontend
- [ ] ML prediction model — historical F1 data → podium probabilities, DNF risk per driver and circuit, with confidence scores

## Contributing

1. Fork the repo and clone it
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes and commit: `git commit -m "feat: describe what this does"`
4. Open a PR — describe what you changed and why

For bugs, open an issue first. For bigger ideas, start a discussion.
