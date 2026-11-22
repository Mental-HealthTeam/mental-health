from email_sender.email_sender_interface import ContactServiceInterface


class FakeContactService(ContactServiceInterface):
    def __init__(self):
        self.calls: list[dict] = []
        self.error: Exception | None = None

    async def send_contact_message(
        self,
        name: str,
        contact: str,
        message: str,
        user_id: str | None = None,
    ) -> None:
        call_kwargs = {
            "name": name,
            "contact": contact,
            "message": message,
            "user_id": user_id
        }
        self.calls.append(call_kwargs)
        if self.error is not None:
            raise self.error