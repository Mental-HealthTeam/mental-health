import logging
import smtplib
from email.message import EmailMessage

from config.settings import Settings


logger = logging.getLogger(__name__)


class ContactService:
    def __init__(self, settings: Settings):
        self.settings = settings

    def send_contact_message(
        self,
        name: str,
        contact: str,
        message: str,
        user_id: str | None = None,
    ) -> None:
        support_email = self.settings.CONTACT_SUPPORT_EMAIL or "support@platform.com"

        if not support_email:
            raise RuntimeError("CONTACT_SUPPORT_EMAIL is not configured.")

        subject = f"New contact request from {name}"
        body = (
            f"Name: {name}\n"
            f"Contact: {contact}\n"
            f"User ID: {user_id or 'Anonymous'}\n\n"
            f"Message:\n{message}"
        )

        smtp_configured = bool(
            self.settings.SMTP_HOST
            and self.settings.SMTP_FROM_EMAIL
        )

        if not smtp_configured:
            if self.settings.APP_ENV.lower() != "development":
                raise RuntimeError("SMTP is not configured.")

            logger.info(
                "Contact email (development mode)\nTo: %s\nSubject: %s\n\n%s",
                support_email,
                subject,
                body,
            )
            return

        email = EmailMessage()
        email["Subject"] = subject
        email["From"] = self.settings.SMTP_FROM_EMAIL
        email["To"] = support_email
        email["Reply-To"] = contact
        email.set_content(body)

        with smtplib.SMTP(
            self.settings.SMTP_HOST,
            self.settings.SMTP_PORT,
            timeout=10,
        ) as smtp:
            if self.settings.SMTP_USE_TLS:
                smtp.starttls()

            if self.settings.SMTP_USERNAME:
                smtp.login(
                    self.settings.SMTP_USERNAME,
                    self.settings.SMTP_PASSWORD,
                )

            smtp.send_message(email)
