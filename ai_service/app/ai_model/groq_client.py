from ai_model.ai_interface import AIClientInterface
from groq import Groq


class GroqClient(AIClientInterface):
    def __init__(self, api_key):
        self.api_key = api_key

    def _create_groq_client(self):
        client = Groq(api_key=self.api_key)
        return client

    def generate_reply(self, message: str, model: str = "openai/gpt-oss-20b") -> str:
        client = self._create_groq_client()
        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": message,
                    }
                ],
                model=model,
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            raise RuntimeError("AI service temporarily unavailable") from e