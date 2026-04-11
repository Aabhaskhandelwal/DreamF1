import streamlit as st
import requests
import pathlib
import plotly.graph_objects as go
import pandas as pd
import numpy as np
from datetime import date
import base64
import os

API_URL = os.getenv("API_URL", "http://localhost:8080")

# 2026 Season
TEAM_COLORS = {
    # Red Bull Racing
    "VER": "#4781D7", "HAD": "#4781D7",
    # McLaren
    "NOR": "#F47600", "PIA": "#F47600",
    # Ferrari
    "LEC": "#ED1131", "HAM": "#ED1131",
    # Mercedes
    "RUS": "#00D7B6", "ANT": "#00D7B6",
    # Aston Martin
    "ALO": "#229971", "STR": "#229971",
    # Alpine
    "GAS": "#00A1E8", "COL": "#00A1E8",
    # Williams
    "ALB": "#1868DB", "SAI": "#1868DB",
    # Racing Bulls
    "LAW": "#6C98FF", "LIN": "#6C98FF",
    # Audi (fka Kick Sauber)
    "HUL": "#F50537", "BOR": "#F50537",
    # Haas
    "BEA": "#9C9FA2", "OCO": "#9C9FA2",
    # Cadillac
    "BOT": "#909090", "PER": "#909090",
}

DRIVERS_2026 = [
    "VER", "HAD",   # Red Bull
    "NOR", "PIA",   # McLaren
    "LEC", "HAM",   # Ferrari
    "RUS", "ANT",   # Mercedes
    "ALO", "STR",   # Aston Martin
    "GAS", "COL",   # Alpine
    "ALB", "SAI",   # Williams
    "LAW", "LIN",   # Racing Bulls
    "HUL", "BOR",   # Audi
    "BEA", "OCO",   # Haas
    "BOT", "PER",   # Cadillac
]

COMPOUND_COLORS = {
    "SOFT": "#FF3333",
    "MEDIUM": "#FFC300",
    "HARD": "#FFFFFF",
    "INTERMEDIATE": "#39B54A",
    "WET": "#0067FF",
    "UNKNOWN": "#888888",
}

st.set_page_config(page_title="DreamF1", layout="wide", initial_sidebar_state="expanded")

svg_content = ""
svg_path = pathlib.Path("public/F1Red.svg")
if svg_path.exists():
    svg_content = svg_path.read_text()

bg_path = pathlib.Path("public/f1telemetrybg_v1.png")
bg_b64 = ""
if bg_path.exists():
    bg_b64 = base64.b64encode(bg_path.read_bytes()).decode()

st.markdown(f"""
<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');

html, body, [class*="css"] {{
    font-family: 'DM Sans', sans-serif;
    background-color: #0a0a0a;
    color: #e0e0e0;
}}

.stApp {{
    background-image: url("data:image/png;base64,{bg_b64}");
    background-size: cover;
    background-position: center top;
    background-repeat: no-repeat;
    background-attachment: fixed;
}}
.stApp::before {{
    content: "";
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(10,10,10,0.92);
    z-index: 0;
}}
.stApp > div {{ position: relative; z-index: 1; }}

.block-container {{ padding: 2rem 3rem 4rem 3rem; max-width: 1200px; }}
h1, h2, h3 {{ font-weight: 300; letter-spacing: -0.02em; color: #f3f3f3; }}

/* metrics */
div[data-testid="stMetric"] {{
    background: rgba(22,22,22,0.7);
    border: 1px solid #1e1e1e;
    border-radius: 8px;
    padding: 0.8rem 1rem;
}}
div[data-testid="stMetric"] label {{ color: #666 !important; font-family: 'DM Mono', monospace !important; font-size: 0.65rem !important; text-transform: uppercase; letter-spacing: 0.1em; }}
div[data-testid="stMetric"] [data-testid="stMetricValue"] {{ color: #f3f3f3 !important; font-family: 'Orbitron', monospace !important; font-size: 1.3rem !important; }}

/* inputs */
div[data-testid="stTextInput"] input {{
    background: rgba(22,22,22,0.8) !important; border: 1px solid #2a2a2a !important;
    border-radius: 6px !important; color: #e8e8e8 !important;
    font-family: 'DM Sans', sans-serif !important; font-size: 0.9rem !important;
}}
div[data-testid="stTextInput"] input:focus {{ border-color: #ED1131 !important; box-shadow: 0 0 0 1px #ED113133 !important; }}

/* selectbox */
div[data-testid="stSelectbox"] > div > div {{
    background: rgba(22,22,22,0.8) !important; border: 1px solid #2a2a2a !important;
    border-radius: 6px !important; color: #e8e8e8 !important;
}}

/* buttons */
div[data-testid="stButton"] > button {{
    background: transparent !important; border: 1px solid #2a2a2a !important;
    border-radius: 6px !important; color: #e8e8e8 !important;
    font-family: 'DM Mono', monospace !important; font-size: 0.72rem !important;
    letter-spacing: 0.06em !important; text-transform: uppercase !important;
    padding: 0.45rem 1.2rem !important; transition: all 0.18s ease !important;
}}
div[data-testid="stButton"] > button:hover {{
    background: #ED1131 !important; border-color: #ED1131 !important; color: #fff !important;
}}

/* form submit button */
div[data-testid="stFormSubmitButton"] > button {{
    background: #ED1131 !important; border: none !important;
    border-radius: 6px !important; color: #fff !important;
    font-family: 'DM Mono', monospace !important; font-size: 0.72rem !important;
    letter-spacing: 0.1em !important; text-transform: uppercase !important;
    padding: 0.6rem 1.2rem !important; width: 100% !important;
    transition: all 0.18s ease !important;
}}
div[data-testid="stFormSubmitButton"] > button:hover {{
    background: #b5001e !important;
}}

/* tabs */
div[data-testid="stTabs"] button {{
    font-family: 'DM Mono', monospace !important; font-size: 0.7rem !important;
    letter-spacing: 0.08em !important; text-transform: uppercase !important;
    color: #555 !important; padding: 0.5rem 1rem !important;
}}
div[data-testid="stTabs"] button[aria-selected="true"] {{
    color: #f3f3f3 !important; border-bottom: 2px solid #ED1131 !important;
}}

/* sidebar */
section[data-testid="stSidebar"] {{
    background: rgba(10,10,10,0.97) !important;
    border-right: 1px solid #1a1a1a !important;
}}
section[data-testid="stSidebar"] .stSubheader {{
    font-family: 'DM Mono', monospace !important; font-size: 0.65rem !important;
    text-transform: uppercase; letter-spacing: 0.1em; color: #555;
}}

/* dataframe */
div[data-testid="stDataFrame"] {{
    border: 1px solid #1e1e1e; border-radius: 8px;
    background: rgba(17,17,17,0.6);
}}

/* alerts */
div[data-testid="stAlert"] {{ border-radius: 6px; border-left: 2px solid #ED1131; background: rgba(237,17,49,0.08) !important; }}
div[data-testid="stAlert"][data-baseweb="notification"] {{ border-left-color: #229971; background: rgba(34,153,113,0.08) !important; }}

/* divider */
hr {{ border-color: #1e1e1e !important; }}

/* scrollbar */
::-webkit-scrollbar {{ width: 6px; height: 6px; }}
::-webkit-scrollbar-track {{ background: #111; }}
::-webkit-scrollbar-thumb {{ background: #333; border-radius: 3px; }}
::-webkit-scrollbar-thumb:hover {{ background: #555; }}

#MainMenu, footer, header {{ visibility: hidden; }}

/* custom components */
.brand {{ font-family: 'Orbitron', monospace; font-size: 1.5rem; font-weight: 700; letter-spacing: 0.05em; color: #f3f3f3; }}
.brand-sub {{ font-family: 'DM Mono', monospace; font-size: 0.62rem; color: #555; text-transform: uppercase; letter-spacing: 0.12em; margin-top: 2px; }}
.f1-logo {{ width: 44px; }}

.race-card {{
    background: rgba(17,17,17,0.8);
    border: 1px solid #1e1e1e;
    border-left: 3px solid #ED1131;
    border-radius: 8px;
    padding: 1rem 1.2rem;
    margin-bottom: 1rem;
}}
.race-card-title {{
    font-family: 'Orbitron', monospace; font-size: 0.9rem; font-weight: 500;
    color: #f3f3f3; letter-spacing: 0.04em;
}}
.race-card-date {{
    font-family: 'DM Mono', monospace; font-size: 0.7rem; color: #666;
    text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px;
}}

.leaderboard-row {{
    display: flex; align-items: center; gap: 1rem;
    background: rgba(17,17,17,0.6);
    border: 1px solid #1e1e1e; border-radius: 6px;
    padding: 0.6rem 1rem; margin-bottom: 0.4rem;
}}
.rank-badge {{
    font-family: 'Orbitron', monospace; font-size: 0.75rem; font-weight: 700;
    width: 28px; text-align: center; color: #555;
}}
.rank-badge.top {{ color: #ED1131; }}
.lb-name {{ font-size: 0.9rem; flex: 1; color: #e0e0e0; }}
.lb-pts {{ font-family: 'DM Mono', monospace; font-size: 0.8rem; color: #ED1131; }}

.group-card {{
    background: rgba(17,17,17,0.7);
    border: 1px solid #1e1e1e;
    border-radius: 8px;
    padding: 1rem 1.2rem;
    margin-bottom: 0.6rem;
    cursor: pointer;
    transition: border-color 0.15s;
}}
.group-card:hover {{ border-color: #333; }}
.group-name {{ font-family: 'DM Sans', sans-serif; font-size: 0.95rem; font-weight: 500; color: #f3f3f3; }}
.group-meta {{ font-family: 'DM Mono', monospace; font-size: 0.65rem; color: #555; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.08em; }}
.invite-code {{
    font-family: 'DM Mono', monospace; font-size: 0.8rem;
    background: rgba(237,17,49,0.12); border: 1px solid rgba(237,17,49,0.25);
    border-radius: 4px; padding: 2px 8px; color: #ED1131; letter-spacing: 0.1em;
}}

.section-label {{
    font-family: 'DM Mono', monospace; font-size: 0.62rem; color: #555;
    text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 0.6rem;
}}
</style>
""", unsafe_allow_html=True)

# ── Header ───────────────────────────────────────────────────────

st.markdown(f"""
<div style="display:flex; align-items:center; gap:1rem; padding-bottom:1rem; border-bottom:1px solid #1a1a1a; margin-bottom:1.5rem;">
    <div class="f1-logo">{svg_content}</div>
    <div>
        <div class="brand">DREAMF1</div>
        <div class="brand-sub">2026 Season · Fantasy Predictions</div>
    </div>
</div>
""", unsafe_allow_html=True)


# ── Sidebar auth ─────────────────────────────────────────────────

with st.sidebar:
    st.markdown('<div class="section-label">Account</div>', unsafe_allow_html=True)
    tab_in, tab_reg = st.tabs(["Sign in", "Register"])

    with tab_in:
        username = st.text_input("Username", key="login_user", placeholder="username")
        password = st.text_input("Password", type="password", key="login_pass", placeholder="password")
        if st.button("Sign in", key="login_btn", use_container_width=True):
            try:
                res = requests.post(f"{API_URL}/api/login", data={"username": username, "password": password})
                if res.status_code == 200:
                    st.session_state["token"] = res.json()["access_token"]
                    st.session_state["username"] = username
                    st.rerun()
                else:
                    st.error(res.json().get("detail", "Login failed"))
            except requests.ConnectionError:
                st.error("Backend not running on :8080")

    with tab_reg:
        reg_user = st.text_input("Username", key="reg_user", placeholder="username")
        reg_email = st.text_input("Email", key="reg_email", placeholder="email")
        reg_pass = st.text_input("Password", type="password", key="reg_pass", placeholder="password")
        if st.button("Create account", key="reg_btn", use_container_width=True):
            try:
                res = requests.post(f"{API_URL}/api/register", json={"username": reg_user, "email": reg_email, "password": reg_pass})
                if res.status_code == 200:
                    st.success("Account created! Sign in above.")
                else:
                    st.error(res.json().get("detail", "Registration failed"))
            except requests.ConnectionError:
                st.error("Backend not running on :8080")

    st.divider()
    if st.session_state.get("token"):
        st.success(f"Signed in as **{st.session_state.get('username', 'you')}**")
        if st.button("Sign out", use_container_width=True):
            st.session_state.pop("token", None)
            st.session_state.pop("username", None)
            st.session_state.pop("selected_group_id", None)
            st.session_state.pop("selected_group_name", None)
            st.rerun()


token = st.session_state.get("token")
headers = {"Authorization": f"Bearer {token}"} if token else {}

# ── Backend health check ──────────────────────────────────────────
_backend_online = False
try:
    _r = requests.get(f"{API_URL}/", timeout=2)
    _backend_online = _r.status_code == 200
except Exception:
    pass

if not _backend_online:
    st.markdown("""
    <div style="background:rgba(237,17,49,0.08);border:1px solid rgba(237,17,49,0.3);
    border-radius:8px;padding:0.75rem 1.2rem;margin-bottom:1rem;display:flex;align-items:center;gap:0.8rem;">
        <span style="color:#ED1131;font-size:1rem;">●</span>
        <span style="font-family:'DM Mono',monospace;font-size:0.75rem;color:#ccc;">
        Backend offline — start it with <code style="background:rgba(255,255,255,0.06);padding:2px 6px;border-radius:3px;">
        uvicorn main:app --port 8080</code> from the <code style="background:rgba(255,255,255,0.06);padding:2px 6px;border-radius:3px;">backend/</code> directory
        </span>
    </div>
    """, unsafe_allow_html=True)

# ── Cached data fetchers ──────────────────────────────────────────

@st.cache_data(ttl=3600)
def fetch_schedule():
    try:
        res = requests.get(f"{API_URL}/api/schedule", timeout=10)
        return res.json() if res.status_code == 200 else []
    except Exception:
        return []

@st.cache_data(ttl=86400)
def fetch_speed(year, round_num):
    try:
        res = requests.get(f"{API_URL}/api/telemetry/{year}/{round_num}/speed", timeout=90)
        return res.json() if res.status_code == 200 else None
    except Exception:
        return None

@st.cache_data(ttl=86400)
def fetch_tyres(year, round_num):
    try:
        res = requests.get(f"{API_URL}/api/telemetry/{year}/{round_num}/tyres", timeout=30)
        return res.json() if res.status_code == 200 else None
    except Exception:
        return None

@st.cache_data(ttl=86400)
def fetch_quali(year, round_num):
    try:
        res = requests.get(f"{API_URL}/api/telemetry/{year}/{round_num}/quali", timeout=60)
        if res.status_code == 200:
            return res.json()
        # Expose the actual backend error so we can debug it
        return {"_error": res.json().get("detail", f"HTTP {res.status_code}")}
    except Exception as e:
        return {"_error": str(e)}

@st.cache_data(ttl=86400)
def fetch_laptimes(year, round_num):
    try:
        res = requests.get(f"{API_URL}/api/telemetry/{year}/{round_num}/laptimes", timeout=60)
        if res.status_code == 200:
            return res.json()
        return {"_error": res.json().get("detail", f"HTTP {res.status_code}")}
    except Exception as e:
        return {"_error": str(e)}

@st.cache_data(ttl=86400)
def fetch_positions(year, round_num):
    try:
        res = requests.get(f"{API_URL}/api/telemetry/{year}/{round_num}/positions", timeout=60)
        if res.status_code == 200:
            return res.json()
        return {"_error": res.json().get("detail", f"HTTP {res.status_code}")}
    except Exception as e:
        return {"_error": str(e)}

@st.cache_data(ttl=86400)
def fetch_gaps(year, round_num):
    try:
        res = requests.get(f"{API_URL}/api/telemetry/{year}/{round_num}/gaps", timeout=60)
        if res.status_code == 200:
            return res.json()
        return {"_error": res.json().get("detail", f"HTTP {res.status_code}")}
    except Exception as e:
        return {"_error": str(e)}

@st.cache_data(ttl=86400)
def fetch_race_summary(year, round_num):
    try:
        res = requests.get(f"{API_URL}/api/telemetry/{year}/{round_num}/race_summary", timeout=60)
        if res.status_code == 200:
            return res.json()
        return {"_error": res.json().get("detail", f"HTTP {res.status_code}")}
    except Exception as e:
        return {"_error": str(e)}

@st.cache_data(ttl=86400)
def fetch_sector_times(year, round_num):
    try:
        res = requests.get(f"{API_URL}/api/telemetry/{year}/{round_num}/sector_times", timeout=60)
        if res.status_code == 200:
            return res.json()
        return {"_error": res.json().get("detail", f"HTTP {res.status_code}")}
    except Exception as e:
        return {"_error": str(e)}


schedule = fetch_schedule()
today = str(date.today())
upcoming = [r for r in schedule if r.get("event_date", "9999") >= today]
past_races = [r for r in schedule if r.get("event_date", "9999") < today]


# ── Main tabs ────────────────────────────────────────────────────

tab_season, tab_telemetry, tab_predict, tab_my_preds, tab_groups = st.tabs([
    "Season", "Telemetry", "Predict", "My Predictions", "My Circles"
])


# ── Season tab ───────────────────────────────────────────────────

with tab_season:
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Races", len(schedule))
    col2.metric("Completed", len(past_races))
    col3.metric("Remaining", len(upcoming))
    event = upcoming[0] if upcoming else {}
    event_name = event.get("event_name") or event.get("name") or "Season Over"
    col4.metric("Next Race", event_name)

    st.divider()

    if upcoming:
        next_r = upcoming[0]
        next_r_name = next_r.get("event_name") or next_r.get("name") or "Next Race"
        st.markdown(f"""
        <div class="race-card">
            <div class="race-card-title">▶ {next_r_name}</div>
            <div class="race-card-date">{next_r.get("country", "")} · {next_r.get("event_date", "")} · Round {next_r.get("round_number", "")}</div>
        </div>
        """, unsafe_allow_html=True)

    if schedule:
        df = pd.DataFrame(schedule)
        df = df.rename(columns={
            "round_number": "Round",
            "event_name": "Grand Prix",
            "country": "Country",
            "event_date": "Date",
            "is_completed": "Scored",
        })
        cols = [c for c in ["Round", "Grand Prix", "Country", "Date", "Scored"] if c in df.columns]
        st.dataframe(df[cols], use_container_width=True, hide_index=True)
    else:
        st.warning("Could not load schedule — is the backend running?")


# ── Telemetry helpers ────────────────────────────────────────────

def fmt_time(secs):
    if secs is None: return "—"
    m = int(secs // 60)
    s = secs % 60
    return f"{m}:{s:06.3f}"

def _chart(height=320):
    return dict(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(17,17,17,0.6)",
        font=dict(family="DM Mono", color="#666", size=11),
        legend=dict(orientation="h", y=1.1, font=dict(color="#aaa", size=11), bgcolor="rgba(0,0,0,0)"),
        margin=dict(l=50, r=20, t=8, b=40),
        height=height,
        hoverlabel=dict(bgcolor="#111", font_size=12, font_family="DM Mono"),
    )

def _axis(**kw):
    return dict(gridcolor="#1e1e1e", color="#666", zerolinecolor="#2a2a2a", **kw)

def _tower_row(pos, drv, team_color, cells_html, extra=""):
    return f"""
    <tr style="border-top:1px solid #1a1a1a;background:linear-gradient(90deg,{team_color}22 0%,transparent 55%);">
        <td style="padding:7px 8px;color:#555;font-size:0.75rem;">{pos}</td>
        <td style="padding:7px 8px;">
            <span style="display:inline-block;width:3px;height:13px;background:{team_color};
            border-radius:2px;margin-right:8px;vertical-align:middle;"></span>
            <span style="color:#f3f3f3;font-weight:500;">{drv}</span>{extra}
        </td>
        {cells_html}
    </tr>"""

def _tower_head(cols):
    ths = "".join(f'<th style="padding:5px 8px;text-align:right;">{c}</th>' for c in cols)
    return f"""<table style="width:100%;border-collapse:collapse;font-family:'DM Mono',monospace;font-size:0.77rem;">
    <thead><tr style="color:#3a3a3a;font-size:0.6rem;text-transform:uppercase;letter-spacing:0.08em;">
    <th style="padding:5px 8px;text-align:left;width:28px;">POS</th>
    <th style="padding:5px 8px;text-align:left;">DRIVER</th>{ths}
    </tr></thead><tbody>"""

def _td(val, color="#ccc", align="right"):
    return f'<td style="padding:7px 8px;text-align:{align};color:{color};">{val}</td>'

with tab_telemetry:
    if not _backend_online:
        st.warning("Start the backend to load telemetry data.")
    else:
        # ── Race selector: auto-select most recent past round ────
        year = 2026

        # Build candidate list from schedule + fall back to round before next race
        candidates = [r for r in schedule if r.get("event_date", "9999") < today]
        if not candidates and upcoming:
            # Derive previous round from next upcoming
            next_round = upcoming[0].get("round_number", 2)
            candidates = [r for r in schedule if r.get("round_number", 0) < next_round]
        if not candidates and schedule:
            # Absolute fallback: most recent by round number
            candidates = sorted(schedule, key=lambda r: r.get("round_number", 0))

        if not candidates:
            st.info("No race data available — make sure the backend is running and the schedule is loaded.")
        else:
            round_options = {(r.get("event_name") or r.get("name") or f"Round {r.get('round_number','?')}"): r["round_number"] for r in reversed(candidates)}
            default_race = list(round_options.keys())[0]   # most recent first
            selected_event = st.selectbox("Race", list(round_options.keys()),
                                          index=0, label_visibility="collapsed")
            selected_round = round_options[selected_event]

        telem_key = f"telem_{year}_{selected_round}"
        if not st.session_state.get(telem_key):
            st.markdown("""<div style="text-align:center;padding:3rem 0;color:#333;">
                <div style="font-family:'Orbitron',monospace;font-size:0.9rem;margin-bottom:0.4rem;letter-spacing:0.1em;">TELEMETRY</div>
                <div style="font-family:'DM Mono',monospace;font-size:0.68rem;">First load downloads FastF1 data · 30–60s</div>
            </div>""", unsafe_allow_html=True)
            _, c2, _ = st.columns([1, 1, 1])
            with c2:
                if st.button("Load data", use_container_width=True):
                    st.session_state[telem_key] = True
                    st.rerun()
        else:
            with st.spinner("Loading race + qualifying data..."):
                summary_data = fetch_race_summary(year, selected_round)
                quali_data   = fetch_quali(year, selected_round)
                sector_data  = fetch_sector_times(year, selected_round)
                tyre_data    = fetch_tyres(year, selected_round)

            if summary_data and summary_data.get("_error"):
                st.error(f"Race data: {summary_data['_error']}")
            else:
                results = summary_data.get("results", []) if summary_data else []

                st.markdown(f'<div style="font-family:\'Orbitron\',monospace;font-size:0.75rem;color:#555;letter-spacing:0.1em;margin-bottom:1rem;">PREDICTION INTEL · {summary_data.get("session","")}</div>', unsafe_allow_html=True)

                # ── POLE POSITION ────────────────────────────────
                with st.expander("POLE POSITION", expanded=True):
                    if quali_data and not quali_data.get("_error") and quali_data.get("results"):
                        qr = quali_data["results"]
                        q3_times = {r["Abbreviation"]: r["Q3"] for r in qr if r.get("Q3")}
                        q2_times = {r["Abbreviation"]: r["Q2"] for r in qr if r.get("Q2")}
                        pole_time = min(q3_times.values()) if q3_times else None

                        # Full qualifying tower
                        html = _tower_head(["Q1", "Q2", "Q3"])
                        for i, row in enumerate(qr):
                            drv = row.get("Abbreviation", "—")
                            tc = TEAM_COLORS.get(drv, "#444")
                            q3 = row.get("Q3")
                            is_pole = pole_time and q3 and abs(q3 - pole_time) < 0.001
                            gap_str = ""
                            if q3 and pole_time and not is_pole:
                                gap_str = f" <span style='color:#555;font-size:0.65rem;margin-left:6px;'>+{q3-pole_time:.3f}s</span>"
                            pole_badge = " <span style='color:#c084fc;font-size:0.62rem;margin-left:6px;'>POLE</span>" if is_pole else ""

                            def _qcell(val, highlight=False):
                                if val is None: return _td("—", "#2a2a2a")
                                c = "#c084fc" if highlight else "#ccc"
                                return _td(fmt_time(val), c)

                            cells = _qcell(row.get("Q1")) + _qcell(row.get("Q2")) + _qcell(q3, highlight=is_pole)
                            html += _tower_row(i+1, drv, tc, cells, extra=pole_badge+gap_str)
                        html += "</tbody></table>"
                        st.markdown(html, unsafe_allow_html=True)

                        # Sector dominance
                        if sector_data and not sector_data.get("_error") and sector_data.get("drivers"):
                            sd = sector_data["drivers"]
                            st.markdown('<div class="section-label" style="margin-top:1rem;">Sector Dominance</div>', unsafe_allow_html=True)
                            sec_cols = st.columns(3)
                            for si, sec in enumerate(["s1", "s2", "s3"]):
                                with sec_cols[si]:
                                    times = {d: v[sec] for d, v in sd.items() if v.get(sec)}
                                    if not times: continue
                                    ranked = sorted(times.items(), key=lambda x: x[1])[:5]
                                    best_t = ranked[0][1]
                                    sec_html = f'<div style="font-family:\'DM Mono\',monospace;font-size:0.62rem;color:#555;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.4rem;">Sector {si+1}</div>'
                                    for ri, (d, t) in enumerate(ranked):
                                        tc = TEAM_COLORS.get(d, "#444")
                                        gap = f"+{t-best_t:.3f}" if ri > 0 else "fastest"
                                        col_t = "#c084fc" if ri == 0 else ("#4ade80" if ri == 1 else "#888")
                                        sec_html += f'<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;font-family:\'DM Mono\',monospace;font-size:0.75rem;">'
                                        sec_html += f'<span style="color:{tc};font-size:0.6rem;">●</span>'
                                        sec_html += f'<span style="color:#ccc;width:32px;">{d}</span>'
                                        sec_html += f'<span style="color:{col_t};">{gap}</span>'
                                        sec_html += '</div>'
                                    st.markdown(sec_html, unsafe_allow_html=True)

                        # Q3 gap bar
                        if q3_times and pole_time:
                            ordered = sorted(q3_times.items(), key=lambda x: x[1])
                            fig_q = go.Figure(go.Bar(
                                x=[d for d,_ in ordered],
                                y=[round(t - pole_time, 3) for _,t in ordered],
                                marker_color=[TEAM_COLORS.get(d, "#444") for d,_ in ordered],
                                hovertemplate="%{x}<br>+%{y:.3f}s to pole<extra></extra>",
                            ))
                            fig_q.update_layout(**_chart(220), xaxis=_axis(title="Driver"), yaxis=_axis(title="Gap to Pole (s)"), showlegend=False)
                            st.plotly_chart(fig_q, use_container_width=True)
                    else:
                        st.info("Qualifying data not available for this round.")

                # ── RACE WINNER / PODIUM ─────────────────────────
                with st.expander("RACE WINNER / PODIUM", expanded=True):
                    if results:
                        # Average pace ranked — lower avg = faster race pace
                        pace_data = [(r["abbreviation"], r["avg_lap_time"], r["grid_position"], r["finish_position"], r["positions_gained"]) for r in results if r["avg_lap_time"]]
                        pace_data.sort(key=lambda x: x[1])

                        html = _tower_head(["GRID", "FINISH", "+/-", "AVG PACE", "BEST LAP"])
                        for i, (drv, avg, grid, finish, gained) in enumerate(pace_data):
                            tc = TEAM_COLORS.get(drv, "#444")
                            gained_str = f"+{gained}" if gained and gained > 0 else (str(gained) if gained else "—")
                            gained_color = "#4ade80" if gained and gained > 0 else ("#ED1131" if gained and gained < 0 else "#555")

                            # find best lap for this driver
                            best_raw = next((r["best_lap_time"] for r in results if r["abbreviation"] == drv), None)
                            is_fl = next((r["fastest_lap"] for r in results if r["abbreviation"] == drv), False)
                            fl_badge = " <span style='color:#c084fc;font-size:0.62rem;'>FL</span>" if is_fl else ""

                            cells = (
                                _td(grid or "—", "#666") +
                                _td(finish or "—", "#ccc") +
                                _td(gained_str, gained_color) +
                                _td(fmt_time(avg), "#aaa") +
                                _td(fmt_time(best_raw), "#c084fc" if is_fl else "#4ade80")
                            )
                            html += _tower_row(i+1, drv, tc, cells, extra=fl_badge)
                        html += "</tbody></table>"
                        st.markdown(html, unsafe_allow_html=True)
                        st.caption("AVG PACE excludes in/out laps · BEST LAP purple = fastest lap of race")

                        # Positions gained/lost bar
                        st.markdown('<div class="section-label" style="margin-top:1rem;">Positions Gained / Lost from Grid</div>', unsafe_allow_html=True)
                        gain_data = [(r["abbreviation"], r["positions_gained"]) for r in results if r["positions_gained"] is not None]
                        gain_data.sort(key=lambda x: -x[1])
                        fig_g = go.Figure(go.Bar(
                            x=[d for d,_ in gain_data],
                            y=[g for _,g in gain_data],
                            marker_color=["#4ade80" if g >= 0 else "#ED1131" for _,g in gain_data],
                            hovertemplate="%{x}<br>%{y:+d} positions<extra></extra>",
                        ))
                        fig_g.add_hline(y=0, line_color="#333", line_width=1)
                        fig_g.update_layout(**_chart(220), xaxis=_axis(title="Driver"), yaxis=_axis(title="Positions"), showlegend=False)
                        st.plotly_chart(fig_g, use_container_width=True)

                # ── FASTEST LAP ──────────────────────────────────
                with st.expander("FASTEST LAP", expanded=False):
                    if results:
                        fl_data = [(r["abbreviation"], r["best_lap_time"], r["fastest_lap"]) for r in results if r["best_lap_time"]]
                        fl_data.sort(key=lambda x: x[1])
                        best_t = fl_data[0][1] if fl_data else None

                        html = _tower_head(["BEST LAP", "GAP TO FASTEST", "RACE FL"])
                        for i, (drv, best, is_fl) in enumerate(fl_data):
                            tc = TEAM_COLORS.get(drv, "#444")
                            gap = round(best - best_t, 3) if best_t else None
                            gap_str = f"+{gap:.3f}s" if gap and gap > 0 else ("—" if gap is None else "FASTEST")
                            fl_mark = "YES" if is_fl else "—"
                            cells = (
                                _td(fmt_time(best), "#c084fc" if is_fl else ("#4ade80" if i < 3 else "#aaa")) +
                                _td(gap_str, "#555" if gap else "#c084fc") +
                                _td(fl_mark, "#c084fc" if is_fl else "#333")
                            )
                            html += _tower_row(i+1, drv, tc, cells)
                        html += "</tbody></table>"
                        st.markdown(html, unsafe_allow_html=True)

                        # Best lap bar
                        fig_fl = go.Figure(go.Bar(
                            x=[d for d,_,_ in fl_data],
                            y=[t for _,t,_ in fl_data],
                            marker_color=["#c084fc" if fl else TEAM_COLORS.get(d, "#444") for d,_,fl in fl_data],
                            hovertemplate="%{x}<br>%{y:.3f}s<extra></extra>",
                        ))
                        fig_fl.update_layout(**_chart(220), xaxis=_axis(title="Driver"), yaxis=_axis(title="Best Lap (s)", autorange="reversed"), showlegend=False)
                        st.plotly_chart(fig_fl, use_container_width=True)

                # ── DNF RISK ─────────────────────────────────────
                with st.expander("DNF RISK", expanded=False):
                    if results:
                        dnfs = [r for r in results if r["is_dnf"]]
                        finishers = [r for r in results if not r["is_dnf"]]

                        st.markdown(f'<div style="font-family:\'DM Mono\',monospace;font-size:0.75rem;color:#555;margin-bottom:0.8rem;">{len(dnfs)} DNF{"s" if len(dnfs)!=1 else ""} · {len(finishers)} finishers</div>', unsafe_allow_html=True)

                        html = _tower_head(["FINISH", "STATUS", "LAPS COMPLETED"])
                        all_rows = sorted(results, key=lambda r: (r["is_dnf"] is False, r["finish_position"] or 99))
                        for r in all_rows:
                            drv = r["abbreviation"]
                            tc = TEAM_COLORS.get(drv, "#444")
                            is_dnf = r["is_dnf"]
                            status_color = "#ED1131" if is_dnf else "#4ade80"
                            fin_str = str(r["finish_position"]) if r["finish_position"] else "DNF"
                            cells = (
                                _td(fin_str, "#ED1131" if is_dnf else "#ccc") +
                                _td(r["status"][:22], status_color) +
                                _td(str(r["total_laps"]), "#666")
                            )
                            html += _tower_row(fin_str if not is_dnf else "DNF", drv, tc, cells)
                        html += "</tbody></table>"
                        st.markdown(html, unsafe_allow_html=True)

                # ── TYRE STRATEGY (for strategy prediction) ──────
                with st.expander("TYRE STRATEGY", expanded=False):
                    if tyre_data and tyre_data.get("stints"):
                        stints = tyre_data["stints"]
                        drivers_order = list(dict.fromkeys(s["driver"] for s in stints))
                        fig_t = go.Figure()
                        seen = set()
                        for stint in stints:
                            drv = stint["driver"]
                            compound = stint["compound"].upper()
                            color = COMPOUND_COLORS.get(compound, "#888")
                            length = stint["lap_end"] - stint["lap_start"] + 1
                            show_leg = compound not in seen
                            seen.add(compound)
                            fig_t.add_trace(go.Bar(
                                y=[drv], x=[length], base=stint["lap_start"] - 1,
                                orientation="h", name=compound,
                                marker_color=color, marker_line=dict(color="#111", width=0.4),
                                showlegend=show_leg, legendgroup=compound,
                                hovertemplate=f"{drv} · {compound}<br>Laps {stint['lap_start']}–{stint['lap_end']}<extra></extra>",
                            ))
                        fig_t.update_layout(
                            **_chart(max(300, len(drivers_order) * 28)),
                            barmode="overlay",
                            xaxis=_axis(title="Lap"),
                            yaxis=_axis(categoryorder="array", categoryarray=drivers_order[::-1]),
                        )
                        st.plotly_chart(fig_t, use_container_width=True)



# ── Predict tab ──────────────────────────────────────────────────

with tab_predict:
    if not token:
        st.info("Sign in via the sidebar to submit predictions.")
    elif not upcoming:
        st.warning("No upcoming races to predict.")
    else:
        next_race = upcoming[0]
        next_race_name = next_race.get("event_name") or next_race.get("name") or "Next Race"
        st.markdown(f"""
        <div class="race-card">
            <div class="race-card-title">Predicting: {next_race_name}</div>
            <div class="race-card-date">Round {next_race.get("round_number", "")} · {next_race.get("event_date", "")}</div>
        </div>
        """, unsafe_allow_html=True)

        with st.form("prediction_form"):
            c1, c2, c3 = st.columns(3)
            with c1:
                st.markdown('<div class="section-label">Race Result</div>', unsafe_allow_html=True)
                p1 = st.selectbox("P1 — Winner", DRIVERS_2026)
                p2 = st.selectbox("P2", DRIVERS_2026, index=1)
                p3 = st.selectbox("P3", DRIVERS_2026, index=2)
            with c2:
                st.markdown('<div class="section-label">Special</div>', unsafe_allow_html=True)
                fastest = st.selectbox("Fastest Lap", DRIVERS_2026)
                pole = st.selectbox("Pole Position", DRIVERS_2026)
            with c3:
                st.markdown('<div class="section-label">Risk Pick</div>', unsafe_allow_html=True)
                dnf = st.selectbox("DNF (optional)", ["None"] + DRIVERS_2026)
                st.caption("5 pts if correct")

            st.divider()
            if st.form_submit_button("Lock in prediction", use_container_width=True):
                payload = {
                    "first_place": p1, "second_place": p2, "third_place": p3,
                    "fastest_lap": fastest, "pole_position": pole
                }
                if dnf != "None":
                    payload["dnf_driver"] = dnf
                try:
                    res = requests.post(f"{API_URL}/api/predict", headers=headers, json=payload)
                    if res.status_code == 200:
                        st.success(res.json()["message"])
                    else:
                        st.error(res.json().get("detail", "Prediction failed"))
                except requests.ConnectionError:
                    st.error("Backend not running")


# ── My Predictions tab ───────────────────────────────────────────

with tab_my_preds:
    if not token:
        st.info("Sign in to see your predictions.")
    else:
        try:
            res = requests.get(f"{API_URL}/api/predictions", headers=headers, timeout=5)
            if res.status_code == 200:
                preds = res.json()
                if not preds:
                    st.info("No predictions yet — head to the Predict tab.")
                else:
                    total = sum(p.get("points_earned") or 0 for p in preds)
                    st.metric("Total Points", total)
                    st.divider()

                    df = pd.DataFrame(preds)
                    df = df.rename(columns={
                        "event_id": "Race ID",
                        "first_place": "P1", "second_place": "P2", "third_place": "P3",
                        "pole_position": "Pole", "fastest_lap": "FL", "dnf_driver": "DNF",
                        "points_earned": "Points"
                    })
                    show_cols = [c for c in ["Race ID", "P1", "P2", "P3", "Pole", "FL", "DNF", "Points"] if c in df.columns]
                    st.dataframe(df[show_cols], use_container_width=True, hide_index=True)
        except Exception:
            st.warning("Could not load predictions")


# ── My Circles tab ───────────────────────────────────────────────

with tab_groups:
    if not token:
        st.info("Sign in to manage your Circles.")
    else:
        # ── Create / Join ────────────────────────────────────────
        col_create, col_join = st.columns(2)

        with col_create:
            st.markdown('<div class="section-label">Create a Circle</div>', unsafe_allow_html=True)
            with st.form("create_group_form"):
                group_name = st.text_input("Circle name", placeholder="e.g. Paddock Club")
                if st.form_submit_button("Create", use_container_width=True):
                    if group_name.strip():
                        try:
                            res = requests.post(f"{API_URL}/api/groups", headers=headers, json={"name": group_name.strip()})
                            if res.status_code == 200:
                                g = res.json()
                                st.success(f"Circle created! Share code: **{g['invite_code']}**")
                                st.cache_data.clear()
                                st.rerun()
                            else:
                                st.error(res.json().get("detail", "Failed to create circle"))
                        except requests.ConnectionError:
                            st.error("Backend not running")
                    else:
                        st.warning("Enter a circle name.")

        with col_join:
            st.markdown('<div class="section-label">Join a Circle</div>', unsafe_allow_html=True)
            with st.form("join_group_form"):
                invite = st.text_input("Invite code", placeholder="e.g. a1b2c3")
                if st.form_submit_button("Join", use_container_width=True):
                    if invite.strip():
                        try:
                            res = requests.post(f"{API_URL}/api/groups/join", headers=headers, json={"invite_code": invite.strip()})
                            if res.status_code == 200:
                                st.success(res.json()["message"])
                                st.cache_data.clear()
                                st.rerun()
                            else:
                                st.error(res.json().get("detail", "Failed to join"))
                        except requests.ConnectionError:
                            st.error("Backend not running")
                    else:
                        st.warning("Enter an invite code.")

        st.divider()

        # ── My groups list ───────────────────────────────────────
        try:
            res = requests.get(f"{API_URL}/api/groups", headers=headers, timeout=5)
            groups = res.json() if res.status_code == 200 else []
        except Exception:
            groups = []

        if not groups:
            st.info("You're not in any Circles yet. Create one or ask a friend for their invite code.")
        else:
            selected_group_id = st.session_state.get("selected_group_id")

            # If a group is selected, show its leaderboard
            if selected_group_id:
                selected_group_name = st.session_state.get("selected_group_name", "")
                if st.button("← Back to Circles"):
                    st.session_state.pop("selected_group_id", None)
                    st.session_state.pop("selected_group_name", None)
                    st.rerun()

                st.markdown(f'<div class="section-label" style="margin-top:0.5rem;">Leaderboard · {selected_group_name}</div>', unsafe_allow_html=True)

                try:
                    res = requests.get(f"{API_URL}/api/groups/{selected_group_id}/leaderboard", headers=headers, timeout=5)
                    if res.status_code == 200:
                        board = res.json()
                        if not board:
                            st.info("No scores yet — predictions are scored after each race.")
                        else:
                            medals = {1: "🥇", 2: "🥈", 3: "🥉"}
                            lb_html = ""
                            for entry in board:
                                rank = entry["rank"]
                                medal = medals.get(rank, f"#{rank}")
                                top_class = "top" if rank <= 3 else ""
                                lb_html += f"""
                                <div class="leaderboard-row">
                                    <div class="rank-badge {top_class}">{medal}</div>
                                    <div class="lb-name">{entry['username']}</div>
                                    <div class="lb-pts">{entry['total_points']} pts</div>
                                </div>"""
                            st.markdown(lb_html, unsafe_allow_html=True)
                    else:
                        st.error(res.json().get("detail", "Could not load leaderboard"))
                except Exception:
                    st.error("Could not load leaderboard")

            else:
                # Show group cards
                st.markdown('<div class="section-label">Your Circles</div>', unsafe_allow_html=True)
                for g in groups:
                    col_info, col_btn = st.columns([4, 1])
                    with col_info:
                        st.markdown(f"""
                        <div class="group-card">
                            <div class="group-name">{g['name']}</div>
                            <div class="group-meta">
                                {g['member_count']} member{"s" if g['member_count'] != 1 else ""}
                                &nbsp;·&nbsp;
                                invite: <span class="invite-code">{g['invite_code']}</span>
                            </div>
                        </div>
                        """, unsafe_allow_html=True)
                    with col_btn:
                        st.write("")  # vertical alignment spacer
                        if st.button("Leaderboard", key=f"lb_{g['id']}"):
                            st.session_state["selected_group_id"] = g["id"]
                            st.session_state["selected_group_name"] = g["name"]
                            st.rerun()
