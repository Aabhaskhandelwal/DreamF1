import sys
from unittest.mock import MagicMock, patch

# Intercept fastf1 before main.py's module-level Cache.enable_cache() runs
sys.modules["fastf1"] = MagicMock()

import pytest
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, create_engine, Session
from fastapi.testclient import TestClient

from main import app
from app.database import get_session


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture
def client(db_session):
    def override():
        yield db_session

    app.dependency_overrides[get_session] = override
    with patch("main.create_db_and_tables"):
        with TestClient(app) as c:
            yield c
    app.dependency_overrides.clear()
