import smtplib
from email.message import EmailMessage

from app.core.config import settings


def send_reset_code_email(
    recipient_email: str,
    code: str,
) -> None:
    if not all(
        [
            settings.smtp_host,
            settings.smtp_username,
            settings.smtp_password,
            settings.smtp_from,
        ]
    ):
        print(
            f"Password reset code for "
            f"{recipient_email}: {code}"
        )
        return

    message = EmailMessage()

    message["Subject"] = (
        "SafeFlow password reset code"
    )
    message["From"] = settings.smtp_from
    message["To"] = recipient_email

    message.set_content(
        f"""
Hello,

Your SafeFlow password reset code is:

{code}

This code is valid for 2 hours.

SafeFlow Team
"""
    )

    with smtplib.SMTP(
        settings.smtp_host,
        settings.smtp_port,
    ) as smtp:
        smtp.starttls()
        smtp.login(
            settings.smtp_username,
            settings.smtp_password,
        )
        smtp.send_message(message)