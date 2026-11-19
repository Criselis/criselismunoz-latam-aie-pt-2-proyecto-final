"""
Tests for POST /auth/login — user authentication.
"""

import pytest


class TestLoginHappyPath:
    """Camino feliz — valid credentials."""

    def test_login_returns_200(self, client, registered_user):
        resp = client.post(
            "/auth/login",
            json={"email": "alice@example.com", "password": "secret123"},
        )
        assert resp.status_code == 200

    def test_login_returns_jwt_token(self, client, registered_user):
        resp = client.post(
            "/auth/login",
            json={"email": "alice@example.com", "password": "secret123"},
        )
        body = resp.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"
        assert len(body["access_token"]) > 20  # JWTs are long

    def test_login_is_case_insensitive_for_email(self, client, registered_user):
        resp = client.post(
            "/auth/login",
            json={"email": "Alice@Example.COM", "password": "secret123"},
        )
        assert resp.status_code == 200


class TestLoginEdgeCases:
    """Casos límite — boundary conditions."""

    def test_login_with_different_password_characters(self, client):
        # Register with special chars in password
        client.post(
            "/users",
            json={"email": "special@example.com", "password": "P@$$w0rd!"},
        )
        resp = client.post(
            "/auth/login",
            json={"email": "special@example.com", "password": "P@$$w0rd!"},
        )
        assert resp.status_code == 200


class TestLoginFailure:
    """Modos de fallo — invalid credentials."""

    def test_wrong_password_returns_401(self, client, registered_user):
        resp = client.post(
            "/auth/login",
            json={"email": "alice@example.com", "password": "wrongpass"},
        )
        assert resp.status_code == 401
        assert "inválidas" in resp.json()["detail"].lower()

    def test_nonexistent_email_returns_401(self, client):
        resp = client.post(
            "/auth/login",
            json={"email": "nobody@example.com", "password": "secret123"},
        )
        assert resp.status_code == 401

    def test_inactive_user_returns_401(self, client, registered_user):
        """A deactivated account should not be able to log in."""
        from app.database import users_table
        # Manually deactivate the user
        users_table.update(
            {"is_active": False},
            lambda d: d.get("email") == "alice@example.com",
        )
        resp = client.post(
            "/auth/login",
            json={"email": "alice@example.com", "password": "secret123"},
        )
        assert resp.status_code == 401
        assert "inactivo" in resp.json()["detail"].lower()

    def test_empty_body_returns_400(self, client):
        resp = client.post("/auth/login", json={})
        assert resp.status_code in (400, 422)

    def test_missing_password_returns_400(self, client):
        resp = client.post(
            "/auth/login", json={"email": "alice@example.com"}
        )
        assert resp.status_code in (400, 422)

    def test_wrong_email_and_password_returns_401(self, client, registered_user):
        """Even with a valid email, wrong password must fail."""
        resp = client.post(
            "/auth/login",
            json={"email": "alice@example.com", "password": "nottherightone"},
        )
        assert resp.status_code == 401
