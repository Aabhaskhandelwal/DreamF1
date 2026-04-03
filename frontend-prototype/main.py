import streamlit as st
import requests
import pathlib
import plotly.graph_objects as go
import pandas as pd
from datetime import date
import base64

API_URL = "http://localhost:8080"

TEAM_COLORS = {
    "VER": "#3671C6", "LAW": "#6692FF",
    "NOR": "#FF8000", "PIA": "#FF8000",
    "LEC": "#E8002D", "HAM": "#E8002D",
    "RUS": "#27F4D2", "ANT": "#27F4D2",
    "ALO": "#358C75", "STR": "#358C75",
    "GAS": "#FF87BC", "DOO": "#FF87BC",
    "ALB": "#64C4FF", "SAI": "#64C4FF",
    "TSU": "#6692FF", "HAD": "#6692FF",
    "HUL": "#B6BABD", "BEA": "#B6BABD",
    "BOT": "#C92D4B", "BOR": "#C92D4B",
}

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
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');

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
    background: rgba(10,10,10,0.88);
    z-index: 0;
}}
.stApp > div {{ position: relative; z-index: 1; }}

.block-container {{ padding: 2rem 3rem 4rem 3rem; max-width: 1200px; }}
h1, h2, h3 {{ font-weight: 300; letter-spacing: -0.02em; }}

/* inputs */
div[data-testid="stTextInput"] input {{
    background: rgba(22,22,22,0.8) !important; border: 1px solid #2a2a2a !important;
    border-radius: 6px !important; color: #e8e8e8 !important;
    font-family: 'DM Sans', sans-serif !important; font-size: 0.9rem !important;
}}
div[data-testid="stTextInput"] input:focus {{ border-color: #c0392b !important; box-shadow: none !important; }}

/* buttons */
div[data-testid="stButton"] > button {{
    background: transparent !important; border: 1px solid #2a2a2a !important;
    border-radius: 6px !important; color: #e8e8e8 !important;
    font-family: 'DM Mono', monospace !important; font-size: 0.72rem !important;
    letter-spacing: 0.06em !important; text-transform: uppercase !important;
    padding: 0.45rem 1.2rem !important; transition: all 0.18s ease !important; width: 100%;
}}
div[data-testid="stButton"] > button:hover {{
    background: #c0392b !important; border-color: #c0392b !important; color: #fff !important;
}}

/* tabs */
div[data-testid="stTabs"] button {{ font-family: 'DM Mono', monospace !important; font-size: 0.72rem !important; letter-spacing: 0.06em !important; text-transform: uppercase !important; color: #555 !important; }}
div[data-testid="stTabs"] button[aria-selected="true"] {{ color: #e8e8e8 !important; border-bottom: 1px solid #c0392b !important; }}

/* sidebar */
section[data-testid="stSidebar"] {{ background: rgba(10,10,10,0.95) !important; border-right: 1px solid #1a1a1a !important; }}

/* dataframe */
div[data-testid="stDataFrame"] {{ border: 1px solid #1e1e1e; border-radius: 6px; }}
div[data-testid="stAlert"] {{ border-radius: 6px; border-left: 2px solid #c0392b; }}

#MainMenu, footer, header {{ visibility: hidden; }}

.brand {{ font-family: 'Orbitron', monospace; font-size: 1.5rem; font-weight: 700; letter-spacing: 0.05em; }}
.brand-sub {{ font-family: 'DM Mono', monospace; font-size: 0.65rem; color: #888; text-transform: uppercase; letter-spacing: 0.1em; }}
.f1-logo {{ width: 44px; }}
</style>
""", unsafe_allow_html=True)

st.markdown(f"""
<div style="display:flex; align-items:center; gap:1rem; padding-bottom:1rem; border-bottom:1px solid #333; margin-bottom:1.5rem;">
    <div class="f1-logo">{svg_content}</div>
    <div>
        <div class="brand">DREAMF1</div>
        <div class="brand-sub">2026 Season · Fantasy Predictions</div>
    </div>
</div>
""", unsafe_allow_html=True)


# --- Sidebar auth ---

with st.sidebar:
    st.subheader("Account")
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
            st.rerun()


token = st.session_state.get("token")
headers = {"Authorization": f"Bearer {token}"} if token else {}


# --- Data fetching (all at top level so @st.cache_data works properly) ---

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
        res = requests.get(f"{API_URL}/api/telemetry/{year}/{round_num}/quali", timeout=30)
        return res.json() if res.status_code == 200 else None
    except Exception:
        return None


schedule = fetch_schedule()
today = str(date.today())
upcoming = [r for r in schedule if r.get("event_date", "9999") >= today]
# past races by date — don't rely on is_completed since that only gets set after scoring
past_races = [r for r in schedule if r.get("event_date", "9999") < today]


# --- Main tabs ---

tab_season, tab_telemetry, tab_predict, tab_my_preds = st.tabs([
    "Season", "Telemetry", "Predict", "My Predictions"
])


# ── Season tab ──────────────────────────────────────────────────

with tab_season:
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Races", len(schedule))
    col2.metric("Completed", len(past_races))
    col3.metric("Remaining", len(upcoming))
    col4.metric("Next Race", upcoming[0]["event_name"] if upcoming else "Season Over")

    st.divider()

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


# ── Telemetry tab ──────────────────────────────────────────────

with tab_telemetry:
    st.caption("Real telemetry via FastF1. First load of a new race can take 30–60s while FastF1 downloads and caches data.")

    # show past races from the schedule, or fall back to a manual round picker
    if past_races:
        round_options = {r["event_name"]: r["round_number"] for r in past_races}
        selected_event = st.selectbox("Select race", list(round_options.keys()))
        selected_round = round_options[selected_event]
        year = 2026
    else:
        st.info("No past races in the schedule yet. You can still pick a round manually.")
        col_y, col_r = st.columns(2)
        year = col_y.number_input("Year", value=2025, min_value=2018, max_value=2026, step=1)
        selected_round = col_r.number_input("Round number", value=1, min_value=1, max_value=24, step=1)

    st.divider()

    telem_key = f"telem_loaded_{year}_{selected_round}"
    if not st.session_state.get(telem_key):
        st.info("Telemetry data is fetched on demand — first load can take 30–60s while FastF1 downloads race data.")
        if st.button("Load telemetry", use_container_width=False):
            st.session_state[telem_key] = True
            st.rerun()
    else:
        col_speed, col_quali = st.columns(2)

        with col_speed:
            st.subheader("Fastest Lap — Speed Trace")
            with st.spinner("Loading... (may take a minute first time)"):
                speed_data = fetch_speed(year, selected_round)

            if speed_data and speed_data.get("drivers"):
                fig = go.Figure()
                for drv, d in speed_data["drivers"].items():
                    color = TEAM_COLORS.get(drv, "#aaaaaa")
                    fig.add_trace(go.Scatter(
                        x=d["distance"],
                        y=d["speed"],
                        name=drv,
                        line=dict(color=color, width=2),
                        hovertemplate="%{y:.0f} km/h<extra>" + drv + "</extra>"
                    ))
                fig.update_layout(
                    xaxis_title="Distance (m)",
                    yaxis_title="Speed (km/h)",
                    legend=dict(orientation="h", y=1.1),
                    margin=dict(l=40, r=20, t=10, b=40),
                    height=320,
                )
                st.plotly_chart(fig, use_container_width=True)
            elif speed_data is not None:
                st.warning("FastF1 returned no driver data for this race.")
            else:
                st.error("Could not fetch speed data. Check the backend is running and FastF1 has data for this round.")

        with col_quali:
            st.subheader("Qualifying Times")
            with st.spinner("Loading..."):
                quali_data = fetch_quali(year, selected_round)

            if quali_data and quali_data.get("results"):
                df_q = pd.DataFrame(quali_data["results"])
                df_q = df_q.rename(columns={"Abbreviation": "Driver"})

                def fmt_time(secs):
                    if secs is None:
                        return "—"
                    m = int(secs // 60)
                    s = secs % 60
                    return f"{m}:{s:06.3f}"

                for col in ["Q1", "Q2", "Q3"]:
                    if col in df_q.columns:
                        df_q[col] = df_q[col].apply(fmt_time)

                st.dataframe(df_q, use_container_width=True, hide_index=True)
            elif quali_data is not None:
                st.warning("No qualifying results found.")
            else:
                st.error("Could not fetch qualifying data.")

        st.subheader("Tyre Strategy")
        with st.spinner("Loading..."):
            tyre_data = fetch_tyres(year, selected_round)

        if tyre_data and tyre_data.get("stints"):
            stints = tyre_data["stints"]
            drivers_order = list(dict.fromkeys(s["driver"] for s in stints))

            fig_t = go.Figure()
            seen = set()
            for stint in stints:
                drv = stint["driver"]
                compound = stint["compound"].upper()
                color = COMPOUND_COLORS.get(compound, "#888888")
                length = stint["lap_end"] - stint["lap_start"] + 1
                show_leg = compound not in seen
                seen.add(compound)

                fig_t.add_trace(go.Bar(
                    y=[drv],
                    x=[length],
                    base=stint["lap_start"] - 1,
                    orientation="h",
                    name=compound,
                    marker_color=color,
                    marker_line=dict(color="#111", width=0.5),
                    showlegend=show_leg,
                    legendgroup=compound,
                    hovertemplate=f"{drv} · {compound}<br>Laps {stint['lap_start']}–{stint['lap_end']}<extra></extra>"
                ))

            fig_t.update_layout(
                barmode="overlay",
                xaxis_title="Lap",
                yaxis=dict(categoryorder="array", categoryarray=drivers_order[::-1]),
                legend=dict(orientation="h", y=1.05),
                margin=dict(l=50, r=20, t=10, b=40),
                height=380,
            )
            st.plotly_chart(fig_t, use_container_width=True)
        elif tyre_data is not None:
            st.warning("No tyre data found.")
        else:
            st.error("Could not fetch tyre data.")


# ── Predict tab ─────────────────────────────────────────────────

with tab_predict:
    if not token:
        st.info("Sign in via the sidebar to submit predictions.")
    elif not upcoming:
        st.warning("No upcoming races to predict.")
    else:
        next_race = upcoming[0]
        st.subheader(f"Next race: {next_race['event_name']} — {next_race['event_date']}")

        drivers_list = [
            "VER", "LAW", "NOR", "PIA", "LEC", "HAM",
            "RUS", "ANT", "ALO", "STR", "GAS", "DOO",
            "ALB", "SAI", "TSU", "HAD", "HUL", "BEA",
            "BOT", "BOR"
        ]

        with st.form("prediction_form"):
            c1, c2, c3 = st.columns(3)
            with c1:
                p1 = st.selectbox("P1 — Winner", drivers_list)
                p2 = st.selectbox("P2", drivers_list, index=1)
            with c2:
                p3 = st.selectbox("P3", drivers_list, index=2)
                fastest = st.selectbox("Fastest Lap", drivers_list)
            with c3:
                pole = st.selectbox("Pole Position", drivers_list)
                dnf = st.selectbox("DNF (optional)", ["None"] + drivers_list)

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


# ── My Predictions tab ──────────────────────────────────────────

with tab_my_preds:
    if not token:
        st.info("Sign in to see your predictions.")
    else:
        try:
            res = requests.get(f"{API_URL}/api/predictions", headers=headers, timeout=5)
            if res.status_code == 200:
                preds = res.json()
                if not preds:
                    st.info("No predictions yet.")
                else:
                    df = pd.DataFrame(preds)
                    df = df.rename(columns={
                        "event_id": "Race",
                        "first_place": "P1", "second_place": "P2", "third_place": "P3",
                        "pole_position": "Pole", "fastest_lap": "FL", "dnf_driver": "DNF",
                        "points_earned": "Points"
                    })
                    show_cols = [c for c in ["Race", "P1", "P2", "P3", "Pole", "FL", "DNF", "Points"] if c in df.columns]
                    st.dataframe(df[show_cols], use_container_width=True, hide_index=True)

                    total = sum(p.get("points_earned", 0) for p in preds)
                    st.metric("Total Points", total)
        except Exception:
            st.warning("Could not load predictions")
