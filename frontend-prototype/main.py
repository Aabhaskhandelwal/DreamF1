import streamlit as st
import requests

API_URL = "http://localhost:8080"

# ─── Page config ──────────────────────────────────────────────
st.set_page_config(page_title="DreamF1", layout="centered")

# ─── Custom CSS ───────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');

html, body, [class*="css"] {
    font-family: 'DM Sans', sans-serif;
    background-color: #0e0e0e;
    color: #e8e8e8;
}

/* kill default streamlit padding bloat */
.block-container { padding: 3rem 2rem 4rem 2rem; max-width: 820px; }

h1, h2, h3 { font-weight: 300; letter-spacing: -0.02em; }

/* header */
.dm-header {
    border-bottom: 1px solid #2a2a2a;
    padding-bottom: 1.2rem;
    margin-bottom: 2.5rem;
}
.dm-title {
    font-family: 'DM Mono', monospace;
    font-size: 1.1rem;
    color: #888;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin: 0;
}
.dm-subtitle {
    font-size: 2.2rem;
    font-weight: 300;
    color: #e8e8e8;
    margin: 0.2rem 0 0 0;
    letter-spacing: -0.03em;
}

/* section label */
.dm-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.7rem;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 0.8rem;
}

/* inputs */
div[data-testid="stTextInput"] input {
    background: #161616 !important;
    border: 1px solid #2a2a2a !important;
    border-radius: 6px !important;
    color: #e8e8e8 !important;
    font-family: 'DM Sans', sans-serif !important;
    font-size: 0.9rem !important;
    padding: 0.5rem 0.75rem !important;
    transition: border-color 0.2s;
}
div[data-testid="stTextInput"] input:focus {
    border-color: #c0392b !important;
    box-shadow: none !important;
}

/* buttons */
div[data-testid="stButton"] > button {
    background: transparent !important;
    border: 1px solid #2a2a2a !important;
    border-radius: 6px !important;
    color: #e8e8e8 !important;
    font-family: 'DM Mono', monospace !important;
    font-size: 0.75rem !important;
    letter-spacing: 0.06em !important;
    text-transform: uppercase !important;
    padding: 0.45rem 1.2rem !important;
    transition: all 0.18s ease !important;
    width: 100%;
}
div[data-testid="stButton"] > button:hover {
    background: #c0392b !important;
    border-color: #c0392b !important;
    color: #fff !important;
}

/* tabs */
div[data-testid="stTabs"] button {
    font-family: 'DM Mono', monospace !important;
    font-size: 0.75rem !important;
    letter-spacing: 0.06em !important;
    text-transform: uppercase !important;
    color: #555 !important;
}
div[data-testid="stTabs"] button[aria-selected="true"] {
    color: #e8e8e8 !important;
    border-bottom: 1px solid #c0392b !important;
}

/* dataframe */
div[data-testid="stDataFrame"] { border: 1px solid #1e1e1e; border-radius: 6px; }

/* status messages */
div[data-testid="stAlert"] { border-radius: 6px; border-left: 2px solid #c0392b; }

/* sidebar */
section[data-testid="stSidebar"] {
    background: #0e0e0e !important;
    border-right: 1px solid #1e1e1e !important;
}
section[data-testid="stSidebar"] .block-container { padding: 2rem 1.5rem; }

/* hide streamlit branding */
#MainMenu, footer, header { visibility: hidden; }
</style>
""", unsafe_allow_html=True)

# ─── Header ───────────────────────────────────────────────────
# ─── Header ───────────────────────────────────────────────────
# ─── Header ───────────────────────────────────────────────────
# Read the SVG file once and inline it — avoids the "expires" media cache issue
import pathlib

svg_path = pathlib.Path("public/F1Red.svg")
if svg_path.exists():
    svg_content = svg_path.read_text()
else:
    svg_content = ""  # graceful fallback

st.markdown(f"""
<div class="dm-header" style="display:flex;align-items:center;gap:1rem;">
    <div style="width:48px;flex-shrink:0;">{svg_content}</div>
    <div>
        <p class="dm-title">Fantasy Racing</p>
        <p class="dm-subtitle">DreamF1</p>
    </div>
</div>
""", unsafe_allow_html=True)# ─── Sidebar: Auth ────────────────────────────────────────────
with st.sidebar:
    st.markdown('<p class="dm-label">Account</p>', unsafe_allow_html=True)
    tab1, tab2 = st.tabs(["Login", "Register"])

    with tab1:
        username = st.text_input("Username", key="login_user", label_visibility="collapsed",
                                  placeholder="username")
        password = st.text_input("Password", type="password", key="login_pass",
                                  label_visibility="collapsed", placeholder="password")
        if st.button("Sign in →", key="login_btn"):
            res = requests.post(f"{API_URL}/api/login",
                                data={"username": username, "password": password})
            if res.status_code == 200:
                st.session_state["token"] = res.json()["access_token"]
                st.success("Authenticated.")
            else:
                st.error(res.json().get("detail", "Login failed."))

    with tab2:
        reg_user  = st.text_input("Username", key="reg_user",  label_visibility="collapsed", placeholder="username")
        reg_email = st.text_input("Email",    key="reg_email", label_visibility="collapsed", placeholder="email")
        reg_pass  = st.text_input("Password", type="password", key="reg_pass",
                                   label_visibility="collapsed", placeholder="password")
        if st.button("Create account →", key="reg_btn"):
            res = requests.post(f"{API_URL}/api/register",
                                json={"username": reg_user, "email": reg_email, "password": reg_pass})
            if res.status_code == 200:
                st.success("Account created. Sign in.")
            else:
                st.error(res.json().get("detail", "Registration failed."))

    # Auth status indicator
    st.markdown("---")
    if st.session_state.get("token"):
        st.markdown('<p style="font-family:\'DM Mono\',monospace;font-size:0.7rem;color:#2ecc71;">● connected</p>',
                    unsafe_allow_html=True)
    else:
        st.markdown('<p style="font-family:\'DM Mono\',monospace;font-size:0.7rem;color:#555;">○ not signed in</p>',
                    unsafe_allow_html=True)

# ─── Token + headers ──────────────────────────────────────────
token   = st.session_state.get("token")
headers = {"Authorization": f"Bearer {token}"} if token else {}

# ─── Race Schedule ────────────────────────────────────────────
st.markdown('<p class="dm-label">Race Calendar</p>', unsafe_allow_html=True)
if st.button("Fetch schedule →", key="sched_btn"):
    res = requests.get(f"{API_URL}/api/schedule")
    if res.status_code == 200:
        st.dataframe(res.json(), use_container_width=True)
    else:
        st.error("Could not load schedule.")

st.markdown("<br>", unsafe_allow_html=True)

# ─── Prediction form ──────────────────────────────────────────
st.markdown('<p class="dm-label">Submit Prediction</p>', unsafe_allow_html=True)

if not token:
    st.markdown('<p style="color:#555;font-size:0.85rem;">Sign in to lock a prediction.</p>',
                unsafe_allow_html=True)
else:
    c1, c2 = st.columns(2)
    with c1:
        p1      = st.text_input("P1",           placeholder="VER", label_visibility="visible")
        p2      = st.text_input("P2",           placeholder="NOR", label_visibility="visible")
        p3      = st.text_input("P3",           placeholder="LEC", label_visibility="visible")
    with c2:
        fastest = st.text_input("Fastest Lap",  placeholder="VER", label_visibility="visible")
        pole    = st.text_input("Pole",         placeholder="VER", label_visibility="visible")
        dnf     = st.text_input("DNF",          placeholder="SAR", label_visibility="visible")

    st.markdown("<br>", unsafe_allow_html=True)
    if st.button("Lock prediction 🔒", key="predict_btn"):
        res = requests.post(f"{API_URL}/api/predict", headers=headers,
                            json={"first_place": p1, "second_place": p2, "third_place": p3,
                                  "fastest_lap": fastest, "pole_position": pole, "dnf_driver": dnf})
        if res.status_code == 200:
            st.success(res.json()["message"])
        else:
            st.error(res.json().get("detail", "Prediction failed."))

st.markdown("<br>", unsafe_allow_html=True)

# ─── My Predictions ───────────────────────────────────────────
st.markdown('<p class="dm-label">My Predictions</p>', unsafe_allow_html=True)
if token:
    if st.button("Load →", key="mypreds_btn"):
        res = requests.get(f"{API_URL}/api/predictions", headers=headers)
        if res.status_code == 200:
            st.dataframe(res.json(), use_container_width=True)
        else:
            st.error("Could not load predictions.")
else:
    st.markdown('<p style="color:#555;font-size:0.85rem;">Sign in to view your predictions.</p>',
                unsafe_allow_html=True)