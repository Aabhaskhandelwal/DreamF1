#define the tables
'''
why different? why not just use sql model for this?
SQLModel → database + ORM model
Pydantic → validation + input/output schema
'''
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date
from pydantic import BaseModel


class User(SQLModel,table=True):
    id:Optional[int]=Field(default=None,primary_key=True)#optional as database autogenerates it
    username:str=Field(index=True,unique=True)
    email:str=Field(unique=True)
    hashed_password:str#for security purposes
    total_points:int=Field(default=0)

class Event(SQLModel,table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    round_number:int = Field(unique=True)
    event_name:str #like "Australian Grand Prix"
    country:str
    event_date:date
    is_completed:bool=Field(default=False)

class Prediction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    event_id: int = Field(foreign_key="event.id")
    
    first_place: str
    second_place: str
    third_place: str
    
    # The bonus fields you requested!
    fastest_lap: Optional[str] = None
    dnf_driver: Optional[str] = None
    pole_position: Optional[str] = None
    
    points_earned: int = Field(default=0)

# Like UserCreate, this is the Pydantic "bouncer" that tells 
# FastAPI what to expect from the frontend form.
class PredictionCreate(BaseModel):
    first_place: str
    second_place: str
    third_place: str
    fastest_lap: Optional[str] = None
    dnf_driver: Optional[str] = None
    pole_position: Optional[str] = None

class UserCreate(BaseModel):
    username:str
    email:str
    password:str

class RaceResultCreate(BaseModel):
    first_place: str
    second_place: str
    third_place: str
    fastest_lap: str
    pole_position: str
    dnf_drivers: list[str] = [] 
