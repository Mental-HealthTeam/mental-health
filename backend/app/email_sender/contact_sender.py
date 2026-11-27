import asyncio
import logging
import smtplib
from email.message import EmailMessage

from email_sender.email_sender_interface import ContactServiceInterface

logger = logging.getLogger(__name__)


class ContactService(ContactServiceInterface):
    def __init__(
        self,
        contact_support_email: str,
        smtp_port: int,
        smtp_host: str,
        smtp_from_email: str,
        environment: str,
        smtp_use_tls: bool,
        smtp_username: str,
        smtp_password: str
    ):
        self.contact_support_email = contact_support_email
        self.smtp_port = smtp_port
        self.smtp_host = smtp_host
        self.smtp_from_email = smtp_from_email
        self.environment = environment
        self.smtp_use_tls = smtp_use_tls
        self.smtp_username = smtp_username
        self.smtp_password = smtp_password


    def _send(
        self,
        email: EmailMessage
    ) -> None:
        with smtplib.SMTP(
            self.smtp_host,
            self.smtp_port,
            timeout=10,
        ) as smtp:
            if self.smtp_use_tls:
                smtp.starttls()

            if self.smtp_username:
                smtp.login(
                    self.smtp_username,
                    self.smtp_password
                )

            smtp.send_message(email)


    async def send_contact_message(
        self,
        name: str,
        contact: str,
        message: str,
        user_id: str | None = None,
    ) -> None:
        support_email = self.contact_support_email or "support@platform.com"

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
            self.smtp_host
            and self.smtp_from_email
        )

        if not smtp_configured:
            if self.environment.lower() != "development":
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
        email["From"] = self.smtp_from_email
        email["To"] = support_email
        email["Reply-To"] = contact
        email.set_content(body)

        await asyncio.to_thread(
            self._send,
            email
        )
