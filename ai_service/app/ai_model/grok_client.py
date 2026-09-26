from ai_model.ai_interface import AIClientInterface
from xai_sdk import Client
from xai_sdk.chat import user


class GrokClient(AIClientInterface):
    def __init__(self, api_key):
        self.api_key = api_key

    def _create_grok_client(self):
        client = Client(api_key=self.api_key)
        return client

    def generate_reply(self, message: str, model: str = "grok-4.6") -> str:
        client = self._create_grok_client()
        try:
            chat = client.chat.create(model=model, messages=[user(message)])
            response = chat.sample()
            return response.content
        except Exception as e:
            raise RuntimeError("AI service temporarily unavailable") from e
