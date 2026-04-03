import secrets
from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select, func
from contextlib import asynccontextmanager
from app.database import create_db_and_tables, get_session
from app.models import User, UserCreate, Prediction, PredictionCreate, Event, GroupCreate, GroupMember, Group, GroupJoin
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user
import fastf1 as ff1
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware

ff1.Cache.enable_cache("./cache")

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
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
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Welcome to MyF1Circle API!"}


@app.get("/api/schedule")
def get_schedule(session: Session = Depends(get_session)):
    db_events = session.exec(select(Event)).all()
    if db_events:
        return db_events

    event_schedule = ff1.get_event_schedule(2026)
    filtered = event_schedule[event_schedule['RoundNumber'] > 0]

    new_events = []
    for _, row in filtered.iterrows():
        event = Event(
            round_number=row['RoundNumber'],
            event_name=row['EventName'],
            country=row['Country'],
            event_date=row['EventDate'].to_pydatetime().date()
        )
        session.add(event)
        new_events.append(event)

    session.commit()
    return new_events


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


@app.post("/api/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
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
        fastest_lap=prediction_data.fastest_lap,
        dnf_driver=prediction_data.dnf_driver,
        pole_position=prediction_data.pole_position
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
    actual_fastest = race_session.laps.pick_fastest()['Driver']
    actual_pole = quali_session.results.iloc[0]['Abbreviation']
    actual_dnfs = results[~results['Status'].str.contains('Finished|\+', regex=True)]['Abbreviation'].tolist()

    predictions = session.exec(select(Prediction).where(Prediction.event_id == event_id)).all()
    for pred in predictions:
        points = 0
        if pred.first_place == actual_p1: points += 10
        if pred.second_place == actual_p2: points += 10
        if pred.third_place == actual_p3: points += 10
        if pred.fastest_lap == actual_fastest: points += 5
        if pred.pole_position == actual_pole: points += 5
        if pred.dnf_driver and pred.dnf_driver in actual_dnfs: points += 5

        pred.points_earned = points
        session.add(pred)

        user = session.get(User, pred.user_id)
        if user:
            user.total_points += points
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
    return group


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
        race = ff1.get_session(year, round_num, 'R')
        race.load(telemetry=True, weather=False)
    except Exception:
        raise HTTPException(status_code=404, detail="Session data not available yet")

    if race.results.empty:
        raise HTTPException(status_code=404, detail="No results for this session")

    top3 = race.results.iloc[:3]['Abbreviation'].tolist()
    drivers_data = {}

    for drv in top3:
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

    return {"session": race.event['EventName'], "drivers": drivers_data}


@app.get("/api/telemetry/{year}/{round_num}/tyres")
def get_tyre_strategy(year: int, round_num: int):
    try:
        race = ff1.get_session(year, round_num, 'R')
        race.load(telemetry=False, weather=False)
    except Exception:
        raise HTTPException(status_code=404, detail="Session data not available yet")

    drivers = race.results['Abbreviation'].tolist()[:10]
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
        quali = ff1.get_session(year, round_num, 'Q')
        quali.load(telemetry=False, weather=False)
    except Exception:
        raise HTTPException(status_code=404, detail="Session data not available yet")

    results = quali.results[['Abbreviation', 'Q1', 'Q2', 'Q3']].copy()
    # convert timedelta to seconds for JSON serialisation
    for col in ['Q1', 'Q2', 'Q3']:
        results[col] = results[col].apply(
            lambda x: round(x.total_seconds(), 3) if hasattr(x, 'total_seconds') else None
        )

    return {"session": quali.event['EventName'], "results": results.to_dict(orient='records')}
