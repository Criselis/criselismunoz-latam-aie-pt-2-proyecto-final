"""
Tests for POST /auth/reset-password — consume one-time reset token.
"""

import pytest


class TestResetPasswordHappyPath:
    """Camino feliz — valid token, new password accepted."""

    def test_reset_returns_200(self, client, registered_user):
        # First request a reset token
        client.post(
            "/auth/forgot-password",
            json={"email": "alice@example.com"},
        )
        from app.database import reset_tokens_table

        token_doc = reset_tokens_table.all()[0]
        token = token_doc["token"]

        resp = client.post(
            "/auth/reset-password",
            json={"token": token, "new_password": "newpass123"},
        )
        assert resp.status_code == 200
        assert "actualizada" in resp.json()["message"].lower()

    def test_reset_allows_login_with_new_password(self, client, registered_user):
        """After reset, the user should be able to log in with the new password."""
        client.post(
            "/auth/forgot-password",
            json={"email": "alice@example.com"},
        )
        from app.database import reset_tokens_table

        token = reset_tokens_table.all()[0]["token"]

        client.post(
            "/auth/reset-password",
            json={"token": token, "new_password": "newpass123"},
        )

        resp = client.post(
            "/auth/login",
            json={"email": "alice@example.com", "password": "newpass123"},
        )
        assert resp.status_code == 200

    def test_reset_old_password_no_longer_works(self, client, registered_user):
        """After reset, the old password must be rejected."""
        client.post(
            "/auth/forgot-password",
            json={"email": "alice@example.com"},
        )
        from app.database import reset_tokens_table

        token = reset_tokens_table.all()[0]["token"]

        client.post(
            "/auth/reset-password",
            json={"token": token, "new_password": "newpass123"},
        )

        resp = client.post(
            "/auth/login",
            json={"email": "alice@example.com", "password": "secret123"},
        )
        assert resp.status_code == 401


class TestResetPasswordEdgeCases:
    """Casos límite — boundary conditions."""

    def test_token_is_single_use(self, client, registered_user):
        """A token can only be used once."""
        client.post(
            "/auth/forgot-password",
            json={"email": "alice@example.com"},
        )
        from app.database import reset_tokens_table

        token = reset_tokens_table.all()[0]["token"]

        # First use — should succeed
        resp1 = client.post(
            "/auth/reset-password",
            json={"token": token, "new_password": "newpass123"},
        )
        assert resp1.status_code == 200

        # Second use — should fail
        resp2 = client.post(
            "/auth/reset-password",
            json={"token": token, "new_password": "anotherpass1"},
        )
        assert resp2.status_code == 400

    def test_long_password_rejected(self, client, registered_user):
        """Passwords > 72 chars rejected before hitting bcrypt limit."""
        client.post(
            "/auth/forgot-password",
            json={"email": "alice@example.com"},
        )
        from app.database import reset_tokens_table

        token = reset_tokens_table.all()[0]["token"]

        resp = client.post(
            "/auth/reset-password",
            json={"token": token, "new_password": "a" * 200},
        )
        assert resp.status_code in (400, 422)


class TestResetPasswordFailure:
    """Modos de fallo — invalid or expired token."""

    def test_invalid_token_returns_400(self, client):
        resp = client.post(
            "/auth/reset-password",
            json={"token": "totally-fake-token", "new_password": "newpass123"},
        )
        assert resp.status_code == 400

    def test_empty_token_returns_400(self, client):
        resp = client.post(
            "/auth/reset-password",
            json={"token": "", "new_password": "newpass123"},
        )
        assert resp.status_code == 400

    def test_short_new_password_returns_400(self, client, registered_user):
        """Password < 6 chars must be rejected by Pydantic validation."""
        client.post(
            "/auth/forgot-password",
            json={"email": "alice@example.com"},
        )
        from app.database import reset_tokens_table

        token = reset_tokens_table.all()[0]["token"]

        resp = client.post(
            "/auth/reset-password",
            json={"token": token, "new_password": "12345"},
        )
        assert resp.status_code in (400, 422)
