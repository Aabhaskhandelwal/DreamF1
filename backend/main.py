from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.database import create_db_and_tables
import fastf1 as ff1
import pandas as pd # FastF1 uses pandas

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
