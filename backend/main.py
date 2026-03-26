from fastapi import FastAPI,Depends,HTTPException
from sqlmodel import Session,select
from contextlib import asynccontextmanager
from app.database import create_db_and_tables,get_session
from app.models import User,UserCreate
from app.auth import get_password_hash,verify_password,create_access_token
import fastf1 as ff1
import pandas as pd # FastF1 uses pandas
from fastapi.security import OAuth2PasswordRequestForm
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
def get_schedule():
    # 1. Fetch the 2026 schedule from FastF1
    event = ff1.get_event_schedule(2026)
    
    # 2. Filter out just the columns we care about 
    filtered_events = event[event['RoundNumber'] > 0][['RoundNumber', 'EventName', 'Country', 'EventDate']]
    
    # 3. Convert dates to strings so the browser can read them
    filtered_events['EventDate'] = filtered_events['EventDate'].dt.strftime('%Y-%m-%d')
    
    # 4. Convert to a list of dictionaries
    list_of_dicts = filtered_events.to_dict(orient='records')
    
    # 5. Return the JSON list directly to the browser!
    return list_of_dicts


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
