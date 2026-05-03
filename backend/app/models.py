from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(unique=True)
    hashed_password: str
    total_points: int = Field(default=0)


class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    round_number: int = Field(unique=True)
    event_name: str
    country: str
    event_date: date
    is_completed: bool = Field(default=False)
    session1_name: Optional[str] = None
    session1_date: Optional[datetime] = None
    session2_name: Optional[str] = None
    session2_date: Optional[datetime] = None
    session3_name: Optional[str] = None
    session3_date: Optional[datetime] = None
    session4_name: Optional[str] = None
    session4_date: Optional[datetime] = None
    session5_name: Optional[str] = None
    session5_date: Optional[datetime] = None


class Prediction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    event_id: int = Field(foreign_key="event.id")
    first_place: str
    second_place: str
    third_place: str
    fourth_place: Optional[str] = None
    fifth_place: Optional[str] = None
    fastest_lap: Optional[str] = None
    dnf_driver: Optional[str] = None
    pole_position: Optional[str] = None
    safety_car: Optional[bool] = None
    points_earned: int = Field(default=0)


class Group(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    invite_code: str = Field(unique=True)
    created_by: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class GroupMember(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    group_id: int = Field(foreign_key="group.id")
    joined_at: datetime = Field(default_factory=datetime.utcnow)


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class PredictionCreate(BaseModel):
    pole_position: str
    first_place: str
    second_place: str
    third_place: str
    fourth_place: str
    fifth_place: str
    fastest_lap: str
    dnf_driver: str
    safety_car: bool


class GroupCreate(BaseModel):
    name: str


class GroupJoin(BaseModel):
    invite_code: str
