from ai_model.ai_interface import AIClientInterface
from groq import AsyncGroq, APITimeoutError


class GroqClient(AIClientInterface):
    def __init__(self, api_key):
        self.api_key = api_key

    def _create_groq_client(self):
        client = AsyncGroq(
            api_key=self.api_key,
            timeout=30.0
        )
        return client

    async def generate_reply(self, messages: list[dict], model: str = "openai/gpt-oss-120b") -> str:
        client = self._create_groq_client()
        try:
            chat_completion = await client.chat.completions.create(
                messages=messages,
                model=model,
            )
            return chat_completion.choices[0].message.content
        except APITimeoutError as e:
            raise RuntimeError("Request timed out, please try again") from e
        except Exception as e:
            raise RuntimeError("AI service temporarily unavailable") from e

    async def stream_reply(self, messages: list[dict], model: str = "openai/gpt-oss-120b") -> str:
        client = self._create_groq_client()
        try:
            stream = await client.chat.completions.create(
                messages=messages,
                model=model,
                stream=True
            )
            async for chunk in stream:
                content = chunk.choices[0].delta.content
                if content:
                    yield content
        except APITimeoutError as e:
            raise RuntimeError("Request timed out, please try again") from e
        except Exception as e:
            raise RuntimeError("AI service temporarily unavailable") from e
