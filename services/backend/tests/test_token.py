"""
Tests for GET /auth/me — current user profile via JWT.
"""

import pytest


class TestAuthMeHappyPath:
    """Camino feliz — valid token, user exists."""

    def test_me_returns_200(self, client, auth_headers):
        resp = client.get("/auth/me", headers=auth_headers)
        assert resp.status_code == 200

    def test_me_returns_user_data(self, client, auth_headers, registered_user):
        resp = client.get("/auth/me", headers=auth_headers)
        body = resp.json()
        assert body["email"] == "alice@example.com"
        assert body["id"] == registered_user["id"]
        assert body["role"] == "user"

    def test_me_includes_profile_fields(self, client):
        # Register with profile data
        client.post(
            "/users",
            json={
                "email": "profile@example.com",
                "password": "secret123",
                "name": "Profile User",
                "phone": "+555",
                "address": "123 Main St",
            },
        )
        login = client.post(
            "/auth/login",
            json={"email": "profile@example.com", "password": "secret123"},
        )
        token = login.json()["access_token"]
        resp = client.get(
            "/auth/me", headers={"Authorization": f"Bearer {token}"}
        )
        body = resp.json()
        assert body["name"] == "Profile User"
        assert body["phone"] == "+555"
        assert body["address"] == "123 Main St"


class TestAuthMeEdgeCases:
    """Casos límite — boundary conditions."""

    def test_me_works_with_minimal_profile(self, client):
        """User registered without optional profile fields."""
        # Register a new user without name/phone/address
        client.post(
            "/users",
            json={"email": "minimal@example.com", "password": "secret123"},
        )
        login = client.post(
            "/auth/login",
            json={"email": "minimal@example.com", "password": "secret123"},
        )
        token = login.json()["access_token"]
        resp = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body.get("name") is None


class TestAuthMeFailure:
    """Modos de fallo — missing or invalid token."""

    def test_no_token_returns_401(self, client):
        resp = client.get("/auth/me")
        assert resp.status_code == 401

    def test_invalid_token_returns_401(self, client):
        resp = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer invalid.jwt.token"},
        )
        assert resp.status_code == 401

    def test_expired_token_returns_401(self, client, registered_user):
        """A token signed with the correct key but expired should fail."""
        from jose import jwt
        from app.config import settings
        from datetime import datetime, timedelta

        # Create a token that expired 1 hour ago
        expired_payload = {
            "sub": registered_user["id"],
            "exp": datetime.utcnow() - timedelta(hours=1),
            "iat": datetime.utcnow() - timedelta(hours=2),
        }
        expired_token = jwt.encode(
            expired_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM
        )
        resp = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        assert resp.status_code == 401

    def test_malformed_header_returns_401(self, client):
        """Missing 'Bearer' prefix."""
        resp = client.get(
            "/auth/me",
            headers={"Authorization": "some-token-without-bearer"},
        )
        assert resp.status_code == 401
