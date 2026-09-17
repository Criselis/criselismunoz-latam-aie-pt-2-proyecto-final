"""
Tests for POST /auth/change-password — change password for authenticated user.
"""

import pytest


class TestChangePasswordHappyPath:
    """Camino feliz — valid current password, new password accepted."""

    def test_change_returns_200(self, client, auth_headers):
        resp = client.post(
            "/auth/change-password",
            json={"current_password": "secret123", "new_password": "newpass123"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert "cambiada" in resp.json()["message"].lower()

    def test_change_allows_login_with_new_password(self, client, auth_headers):
        """After changing, the new password should work."""
        client.post(
            "/auth/change-password",
            json={"current_password": "secret123", "new_password": "newpass123"},
            headers=auth_headers,
        )
        resp = client.post(
            "/auth/login",
            json={"email": "alice@example.com", "new_password": "newpass123"},
        )
        # Login should succeed with the new password
        resp2 = client.post(
            "/auth/login",
            json={"email": "alice@example.com", "password": "newpass123"},
        )
        assert resp2.status_code == 200

    def test_change_old_password_rejected(self, client, auth_headers):
        """After change, old password must fail."""
        client.post(
            "/auth/change-password",
            json={"current_password": "secret123", "new_password": "newpass123"},
            headers=auth_headers,
        )
        resp = client.post(
            "/auth/login",
            json={"email": "alice@example.com", "password": "secret123"},
        )
        assert resp.status_code == 401


class TestChangePasswordEdgeCases:
    """Casos límite — boundary conditions."""

    def test_change_with_minimum_length_password(self, client, auth_headers):
        """Exactly 6 characters should be accepted."""
        resp = client.post(
            "/auth/change-password",
            json={"current_password": "secret123", "new_password": "123456"},
            headers=auth_headers,
        )
        assert resp.status_code == 200

    def test_change_with_72char_password_accepted(self, client, auth_headers):
        """Passwords up to 72 bytes (bcrypt limit) should be accepted."""
        pw_72 = "a" * 72
        resp = client.post(
            "/auth/change-password",
            json={"current_password": "secret123", "new_password": pw_72},
            headers=auth_headers,
        )
        assert resp.status_code == 200

    def test_change_with_long_password_returns_400(self, client, auth_headers):
        """Passwords > 72 chars are rejected by Pydantic validation before bcrypt."""
        long_pw = "a" * 200
        resp = client.post(
            "/auth/change-password",
            json={"current_password": "secret123", "new_password": long_pw},
            headers=auth_headers,
        )
        # Schema validation catches the password before it reaches bcrypt
        assert resp.status_code in (400, 422)


class TestChangePasswordFailure:
    """Modos de fallo — wrong current password, no token."""

    def test_wrong_current_password_returns_401(self, client, auth_headers):
        resp = client.post(
            "/auth/change-password",
            json={"current_password": "wrongpass", "new_password": "newpass123"},
            headers=auth_headers,
        )
        assert resp.status_code == 401
        assert "incorrecta" in resp.json()["detail"].lower()

    def test_no_token_returns_401(self, client):
        resp = client.post(
            "/auth/change-password",
            json={"current_password": "secret123", "new_password": "newpass123"},
        )
        assert resp.status_code == 401

    def test_short_new_password_returns_400(self, client, auth_headers):
        resp = client.post(
            "/auth/change-password",
            json={"current_password": "secret123", "new_password": "12345"},
            headers=auth_headers,
        )
        assert resp.status_code in (400, 422)

    def test_empty_body_returns_400(self, client, auth_headers):
        resp = client.post(
            "/auth/change-password",
            json={},
            headers=auth_headers,
        )
        assert resp.status_code in (400, 422)
