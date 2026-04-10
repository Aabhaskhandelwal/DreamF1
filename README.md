# DreamF1 🏎️
A full-stack Formula 1 platform. View Telemetry and Pick your podium, pole, fastest lap, and DNF before each race — earn points when the real results come in. Track between Friends.

# UI
![dashboard image](frontend-prototype/public/dashboard.png)

## What it does
- Register and authenticate via JWT
- View the live 2026 F1 race calendar
- Submit predictions across 6 categories (P1, P2, P3, Pole, Fastest Lap, DNF)
- Auto-scores results using real race data from the FastF1 API
- Visualize speed traces and tyre strategies from live telemetry

## Stack

| Layer | Tech |
|-------|------|
| Backend | FastAPI, SQLAlchemy, PostgreSQL |
| Auth | JWT, OAuth2, bcrypt |
| Data | FastF1, Pandas |
| Prototype UI | Streamlit, Plotly |
| Production Frontend | Next.js 16, TypeScript, Tailwind CSS v4 *(in progress)* |
| DevOps | Docker, Git |

## Getting started
```bash
# clone
git clone https://github.com/Aabhaskhandelwal/DreamF1
cd DreamF1

# backend
cd backend
uv install
uvicorn main:app --reload --port 8080

# frontend (prototype)
cd ../frontend
pip install streamlit
streamlit run app.py
```

Set up a `.env` file in `/backend`:
```
DATABASE_URL=postgresql://user:password@localhost/dreamf1
SECRET_KEY=your_secret_key
```

## Ongoing

- [ ] Next.js production frontend
- [ ] Chatbot in sidebar
