#define the tables
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date

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