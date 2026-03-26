from fastapi import FastAPI,Depends,HTTPException
from sqlmodel import Session,select
from contextlib import asynccontextmanager
from app.database import create_db_and_tables,get_session
from app.models import User,UserCreate,Prediction,PredictionCreate,Event,RaceResultCreate
from app.auth import get_password_hash,verify_password,create_access_token,get_current_user
import fastf1 as ff1
import pandas as pd # FastF1 uses pandas
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime
# Ensure FastF1 caching is enabled so we don't spam their servers
ff1.Cache.enable_cache("./cache")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up... Creating database tables!")
    create_db_and_tables()
    yield
    print("Shutting down...")

app = FastAPI(lifespan=lifespan)

@app.get("/")
def read_root():
    return {"message": "Welcome to MyF1Circle API!"}



# --- NEW SCHEDULE ENDPOINT ---
@app.get("/api/schedule")
def get_schedule(session: Session = Depends(get_session)):
    # 1. First, check if we already saved the races to our database
    db_events = session.exec(select(Event)).all()
    
    # 2. If our database has races, just return them! Fast and easy.
    if len(db_events) > 0:
        return db_events

    # 3. IF THE DATABASE IS EMPTY: Fetch from internet, save them, and return them
    print("Database is empty! Fetching from FastF1 and saving to Postgres...")
    event_schedule = ff1.get_event_schedule(2026)
    filtered_events = event_schedule[event_schedule['RoundNumber'] > 0]
    
    new_events = []
    for _, row in filtered_events.iterrows():
        # Convert Pandas Timestamp to standard Python date
        race_date = row['EventDate'].to_pydatetime().date()
        
        # Create our Database Object
        new_event = Event(
            round_number=row['RoundNumber'],
            event_name=row['EventName'],
            country=row['Country'],
            event_date=race_date
        )
        session.add(new_event)
        new_events.append(new_event)
    
    # Save all 24 races to Postgres at once!
    session.commit()
    
    return new_events


# --- USER AUTHENTICATION ENDPOINTS ---

@app.post("/api/register")
def register_user(user_data: UserCreate, session: Session = Depends(get_session)):
    
    # 1. Check if the username is already taken!
    existing_user = session.exec(select(User).where(User.username == user_data.username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken :(")
        
    # 2. Scramble their password
    hashed_pw = get_password_hash(user_data.password)
    
    # 3. Create the actual Database object
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_pw
    )
    
    # 4. Save to PostgreSQL!
    session.add(new_user)
    session.commit()
    session.refresh(new_user) # Refreshes it to get the auto-generated ID
    
    return {"message": "User created successfully!", "user_id": new_user.id}


@app.post("/api/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    # 1. Look up the user by username
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    
    # 2. Check if the user exists AND if the password matches the hash!
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    # 3. Create the JWT Token with their user_id
    access_token = create_access_token(data={"sub": str(user.id)})
    
    # 4. Give the token to the user!
    return {"access_token": access_token, "token_type": "bearer"}



@app.post("/api/predict")
def submit_prediction(
    prediction_data: PredictionCreate, 
    current_user: User = Depends(get_current_user), 
    session: Session = Depends(get_session)
):
   # 1. Ask the database: What is the strictly NEXT upcoming race?
    next_race = session.exec(
        select(Event)
        .where(Event.event_date >= datetime.now().date())
        .order_by(Event.event_date)
    ).first()
    
    # Check if the season is over and there are no races left!
    if not next_race:
        raise HTTPException(status_code=400, detail="The F1 Season is officially over!")
        

    #Check if they already made a prediction for this specific race
    existing_prediction = session.exec(
        select(Prediction)
        .where(Prediction.user_id == current_user.id)
        .where(Prediction.event_id == next_race.id) # <-- Use next_race here!
    ).first()
    
    if existing_prediction:
        raise HTTPException(status_code=400, detail="You already predicted this race!")
    # 3. Map the Pydantic data into our actual Database Model
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
    
    return {"message": f"Prediction securely locked in for {next_race.event_name}!", "prediction": new_prediction}



@app.get("/api/predictions")
def get_user_predictions(
    current_user: User = Depends(get_current_user), # Secure this route too!
    session: Session = Depends(get_session)
):
    # Ask the database for all predictions belonging ONLY to this exact user
    predictions = session.exec(select(Prediction).where(Prediction.user_id == current_user.id)).all()
    
    return predictions


@app.post("/api/score/{event_id}")
def score_race_officially(event_id: int, session: Session = Depends(get_session)):
    
    event = session.exec(select(Event).where(Event.id == event_id)).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    # 1. Ask FastF1 for the actual Race and Qualifying results
    try:
        race_session = ff1.get_session(2026, event.round_number, 'R')
        race_session.load(telemetry=False, weather=False) # Keep it fast!
        
        quali_session = ff1.get_session(2026, event.round_number, 'Q')
        quali_session.load(telemetry=False, weather=False)
    except Exception as e:
        raise HTTPException(status_code=400, detail="FastF1 does not have the results for this race yet! Has it finished?")

    # 2. Extract the Official Real-World Race Data
    official_results = race_session.results
    

    if official_results.empty:
        raise HTTPException(status_code=400, detail="FastF1 does not have the results for this race yet! Please wait until it finishes.")
        
    actual_first = official_results.iloc[0]['Abbreviation']
    actual_second = official_results.iloc[1]['Abbreviation']
    actual_third = official_results.iloc[2]['Abbreviation']
    
    actual_fastest_lap = race_session.laps.pick_fastest()['Driver']
    actual_pole = quali_session.results.iloc[0]['Abbreviation']
    
    # Anyone who didn't 'Finish' or get '+1 Lap' etc.
    actual_dnfs = official_results[~official_results['Status'].str.contains('Finished|\+', regex=True)]['Abbreviation'].tolist()

    # 3. Score every prediction in your Database!
    predictions = session.exec(select(Prediction).where(Prediction.event_id == event_id)).all()
    scored_users = 0
    
    for prediction in predictions:
        points = 0
        if prediction.first_place == actual_first: points += 10
        if prediction.second_place == actual_second: points += 10
        if prediction.third_place == actual_third: points += 10
        if prediction.fastest_lap == actual_fastest_lap: points += 5
        if prediction.pole_position == actual_pole: points += 5
        if prediction.dnf_driver and prediction.dnf_driver in actual_dnfs: points += 5
            
        prediction.points_earned = points
        session.add(prediction)
        
        # Add to Leaderboard
        user = session.exec(select(User).where(User.id == prediction.user_id)).first()
        if user:
            user.total_points += points
            session.add(user)
            scored_users += 1
            
    session.commit()
    return {"message": f"Successfully fetched FastF1 results! Scored {scored_users} users for {event.event_name}!"}
