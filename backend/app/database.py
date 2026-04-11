from sqlmodel import SQLModel, create_engine, Session
from app.config import POSTGRES_DB, POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_PORT

DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
engine = create_engine(DATABASE_URL, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
