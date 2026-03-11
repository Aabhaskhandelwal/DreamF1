#connect to SQLite database
from sqlmodel import SQLModel,create_engine,Session

#create database file database.db
sqlite_file_name="database.db"
sqlite_url=f"sqlite:///{sqlite_file_name}"

#engine talks to your database
engine=create_engine(sqlite_url,echo=True)
