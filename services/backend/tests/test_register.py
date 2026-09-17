"""
Tests for POST /users — user registration.
"""

import pytest


class TestRegisterHappyPath:
    """Camino feliz — registration with valid data."""

    def test_register_returns_201(self, client):
        resp = client.post(
            "/users",
            json={"email": "bob@example.com", "password": "secret123"},
        )
        assert resp.status_code == 201

    def test_register_returns_user_fields(self, client):
        resp = client.post(
            "/users",
            json={"email": "bob@example.com", "password": "secret123"},
        )
        body = resp.json()
        assert "id" in body
        assert body["email"] == "bob@example.com"
        assert body["is_active"] is True
        assert body["role"] == "user"
        assert "created_at" in body

    def test_register_does_not_leak_password(self, client):
        resp = client.post(
            "/users",
            json={"email": "bob@example.com", "password": "secret123"},
        )
        body = resp.json()
        assert "password" not in body
        assert "hashed_password" not in body

    def test_register_creates_linked_profile(self, client):
        resp = client.post(
            "/users",
            json={
                "email": "carol@example.com",
                "password": "secret123",
                "name": "Carol",
                "phone": "+1234",
            },
        )
        user_id = resp.json()["id"]
        # Fetch profile via auth/me after login
        login = client.post(
            "/auth/login",
            json={"email": "carol@example.com", "password": "secret123"},
        )
        token = login.json()["access_token"]
        me = client.get(
            "/auth/me", headers={"Authorization": f"Bearer {token}"}
        )
        assert me.status_code == 200
        assert me.json()["name"] == "Carol"
        assert me.json()["phone"] == "+1234"


class TestRegisterEdgeCases:
    """Casos límite — boundary conditions."""

    def test_register_with_optional_fields_omitted(self, client):
        resp = client.post(
            "/users",
            json={"email": "minimal@example.com", "password": "secret123"},
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["email"] == "minimal@example.com"

    def test_register_with_72char_password_accepted(self, client):
        resp = client.post(
            "/users",
            json={"email": "longpw@example.com", "password": "a" * 72},
        )
        assert resp.status_code == 201

    def test_register_with_long_password_rejected(self, client):
        """Passwords > 72 chars rejected before hitting bcrypt limit."""
        resp = client.post(
            "/users",
            json={"email": "toolong@example.com", "password": "a" * 200},
        )
        assert resp.status_code in (400, 422)

    def test_register_normalizes_email_lowercase(self, client):
        resp = client.post(
            "/users",
            json={"email": "UPPER@Example.COM", "password": "secret123"},
        )
        assert resp.status_code == 201
        assert resp.json()["email"] == "upper@example.com"

    def test_register_passwordexactly6chars(self, client):
        resp = client.post(
            "/users",
            json={"email": "six@example.com", "password": "123456"},
        )
        assert resp.status_code == 201


class TestRegisterFailure:
    """Modos de fallo — invalid input."""

    def test_duplicate_email_returns_409(self, client, registered_user):
        resp = client.post(
            "/users",
            json={"email": "alice@example.com", "password": "other123"},
        )
        assert resp.status_code == 409
        assert "ya existe" in resp.json()["detail"].lower() or "email" in resp.json()["detail"].lower()

    def test_invalid_email_format_returns_400(self, client):
        resp = client.post(
            "/users",
            json={"email": "not-an-email", "password": "secret123"},
        )
        assert resp.status_code == 400

    def test_short_password_returns_400(self, client):
        resp = client.post(
            "/users",
            json={"email": "short@example.com", "password": "12345"},
        )
        assert resp.status_code == 400

    def test_empty_body_returns_400(self, client):
        resp = client.post("/users", json={})
        assert resp.status_code == 400

    def test_missing_email_returns_400(self, client):
        resp = client.post("/users", json={"password": "secret123"})
        assert resp.status_code == 400

    def test_missing_password_returns_400(self, client):
        resp = client.post("/users", json={"email": "nopw@example.com"})
        assert resp.status_code == 400
