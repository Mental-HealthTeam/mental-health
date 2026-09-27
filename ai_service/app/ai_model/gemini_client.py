from ai_model.ai_interface import AIClientInterface
from google import genai
from google.genai._gaos.lib.compat_errors import BadRequestError, InternalServerError


class GeminiClient(AIClientInterface):
    def __init__(self, api_key):
        self.api_key = api_key

    def _create_gemini_client(self):
        client = genai.Client(api_key=self.api_key)
        return client

    def generate_reply(self, message: str, model: str = "gemini-3.8-flash") -> str:
        client = self._create_gemini_client()
        try:
            interaction = client.interactions.create(
                model=model,
                input=message,
            )
            return interaction.output_text
        except (InternalServerError, BadRequestError) as e:
            raise RuntimeError("AI service temporarily unavailable") from e
