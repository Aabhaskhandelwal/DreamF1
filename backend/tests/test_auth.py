"""Auth flow tests — register, login, /api/me — against the in-memory SQLite DB."""


def _register(client, username="racer1", email="racer1@example.com", password="secret123"):
    return client.post("/api/register", json={"username": username, "email": email, "password": password})


def test_register_returns_token_and_username(client):
    r = _register(client)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"
    assert body["username"] == "racer1"


def test_register_rejects_short_password(client):
    r = _register(client, password="123")
    assert r.status_code == 400
    assert "Password" in r.json()["detail"]


def test_register_rejects_invalid_email(client):
    r = _register(client, email="not-an-email")
    assert r.status_code == 400
    assert "email" in r.json()["detail"].lower()


def test_register_rejects_duplicate_username_case_insensitive(client):
    assert _register(client, username="Bob", email="bob@example.com").status_code == 200
    r = _register(client, username="bob", email="bob2@example.com")
    assert r.status_code == 400
    assert "Username" in r.json()["detail"]


def test_register_rejects_duplicate_email(client):
    assert _register(client, username="alpha", email="dup@example.com").status_code == 200
    r = _register(client, username="beta", email="DUP@example.com")
    assert r.status_code == 400
    assert "Email" in r.json()["detail"]


def test_login_succeeds_and_returns_username(client):
    _register(client, username="speedy", email="speedy@example.com", password="secret123")
    r = client.post("/api/login", json={"username": "speedy", "password": "secret123"})
    assert r.status_code == 200, r.text
    assert r.json()["access_token"]
    assert r.json()["username"] == "speedy"


def test_login_is_case_insensitive_on_username(client):
    _register(client, username="MixedCase", email="mc@example.com", password="secret123")
    r = client.post("/api/login", json={"username": "mixedcase", "password": "secret123"})
    assert r.status_code == 200, r.text


def test_login_rejects_wrong_password(client):
    _register(client, username="careful", email="careful@example.com", password="secret123")
    r = client.post("/api/login", json={"username": "careful", "password": "wrongpass"})
    assert r.status_code == 400


def test_me_returns_profile_with_valid_token(client):
    token = _register(client, username="whoami", email="whoami@example.com").json()["access_token"]
    r = client.get("/api/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["username"] == "whoami"
    assert body["email"] == "whoami@example.com"
    assert body["total_points"] == 0


def test_me_rejects_missing_token(client):
    r = client.get("/api/me")
    assert r.status_code == 401


def test_me_rejects_garbage_token(client):
    r = client.get("/api/me", headers={"Authorization": "Bearer not.a.real.token"})
    assert r.status_code == 401
