import pytest
from fastapi.testclient import TestClient
from datetime import datetime
import sys
import os

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, root_dir)
sys.path.insert(0, os.path.join(root_dir, "backend"))

from main import app

# 1. Création d'une Fixture qui garde la connexion ouverte pour tous les tests
@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

test_state = {
    "phone": f"+4179{datetime.now().strftime('%H%M%S')}",
    "server_id": None,
    "token": None
}

# 2. On injecte 'client' en argument de chaque test
def test_root_endpoint(client):
    response = client.get("/api/")
    assert response.status_code == 200
    assert response.json() == {"message": "Tipsy API"}

def test_send_otp(client):
    response = client.post("/api/auth/send-otp", json={"phone": test_state["phone"]})
    assert response.status_code == 200
    assert response.json()["success"] is True

def test_verify_otp_invalid(client):
    response = client.post("/api/auth/verify-otp", json={"phone": test_state["phone"], "otp": "000000"})
    assert response.status_code == 400
    assert "detail" in response.json()

def test_verify_otp_new_user(client):
    response = client.post("/api/auth/verify-otp", json={"phone": test_state["phone"], "otp": "123456"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    test_state["token"] = data["access_token"]
    assert data["is_new_user"] is True

def test_create_server_profile(client):
    payload = {
        "phone": test_state["phone"],
        "first_name": "TestServer",
        "photo_url": "https://example.com/photo.jpg"
    }
    headers = {"Authorization": f"Bearer {test_state['token']}"}
    response = client.post("/api/servers/profile", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    test_state["server_id"] = data["id"]

def test_get_server_by_phone(client):
    headers = {"Authorization": f"Bearer {test_state['token']}"}
    response = client.get(f"/api/servers/by-phone/{test_state['phone']}", headers=headers)
    assert response.status_code == 200
    assert response.json()["phone"] == test_state["phone"]

def test_get_server_by_id(client):
    assert test_state["server_id"] is not None
    headers = {"Authorization": f"Bearer {test_state['token']}"}
    response = client.get(f"/api/servers/{test_state['server_id']}", headers=headers)
    assert response.status_code == 200
    assert response.json()["id"] == test_state["server_id"]

def test_get_server_stats(client):
    headers = {"Authorization": f"Bearer {test_state['token']}"}
    response = client.get(f"/api/servers/{test_state['server_id']}/stats", headers=headers)
    assert response.status_code == 200
    assert "total_tips" in response.json()

def test_get_server_tips(client):
    headers = {"Authorization": f"Bearer {test_state['token']}"}
    response = client.get(f"/api/servers/{test_state['server_id']}/tips", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_tip_checkout(client):
    payload = {
        "server_id": test_state["server_id"],
        "amount": 10.0,
        "host_url": "http://127.0.0.1:8000"
    }
    headers = {"Authorization": f"Bearer {test_state['token']}"}
    response = client.post("/api/tips/create-checkout", json=payload, headers=headers)
    assert response.status_code == 200
    assert "url" in response.json()

def test_verify_otp_existing_user(client):
    response = client.post("/api/auth/verify-otp", json={"phone": test_state["phone"], "otp": "123456"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["is_new_user"] is False
    assert data["server"]["id"] == test_state["server_id"]