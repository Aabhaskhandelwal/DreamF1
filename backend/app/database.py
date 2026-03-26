#connect to SQLite database
from sqlmodel import SQLModel,create_engine,Session
from app.config import POSTGRES_DB,POSTGRES_HOST,POSTGRES_USER,POSTGRES_PASSWORD
#create database file database.db
sqlite_file_name="database.db"
sqlite_url = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:5433/{POSTGRES_DB}"

#engine talks to your database
engine=create_engine(sqlite_url,echo=True)
def create_db_and_tables():
    # look up tables in model.py and creatr
    SQLModel.metadata.create_all(engine)
def get_session():
    with Session(engine) as session:
        yield session
