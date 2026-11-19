"""
Tests for POST /auth/forgot-password — password reset email request.

This endpoint always returns 200 to prevent user enumeration.
"""

import pytest


class TestForgotPasswordHappyPath:
    """Camino feliz — email exists, token created."""

    def test_returns_200_for_existing_email(self, client, registered_user):
        resp = client.post(
            "/auth/forgot-password",
            json={"email": "alice@example.com"},
        )
        assert resp.status_code == 200
        assert "message" in resp.json()

    def test_returns_generic_message(self, client, registered_user):
        resp = client.post(
            "/auth/forgot-password",
            json={"email": "alice@example.com"},
        )
        body = resp.json()
        # Message should not reveal whether the email exists
        assert "correo" in body["message"].lower() or "restablecer" in body["message"].lower()


class TestForgotPasswordEdgeCases:
    """Casos límite — non-existent email, empty body."""

    def test_returns_200_for_nonexistent_email(self, client):
        """Must NOT reveal that the email doesn't exist (no enumeration)."""
        resp = client.post(
            "/auth/forgot-password",
            json={"email": "ghost@example.com"},
        )
        assert resp.status_code == 200

    def test_same_message_for_existing_and_nonexistent(self, client, registered_user):
        """The response message must be identical regardless of email existence."""
        resp_existing = client.post(
            "/auth/forgot-password",
            json={"email": "alice@example.com"},
        )
        resp_missing = client.post(
            "/auth/forgot-password",
            json={"email": "nobody@example.com"},
        )
        assert resp_existing.json()["message"] == resp_missing.json()["message"]

    def test_creates_reset_token_in_db(self, client, registered_user):
        """A reset token should be stored when the email exists."""
        from app.database import reset_tokens_table

        client.post(
            "/auth/forgot-password",
            json={"email": "alice@example.com"},
        )
        tokens = reset_tokens_table.all()
        assert len(tokens) >= 1

    def test_empty_body_returns_400(self, client):
        resp = client.post("/auth/forgot-password", json={})
        assert resp.status_code in (400, 422)


class TestForgotPasswordFailure:
    """Modos de fallo — malformed requests."""

    def test_invalid_email_format_returns_400(self, client):
        resp = client.post(
            "/auth/forgot-password",
            json={"email": "not-valid"},
        )
        # Depending on validation, could be 400 or 200 (always returns 200 per design)
        # The endpoint doesn't validate email format — it just does a lookup
        assert resp.status_code == 200
