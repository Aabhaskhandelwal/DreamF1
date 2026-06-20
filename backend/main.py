import secrets
import math
import threading
import json
import time
from typing import Any
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select, func
from contextlib import asynccontextmanager
from app.database import create_db_and_tables, get_session, engine
from sqlalchemy import text
from app.models import User, UserCreate, Prediction, PredictionCreate, Event, GroupCreate, GroupMember, Group, GroupJoin
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user
import fastf1 as ff1
import pandas as pd
import numpy as np
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware


def _clean(obj):
    """Recursively replace NaN/inf floats with None for JSON serialization."""
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    if isinstance(obj, dict):
        return {k: _clean(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_clean(v) for v in obj]
    return obj

ff1.Cache.enable_cache("./cache")

# In-memory session cache — avoids re-parsing Parquet files on every request.
# Key: (year, round_num, session_type, telemetry). Double-checked locking prevents
# duplicate loads when concurrent requests race for the same session.
_session_cache: dict[tuple, Any] = {}
_session_locks: dict[tuple, threading.Lock] = {}
_cache_registry_lock = threading.Lock()


def _load_session(year: int, round_num: int, session_type: str, telemetry: bool = False) -> Any:
    key = (year, round_num, session_type, telemetry)
    if key in _session_cache:
        return _session_cache[key]
    with _cache_registry_lock:
        if key not in _session_locks:
            _session_locks[key] = threading.Lock()
        lock = _session_locks[key]
    with lock:
        if key in _session_cache:
            return _session_cache[key]
        session = ff1.get_session(year, round_num, session_type)
        session.load(laps=True, telemetry=telemetry, weather=False)
        _session_cache[key] = session
    return _session_cache[key]


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    with engine.begin() as conn:
        for col, typ in [
            ("fourth_place", "VARCHAR"),
            ("fifth_place", "VARCHAR"),
            ("safety_car", "BOOLEAN"),
        ]:
            conn.execute(text(f"ALTER TABLE prediction ADD COLUMN IF NOT EXISTS {col} {typ}"))
        for i in range(1, 6):
            conn.execute(text(f"ALTER TABLE event ADD COLUMN IF NOT EXISTS session{i}_name VARCHAR"))
            conn.execute(text(f"ALTER TABLE event ADD COLUMN IF NOT EXISTS session{i}_date TIMESTAMP"))
        conn.execute(text("ALTER TABLE prediction ADD COLUMN IF NOT EXISTS score_breakdown TEXT"))
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8501",
        "https://dream-f1.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Welcome to MyF1Circle API!"}


def _parse_session_dt(val) -> "datetime | None":
    """Convert a FastF1 Timestamp to a naive UTC datetime, or None if missing."""
    from datetime import timezone as tz
    if val is None or not pd.notna(val):
        return None
    dt = val.to_pydatetime()
    if dt.tzinfo is not None:
        dt = dt.astimezone(tz.utc).replace(tzinfo=None)
    return dt

def _clean_str(val) -> "str | None":
    s = str(val).strip() if val is not None else ""
    return s if s and s.lower() != "nan" else None

@app.get("/api/schedule")
def get_schedule(session: Session = Depends(get_session)):
    schedule = ff1.get_event_schedule(2026)
    filtered = schedule[schedule['RoundNumber'] > 0]
    existing = {e.round_number: e for e in session.exec(select(Event)).all()}

    result = []
    for _, row in filtered.iterrows():
        rn = int(row['RoundNumber'])
        fields = dict(
            event_name=row['EventName'],
            country=row['Country'],
            event_date=row['EventDate'].to_pydatetime().date(),
            session1_name=_clean_str(row.get('Session1')),
            session1_date=_parse_session_dt(row.get('Session1Date')),
            session2_name=_clean_str(row.get('Session2')),
            session2_date=_parse_session_dt(row.get('Session2Date')),
            session3_name=_clean_str(row.get('Session3')),
            session3_date=_parse_session_dt(row.get('Session3Date')),
            session4_name=_clean_str(row.get('Session4')),
            session4_date=_parse_session_dt(row.get('Session4Date')),
            session5_name=_clean_str(row.get('Session5')),
            session5_date=_parse_session_dt(row.get('Session5Date')),
        )
        if rn in existing:
            ev = existing[rn]
            ev.event_name = fields['event_name']
            ev.country = fields['country']
            ev.event_date = fields['event_date']
            ev.session1_name = fields['session1_name']
            ev.session1_date = fields['session1_date']
            ev.session2_name = fields['session2_name']
            ev.session2_date = fields['session2_date']
            ev.session3_name = fields['session3_name']
            ev.session3_date = fields['session3_date']
            ev.session4_name = fields['session4_name']
            ev.session4_date = fields['session4_date']
            ev.session5_name = fields['session5_name']
            ev.session5_date = fields['session5_date']
        else:
            ev = Event(round_number=rn, **fields)
            session.add(ev)
        result.append(ev)

    session.commit()
    for ev in result:
        session.refresh(ev)
    return result


@app.post("/api/register")
def register_user(user_data: UserCreate, session: Session = Depends(get_session)):
    if session.exec(select(User).where(User.username == user_data.username)).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password)
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return {"message": "User created successfully!", "user_id": new_user.id}


class LoginRequest(BaseModel):
    username: str
    password: str


@app.post("/api/login")
def login(login_data: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == login_data.username)).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/api/predict")
def submit_prediction(
    prediction_data: PredictionCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    next_race = session.exec(
        select(Event)
        .where(Event.event_date >= datetime.now().date())
        .where(Event.is_completed == False)
        .order_by(Event.event_date)
    ).first()

    if not next_race:
        raise HTTPException(status_code=400, detail="No upcoming races found")

    already_predicted = session.exec(
        select(Prediction)
        .where(Prediction.user_id == current_user.id)
        .where(Prediction.event_id == next_race.id)
    ).first()

    if already_predicted:
        raise HTTPException(status_code=400, detail="You already predicted this race")

    new_prediction = Prediction(
        user_id=current_user.id,
        event_id=next_race.id,
        first_place=prediction_data.first_place,
        second_place=prediction_data.second_place,
        third_place=prediction_data.third_place,
        fourth_place=prediction_data.fourth_place,
        fifth_place=prediction_data.fifth_place,
        fastest_lap=prediction_data.fastest_lap,
        dnf_driver=prediction_data.dnf_driver,
        pole_position=prediction_data.pole_position,
        safety_car=prediction_data.safety_car,
    )
    session.add(new_prediction)
    session.commit()
    return {"message": f"Prediction locked in for {next_race.event_name}!", "prediction": new_prediction}


@app.get("/api/predictions")
def get_user_predictions(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    return session.exec(select(Prediction).where(Prediction.user_id == current_user.id)).all()


@app.post("/api/score/{event_id}")
def score_race(event_id: int, session: Session = Depends(get_session)):
    event = session.exec(select(Event).where(Event.id == event_id)).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    try:
        race_session = ff1.get_session(2026, event.round_number, 'R')
        race_session.load(telemetry=False, weather=False)
        quali_session = ff1.get_session(2026, event.round_number, 'Q')
        quali_session.load(telemetry=False, weather=False)
    except Exception:
        raise HTTPException(status_code=400, detail="FastF1 doesn't have results yet")

    results = race_session.results
    if results.empty:
        raise HTTPException(status_code=400, detail="Race results are empty")

    actual_p1 = results.iloc[0]['Abbreviation']
    actual_p2 = results.iloc[1]['Abbreviation']
    actual_p3 = results.iloc[2]['Abbreviation']
    actual_p4 = results.iloc[3]['Abbreviation'] if len(results) > 3 else None
    actual_p5 = results.iloc[4]['Abbreviation'] if len(results) > 4 else None
    actual_fastest = race_session.laps.pick_fastest()['Driver']
    actual_pole = quali_session.results.iloc[0]['Abbreviation']
    actual_dnfs = results[~results['Status'].str.contains(r'Finished|\+', regex=True)]['Abbreviation'].tolist()
    track_statuses = race_session.laps['TrackStatus'].dropna()
    actual_safety_car = bool(track_statuses.str.contains('4').any())

    predictions = session.exec(select(Prediction).where(Prediction.event_id == event_id)).all()
    for pred in predictions:
        p1_pts  = 10 if pred.first_place == actual_p1 else 0
        p2_pts  = 10 if pred.second_place == actual_p2 else 0
        p3_pts  = 10 if pred.third_place == actual_p3 else 0
        p4_pts  = 8  if pred.fourth_place and pred.fourth_place == actual_p4 else 0
        p5_pts  = 6  if pred.fifth_place and pred.fifth_place == actual_p5 else 0
        fl_pts  = 5  if pred.fastest_lap == actual_fastest else 0
        pol_pts = 5  if pred.pole_position == actual_pole else 0
        dnf_pts = 5  if pred.dnf_driver and pred.dnf_driver in actual_dnfs else 0
        sc_pts  = 5  if pred.safety_car is not None and pred.safety_car == actual_safety_car else 0

        old_pts = pred.points_earned or 0
        pred.points_earned = p1_pts + p2_pts + p3_pts + p4_pts + p5_pts + fl_pts + pol_pts + dnf_pts + sc_pts
        pred.score_breakdown = json.dumps({
            "pole": {"pick": pred.pole_position, "actual": actual_pole, "pts": pol_pts},
            "p1":   {"pick": pred.first_place,   "actual": actual_p1,  "pts": p1_pts},
            "p2":   {"pick": pred.second_place,  "actual": actual_p2,  "pts": p2_pts},
            "p3":   {"pick": pred.third_place,   "actual": actual_p3,  "pts": p3_pts},
            "p4":   {"pick": pred.fourth_place,  "actual": actual_p4,  "pts": p4_pts} if pred.fourth_place else None,
            "p5":   {"pick": pred.fifth_place,   "actual": actual_p5,  "pts": p5_pts} if pred.fifth_place else None,
            "fl":   {"pick": pred.fastest_lap,   "actual": actual_fastest, "pts": fl_pts},
            "dnf":  {"pick": pred.dnf_driver,    "actual": ", ".join(actual_dnfs), "pts": dnf_pts} if pred.dnf_driver else None,
            "sc":   {"pick": "Yes" if pred.safety_car else "No", "actual": "Yes" if actual_safety_car else "No", "pts": sc_pts} if pred.safety_car is not None else None,
        })
        session.add(pred)

        # Add only the delta so re-scoring a race stays idempotent
        user = session.get(User, pred.user_id)
        if user:
            user.total_points += (pred.points_earned - old_pts)
            session.add(user)

    event.is_completed = True
    session.add(event)
    session.commit()
    return {"message": f"Scored {len(predictions)} predictions for {event.event_name}"}


@app.post("/api/groups")
def create_group(data: GroupCreate, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    group = Group(
        name=data.name,
        invite_code=secrets.token_hex(6),
        created_by=current_user.id
    )
    session.add(group)
    session.commit()
    session.refresh(group)

    session.add(GroupMember(user_id=current_user.id, group_id=group.id))
    session.commit()
    return {"id": group.id, "name": group.name, "invite_code": group.invite_code, "created_by": group.created_by}


@app.post("/api/groups/join")
def join_group(data: GroupJoin, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    group = session.exec(select(Group).where(Group.invite_code == data.invite_code)).first()
    if not group:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    already_member = session.exec(
        select(GroupMember)
        .where(GroupMember.user_id == current_user.id)
        .where(GroupMember.group_id == group.id)
    ).first()

    if already_member:
        raise HTTPException(status_code=400, detail="Already in this group")

    session.add(GroupMember(user_id=current_user.id, group_id=group.id))
    session.commit()
    return {"message": f"Joined '{group.name}'", "group_name": group.name}


@app.get("/api/groups")
def get_my_groups(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    results = session.exec(
        select(Group.id, Group.name, Group.invite_code, func.count(GroupMember.user_id).label("member_count"))
        .join(GroupMember, Group.id == GroupMember.group_id)
        .where(GroupMember.user_id == current_user.id)
        .group_by(Group.id)
    ).all()

    return [{"id": r.id, "name": r.name, "invite_code": r.invite_code, "member_count": r.member_count} for r in results]


@app.get("/api/groups/{group_id}/leaderboard")
def get_group_leaderboard(group_id: int, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    membership = session.exec(
        select(GroupMember)
        .where(GroupMember.user_id == current_user.id)
        .where(GroupMember.group_id == group_id)
    ).first()

    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")

    results = session.exec(
        select(User.username, User.total_points)
        .join(GroupMember, User.id == GroupMember.user_id)
        .where(GroupMember.group_id == group_id)
        .order_by(User.total_points.desc())
    ).all()

    return [{"rank": i + 1, "username": r.username, "total_points": r.total_points} for i, r in enumerate(results)]


# --- Telemetry endpoints ---

@app.get("/api/telemetry/{year}/{round_num}/speed")
def get_speed_trace(year: int, round_num: int):
    try:
        race = _load_session(year, round_num, 'R', telemetry=True)
    except Exception:
        raise HTTPException(status_code=404, detail="Session data not available yet")

    if race.results.empty:
        raise HTTPException(status_code=404, detail="No results for this session")

    top10 = race.results.iloc[:10]['Abbreviation'].tolist()
    drivers_data = {}

    for drv in top10:
        try:
            fastest = race.laps.pick_driver(drv).pick_fastest()
            tel = fastest.get_telemetry()[['Distance', 'Speed']].dropna()
            # downsample so we're not sending 5000 points per driver
            step = max(1, len(tel) // 300)
            tel = tel.iloc[::step]
            drivers_data[drv] = {
                "distance": tel['Distance'].round(1).tolist(),
                "speed": tel['Speed'].round(1).tolist()
            }
        except Exception:
            continue

    return _clean({"session": race.event['EventName'], "drivers": drivers_data})


@app.get("/api/telemetry/{year}/{round_num}/tyres")
def get_tyre_strategy(year: int, round_num: int):
    try:
        race = _load_session(year, round_num, 'R')
    except Exception:
        raise HTTPException(status_code=404, detail="Session data not available yet")

    drivers = race.results['Abbreviation'].tolist()
    stints = []

    for drv in drivers:
        laps = race.laps.pick_driver(drv)
        if laps.empty:
            continue
        for _, group in laps.groupby('Stint'):
            if group.empty:
                continue
            valid_compounds = group['Compound'].dropna()
            compound = str(valid_compounds.iloc[0]) if not valid_compounds.empty else 'UNKNOWN'
            stints.append({
                "driver": drv,
                "compound": compound,
                "lap_start": int(group['LapNumber'].iloc[0]),
                "lap_end": int(group['LapNumber'].iloc[-1])
            })

    return {"session": race.event['EventName'], "stints": stints}


@app.get("/api/telemetry/{year}/{round_num}/quali")
def get_quali_laptimes(year: int, round_num: int):
    try:
        quali = _load_session(year, round_num, 'Q')

        if quali.results is None or quali.results.empty:
            raise HTTPException(status_code=404, detail="No qualifying results available for this round")

        available_cols = quali.results.columns.tolist()
        keep = [c for c in ['Abbreviation', 'Q1', 'Q2', 'Q3'] if c in available_cols]
        if 'Abbreviation' not in keep:
            raise HTTPException(status_code=500, detail=f"Unexpected results columns: {available_cols}")

        results = quali.results[keep].copy()
        for col in ['Q1', 'Q2', 'Q3']:
            if col in results.columns:
                results[col] = results[col].apply(
                    lambda x: round(x.total_seconds(), 3) if pd.notna(x) and hasattr(x, 'total_seconds') else None
                )

        return _clean({"session": quali.event['EventName'], "results": results.to_dict(orient='records')})

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FastF1 error: {str(e)}")


@app.get("/api/telemetry/{year}/{round_num}/laptimes")
def get_lap_times(year: int, round_num: int):
    """Lap time evolution for top 5 finishers — shows pace over the race."""
    try:
        race = _load_session(year, round_num, 'R')

        if race.results is None or race.results.empty:
            raise HTTPException(status_code=404, detail="No race results available")

        all_drivers = race.results['Abbreviation'].tolist()
        drivers_data = {}

        for drv in all_drivers:
            laps = race.laps.pick_driver(drv).pick_quicklaps()
            if laps.empty:
                continue
            drivers_data[drv] = {
                "lap_numbers": laps['LapNumber'].astype(int).tolist(),
                "lap_times": laps['LapTime'].apply(
                    lambda x: round(x.total_seconds(), 3) if pd.notna(x) and hasattr(x, 'total_seconds') else None
                ).tolist(),
                "compound": laps['Compound'].fillna('UNKNOWN').tolist(),
            }

        return _clean({"session": race.event['EventName'], "drivers": drivers_data})

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FastF1 error: {str(e)}")


@app.get("/api/telemetry/{year}/{round_num}/positions")
def get_race_positions(year: int, round_num: int):
    """Position of each driver lap-by-lap throughout the race."""
    try:
        race = _load_session(year, round_num, 'R')

        if race.results is None or race.results.empty:
            raise HTTPException(status_code=404, detail="No race results available")

        all_drivers = race.results['Abbreviation'].tolist()
        drivers_data = {}

        for drv in all_drivers:
            laps = race.laps.pick_driver(drv)[['LapNumber', 'Position']].dropna()
            if laps.empty:
                continue
            drivers_data[drv] = {
                "lap_numbers": laps['LapNumber'].astype(int).tolist(),
                "positions": laps['Position'].astype(int).tolist(),
            }

        return _clean({"session": race.event['EventName'], "drivers": drivers_data})

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FastF1 error: {str(e)}")


@app.get("/api/telemetry/{year}/{round_num}/gaps")
def get_gap_to_leader(year: int, round_num: int):
    """Gap to race leader per lap for top 5 drivers."""
    try:
        race = _load_session(year, round_num, 'R')

        if race.results is None or race.results.empty:
            raise HTTPException(status_code=404, detail="No race results available")

        all_drivers = race.results['Abbreviation'].tolist()

        # Build a lap-time matrix and compute cumulative gap to leader
        leader = all_drivers[0]
        leader_laps = race.laps.pick_driver(leader).pick_quicklaps()[['LapNumber', 'LapTime']].dropna()
        leader_cumulative = leader_laps.set_index('LapNumber')['LapTime'].apply(
            lambda x: x.total_seconds() if pd.notna(x) else None
        ).dropna().cumsum()

        drivers_data = {}
        for drv in all_drivers:
            laps = race.laps.pick_driver(drv).pick_quicklaps()[['LapNumber', 'LapTime']].dropna()
            if laps.empty:
                continue
            drv_cumulative = laps.set_index('LapNumber')['LapTime'].apply(
                lambda x: x.total_seconds() if pd.notna(x) else None
            ).dropna().cumsum()

            common_laps = sorted(set(leader_cumulative.index) & set(drv_cumulative.index))
            gaps = [(drv_cumulative[lap] - leader_cumulative[lap]) for lap in common_laps]

            drivers_data[drv] = {
                "lap_numbers": common_laps,
                "gap_seconds": [round(g, 3) for g in gaps],
            }

        return _clean({"session": race.event['EventName'], "drivers": drivers_data})

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FastF1 error: {str(e)}")


@app.get("/api/telemetry/{year}/{round_num}/race_summary")
def get_race_summary(year: int, round_num: int):
    """Full classification for all drivers — avg pace, positions gained, DNF, fastest lap."""
    try:
        race = _load_session(year, round_num, 'R')

        if race.results is None or race.results.empty:
            raise HTTPException(status_code=404, detail="No race results available")

        try:
            fastest_lap_driver = race.laps.pick_fastest()['Driver']
        except Exception:
            fastest_lap_driver = None

        summary = []
        for _, row in race.results.iterrows():
            drv = row['Abbreviation']
            drv_laps = race.laps.pick_driver(drv)
            valid_times = drv_laps['LapTime'].dropna()

            avg_s = round(valid_times.mean().total_seconds(), 3) if not valid_times.empty else None
            best_s = round(valid_times.min().total_seconds(), 3) if not valid_times.empty else None
            total_laps = int(drv_laps['LapNumber'].max()) if not drv_laps.empty else 0

            grid_raw = row.get('GridPosition', None)
            finish_raw = row.get('Position', None)
            try:
                grid = int(float(grid_raw)) if grid_raw is not None and str(grid_raw) not in ('', 'nan') else None
            except Exception:
                grid = None
            try:
                finish = int(float(finish_raw)) if finish_raw is not None and str(finish_raw) not in ('', 'nan') else None
            except Exception:
                finish = None

            positions_gained = (grid - finish) if (grid and finish) else None
            status = str(row.get('Status', ''))
            # Finishers: "Finished", "+N Lap(s)" style, or "Lapped"
            is_dnf = status not in ('Finished', 'Lapped') and not status.startswith('+')

            summary.append({
                "abbreviation": drv,
                "finish_position": finish,
                "grid_position": grid,
                "positions_gained": positions_gained,
                "status": status,
                "is_dnf": is_dnf,
                "dnf_lap": total_laps if is_dnf else None,
                "points": float(row.get('Points', 0) or 0),
                "avg_lap_time": avg_s,
                "best_lap_time": best_s,
                "total_laps": total_laps,
                "fastest_lap": (drv == fastest_lap_driver),
            })

        return _clean({"session": race.event['EventName'], "results": summary})

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FastF1 error: {str(e)}")


@app.get("/api/telemetry/{year}/{round_num}/sector_times")
def get_sector_times(year: int, round_num: int):
    """Best sector times per driver from qualifying — for pole prediction."""
    try:
        quali = _load_session(year, round_num, 'Q')

        if quali.results is None or quali.results.empty:
            raise HTTPException(status_code=404, detail="No qualifying results available")

        drivers_data = {}
        for drv in quali.results['Abbreviation'].tolist():
            try:
                laps = quali.laps.pick_driver(drv).pick_quicklaps()
                if laps.empty:
                    continue

                def _sec(col):
                    if col not in laps.columns:
                        return None
                    valid = laps[col].dropna()
                    if valid.empty:
                        return None
                    val = valid.min()
                    return round(val.total_seconds(), 3) if pd.notna(val) and hasattr(val, 'total_seconds') else None

                drivers_data[drv] = {"s1": _sec('Sector1Time'), "s2": _sec('Sector2Time'), "s3": _sec('Sector3Time')}
            except Exception:
                continue

        for sec in ['s1', 's2', 's3']:
            times = {d: v[sec] for d, v in drivers_data.items() if v.get(sec) is not None}
            if times:
                best_drv = min(times, key=times.get)
                for d in drivers_data:
                    drivers_data[d][f'{sec}_best'] = (d == best_drv)

        return _clean({"session": quali.event['EventName'], "drivers": drivers_data})

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FastF1 error: {str(e)}")


@app.get("/api/telemetry/{year}/{round_num}/map")
def get_circuit_map(year: int, round_num: int):
    """Circuit outline from fastest lap GPS coordinates — X/Y in metres."""
    try:
        race = _load_session(year, round_num, 'R', telemetry=True)

        lap = race.laps.pick_fastest()
        tel = lap.get_telemetry()[['X', 'Y']].dropna()

        # Downsample to ~600 points — enough for a smooth outline
        step = max(1, len(tel) // 600)
        tel = tel.iloc[::step]

        return _clean({
            "session": race.event['EventName'],
            "x": tel['X'].round(0).tolist(),
            "y": tel['Y'].round(0).tolist(),
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FastF1 error: {str(e)}")


@app.get("/api/telemetry/{year}/{round_num}/race_pace")
def get_race_pace(year: int, round_num: int):
    """Clean-air race pace per driver: median/best, per-compound, per-stint degradation.

    Clean-air laps exclude lap 1, in/out laps, deleted (track-limits) laps, and any
    lap run under SC/VSC/red (TrackStatus containing 4/5/6/7).
    """
    try:
        race = _load_session(year, round_num, 'R')
        if race.results is None or race.results.empty:
            raise HTTPException(status_code=404, detail="No race results available")

        finish_order = race.results['Abbreviation'].tolist()
        finish_pos = {
            row['Abbreviation']: int(float(row['Position']))
            for _, row in race.results.iterrows()
            if pd.notna(row.get('Position'))
        }

        drivers = []
        for drv in finish_order:
            laps = race.laps.pick_driver(drv)
            if laps.empty:
                continue
            laps = laps[laps['LapTime'].notna()]
            if laps.empty:
                continue

            ts = laps['TrackStatus'].fillna('').astype(str)
            clean_mask = (
                (laps['LapNumber'] > 1)
                & laps['PitInTime'].isna()
                & laps['PitOutTime'].isna()
                & ~ts.str.contains('[4567]', regex=True)
            )
            if 'Deleted' in laps.columns:
                clean_mask = clean_mask & ~laps['Deleted'].fillna(False)
            clean = laps[clean_mask]
            clean_secs = clean['LapTime'].dt.total_seconds()

            n = int(len(clean_secs))
            median = round(float(clean_secs.median()), 3) if n else None
            best = round(float(clean_secs.min()), 3) if n else None
            mean = round(float(clean_secs.mean()), 3) if n else None
            std = round(float(clean_secs.std()), 3) if n > 1 else None

            compounds = []
            if n:
                for comp, grp in clean.groupby('Compound'):
                    cs = grp['LapTime'].dt.total_seconds()
                    if not len(cs):
                        continue
                    compounds.append({
                        "compound": str(comp),
                        "laps": int(len(cs)),
                        "median": round(float(cs.median()), 3),
                        "best": round(float(cs.min()), 3),
                    })

            stints = []
            for stint_no, grp in laps.groupby('Stint'):
                comp_vals = grp['Compound'].dropna()
                comp = str(comp_vals.iloc[0]) if not comp_vals.empty else 'UNKNOWN'
                cg = clean[clean['Stint'] == stint_no]
                cs = cg['LapTime'].dt.total_seconds()
                stint_median = round(float(cs.median()), 3) if len(cs) else None
                deg = None
                if len(cs) >= 3:
                    try:
                        slope = float(np.polyfit(cg['LapNumber'].astype(float).to_numpy(),
                                                 cs.to_numpy(), 1)[0])
                        deg = round(slope, 3)
                    except Exception:
                        deg = None
                stints.append({
                    "stint": int(stint_no) if pd.notna(stint_no) else None,
                    "compound": comp,
                    "lap_start": int(grp['LapNumber'].min()),
                    "lap_end": int(grp['LapNumber'].max()),
                    "laps": int(len(grp)),
                    "median": stint_median,
                    "deg": deg,
                })
            stints.sort(key=lambda s: s['lap_start'])

            drivers.append({
                "code": drv,
                "finish": finish_pos.get(drv),
                "clean_laps": n,
                "median": median,
                "best": best,
                "mean": mean,
                "std": std,
                "compounds": compounds,
                "stints": stints,
            })

        medians = [d['median'] for d in drivers if d['median'] is not None]
        fastest = min(medians) if medians else None
        for d in drivers:
            d['delta'] = (round(d['median'] - fastest, 3)
                          if d['median'] is not None and fastest is not None else None)

        drivers.sort(key=lambda d: (d['median'] is None, d['median'] if d['median'] is not None else 1e9))

        return _clean({
            "session": race.event['EventName'],
            "fastest_median": fastest,
            "drivers": drivers,
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FastF1 error: {str(e)}")


@app.get("/api/circuit_history/{year}/{round_num}")
def get_circuit_history(year: int, round_num: int):
    """Return the race result for the given year & round (used for the last-race recap)."""
    try:
        hist = _load_session(year, round_num, 'R')
    except Exception:
        return {"_error": f"No data for {year} Round {round_num}"}

    try:
        results = hist.results
        if results is None or results.empty:
            return {"_error": "No race results"}

        winner_row = results.iloc[0]
        winner = str(winner_row['Abbreviation']) if pd.notna(winner_row.get('Abbreviation')) else None
        winner_team = (
            str(winner_row['TeamName'])
            if 'TeamName' in results.columns and pd.notna(winner_row.get('TeamName'))
            else None
        )

        pole = None
        if 'GridPosition' in results.columns:
            pole_rows = results[results['GridPosition'] == 1.0]
            if not pole_rows.empty:
                pole = str(pole_rows.iloc[0]['Abbreviation'])

        fl_driver = None
        fl_time_str = None
        try:
            fastest_lap = hist.laps.pick_fastest()
            fl_driver = str(fastest_lap['Driver'])
            t = fastest_lap['LapTime']
            if pd.notna(t) and hasattr(t, 'total_seconds'):
                secs = t.total_seconds()
                m = int(secs // 60)
                s = secs % 60
                fl_time_str = f"{m}:{s:06.3f}"
        except Exception:
            pass

        sc = bool(hist.laps['TrackStatus'].dropna().str.contains('4').any())
        dnf_count = int((~results['Status'].str.contains(r'Finished|\+', regex=True, na=False)).sum())

        total_laps = None
        try:
            nl = winner_row.get('NumberOfLaps')
            if nl is not None and pd.notna(nl):
                total_laps = int(nl)
        except Exception:
            pass

        event_name = None
        try:
            event_name = str(hist.event['EventName'])
        except Exception:
            pass

        return _clean({
            "year": year,
            "event_name": event_name,
            "winner": winner,
            "winner_team": winner_team,
            "pole": pole,
            "fastest_lap_driver": fl_driver,
            "fastest_lap_time": fl_time_str,
            "safety_car": sc,
            "dnf_count": dnf_count,
            "total_laps": total_laps,
        })
    except Exception as e:
        return {"_error": str(e)}


# --- Championship standings (Ergast / Jolpica, current season only) ---

_STANDINGS_TTL = 1800  # seconds — standings only move after a race
_standings_cache: dict[int, tuple[float, Any]] = {}


def _ef(v):
    """Coerce an Ergast cell to float, or None if missing/NaN."""
    try:
        if v is None:
            return None
        f = float(v)
        return None if math.isnan(f) else f
    except Exception:
        return None


def _efd(v, default: float) -> float:
    """Like _ef but always returns a number (default when missing)."""
    r = _ef(v)
    return default if r is None else r


def _is_finish(status: str) -> bool:
    return status == "Finished" or status.startswith("+")


def _team_slug(name: str) -> str:
    """Canonical key for a constructor — drives team colours and logo filenames."""
    n = (name or "").lower()
    if "mercedes" in n: return "mercedes"
    if "ferrari" in n: return "ferrari"
    if "mclaren" in n: return "mclaren"
    if "red bull" in n or "redbull" in n: return "redbull"
    if "alpine" in n: return "alpine"
    if "aston" in n: return "astonmartin"
    if "williams" in n: return "williams"
    if "racing bull" in n or "alphatauri" in n or n.strip() in ("rb", "rb f1 team"): return "racingbulls"
    if "haas" in n: return "haas"
    if "audi" in n or "sauber" in n: return "audi"
    if "cadillac" in n: return "cadillac"
    return n.replace(" ", "")


def _compute_standings(year: int):
    from fastf1.ergast import Ergast
    erg = Ergast()

    ds_content = getattr(erg.get_driver_standings(season=year), "content", None)
    if not ds_content:
        return {"_error": f"No driver standings for {year} yet"}
    ds = ds_content[0]

    cs_content = getattr(erg.get_constructor_standings(season=year), "content", None)
    cs = cs_content[0] if cs_content else None

    # Rich per-driver / per-constructor aggregation from season race results
    dagg: dict[str, dict] = {}
    cagg: dict[str, dict] = {}
    rounds_pts: dict[str, list] = {}

    def _cbucket(name):
        return cagg.setdefault(name, dict(podiums=0, onetwo=0, poles=0, fl=0))

    try:
        rr = erg.get_race_results(season=year, limit=1000)
        for race_df in (getattr(rr, "content", None) or []):
            if "constructorName" in race_df.columns:
                for cons_name, grp in race_df.groupby("constructorName"):
                    positions = [p for p in (_ef(x) for x in grp["position"]) if p is not None]
                    c = _cbucket(cons_name)
                    c["podiums"] += sum(1 for p in positions if p <= 3)
                    if 1 in positions and 2 in positions:
                        c["onetwo"] += 1
            for _, row in race_df.iterrows():
                code = row.get("driverCode") or ""
                if not code:
                    continue
                pos = _ef(row.get("position"))
                grid = _ef(row.get("grid"))
                status = str(row.get("status") or "")
                flr = _ef(row.get("fastestLapRank"))
                pts = _efd(row.get("points"), 0.0)
                cons = row.get("constructorName") or ""
                a = dagg.setdefault(code, dict(podiums=0, poles=0, fl=0, dnf=0,
                                               best=None, finishes=[], races=0, team=cons))
                a["races"] += 1
                a["team"] = cons
                if pos is not None:
                    a["finishes"].append(pos)
                    a["best"] = pos if a["best"] is None else min(a["best"], pos)
                    if pos <= 3:
                        a["podiums"] += 1
                if grid == 1:
                    a["poles"] += 1
                    _cbucket(cons)["poles"] += 1
                if flr == 1:
                    a["fl"] += 1
                    _cbucket(cons)["fl"] += 1
                if not _is_finish(status):
                    a["dnf"] += 1
                rounds_pts.setdefault(code, []).append(pts)
    except Exception:
        pass

    # Driver rows (ds already sorted by championship position)
    drivers = []
    prev_pts = None
    leader_pts = _efd(ds.iloc[0]["points"], 0.0) if len(ds) else 0.0
    for _, row in ds.iterrows():
        code = row.get("driverCode") or ""
        pts = _efd(row.get("points"), 0.0)
        a = dagg.get(code, {})
        cons_names = row.get("constructorNames")
        team = (cons_names[0] if isinstance(cons_names, (list, tuple)) and len(cons_names)
                else a.get("team") or "")
        finishes = a.get("finishes", [])
        drivers.append({
            "position": int(_efd(row.get("position"), 0)),
            "code": code,
            "driver": f"{row.get('givenName', '')} {row.get('familyName', '')}".strip(),
            "team": team,
            "team_slug": _team_slug(team),
            "points": pts,
            "wins": int(_efd(row.get("wins"), 0)),
            "podiums": a.get("podiums", 0),
            "poles": a.get("poles", 0),
            "fastest_laps": a.get("fl", 0),
            "dnfs": a.get("dnf", 0),
            "best_finish": int(a["best"]) if a.get("best") else None,
            "avg_finish": round(sum(finishes) / len(finishes), 1) if finishes else None,
            "races": a.get("races", 0),
            "points_per_race": round(pts / a["races"], 1) if a.get("races") else None,
            "last3_points": sum(rounds_pts.get(code, [])[-3:]),
            "gap_to_leader": round(leader_pts - pts),
            "gap_to_next": round(prev_pts - pts) if prev_pts is not None else 0,
        })
        prev_pts = pts

    # Constructor rows
    constructors = []
    if cs is not None:
        prev_cpts = None
        leader_cpts = _efd(cs.iloc[0]["points"], 0.0) if len(cs) else 0.0
        for _, row in cs.iterrows():
            name = row.get("constructorName") or ""
            cpts = _efd(row.get("points"), 0.0)
            c = cagg.get(name, {})
            constructors.append({
                "position": int(_efd(row.get("position"), 0)),
                "team": name,
                "team_slug": _team_slug(name),
                "points": cpts,
                "wins": int(_efd(row.get("wins"), 0)),
                "podiums": c.get("podiums", 0),
                "one_twos": c.get("onetwo", 0),
                "poles": c.get("poles", 0),
                "fastest_laps": c.get("fl", 0),
                "gap_to_leader": round(leader_cpts - cpts),
                "gap_to_next": round(prev_cpts - cpts) if prev_cpts is not None else 0,
            })
            prev_cpts = cpts

    return _clean({"year": year, "drivers": drivers, "constructors": constructors})


@app.get("/api/standings/{year}")
def get_standings(year: int):
    now = time.time()
    hit = _standings_cache.get(year)
    if hit and hit[0] > now:
        return hit[1]
    try:
        payload = _compute_standings(year)
    except Exception as e:
        return {"_error": str(e)}
    if isinstance(payload, dict) and "_error" not in payload:
        _standings_cache[year] = (now + _STANDINGS_TTL, payload)
    return payload
