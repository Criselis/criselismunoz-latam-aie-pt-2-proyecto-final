"""
Email sending via Resend SDK.

Used for password reset flow (AUTH-03).
"""

import logging

import resend
from app.config import settings

logger = logging.getLogger("nexova-api.email")


def send_password_reset_email(to_email: str, reset_token: str) -> bool:
    """
    Send a password-reset email with a one-time link.

    Args:
        to_email:  Recipient email address.
        reset_token:  The one-time reset token to embed in the URL.

    Returns:
        True if the email was accepted by Resend, False otherwise.
    """
    if not settings.RESEND_API_KEY:
        # Silent fallback — log without exposing the full token
        token_suffix = reset_token[-6:] if len(reset_token) > 6 else reset_token
        logger.info(
            "Mock email mode: would send reset to %s (token suffix: ...%s)",
            to_email, token_suffix,
        )
        return True

    resend.api_key = settings.RESEND_API_KEY

    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

    html_content = f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f3f4f6;
            margin: 0;
            padding: 0;
        }}
        .container {{
            max-width: 480px;
            margin: 40px auto;
            background: white;
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }}
        .logo {{
            font-size: 24px;
            font-weight: bold;
            color: #4338ca;
            text-align: center;
            margin-bottom: 24px;
        }}
        h1 {{
            font-size: 20px;
            color: #1f2937;
            text-align: center;
            margin-bottom: 8px;
        }}
        p {{
            font-size: 15px;
            color: #6b7280;
            line-height: 1.6;
            text-align: center;
        }}
        .btn {{
            display: block;
            width: 100%;
            max-width: 280px;
            margin: 24px auto;
            padding: 14px 0;
            background-color: #4338ca;
            color: white !important;
            text-decoration: none;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            text-align: center;
        }}
        .footer {{
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
            text-align: center;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">Nexova</div>
        <h1>Recuperación de contraseña</h1>
        <p>
            Recibiste este correo porque solicitaste restablecer tu contraseña
            en Nexova Talent Pipeline.
        </p>
        <a href="{reset_link}" class="btn" target="_blank">
            Restablecer contraseña
        </a>
        <p style="font-size:13px; color:#9ca3af;">
            Este enlace expira en 30 minutos y solo puede usarse una vez.
        </p>
        <p style="font-size:13px; color:#9ca3af;">
            Si no solicitaste este cambio, ignora este mensaje.
        </p>
        <div class="footer">
            Nexova Talent Pipeline &bull; Panel de gestión de talento
        </div>
    </div>
</body>
</html>
"""

    params = {
        "from": f"{settings.RESEND_FROM_NAME} <{settings.RESEND_FROM_EMAIL}>",
        "to": [to_email],
        "subject": "Recuperación de contraseña — Nexova",
        "html": html_content,
    }

    try:
        response = resend.Emails.send(params)
        logger.info("Reset email sent to %s (id=%s)", to_email, response.get("id", "unknown"))
        return True
    except Exception as exc:
        logger.error("Failed to send reset email to %s: %s", to_email, exc)
        return False