import logging

from ai_model.ai_interface import AIClientInterface
from anthropic import AsyncAnthropic, APITimeoutError, RateLimitError


logger = logging.getLogger(__name__)


class ClaudeClient(AIClientInterface):
    def __init__(self, api_key):
        self.api_key = api_key

    def _create_claude_client(self):
        client = AsyncAnthropic(
            api_key=self.api_key,
            timeout=30.0
        )
        return client

    @staticmethod
    def _split(messages):
        system = next(
            (
                message["content"] for message in messages
                if message["role"] == "system"
            )
            ,""
        )
        chat = [
            message for message in messages
            if message["role"] != "system"
        ]
        return system, chat


    async def generate_reply(self, messages: list[dict], model: str) -> str:
        raise NotImplementedError


    async def stream_reply(self, messages: list[dict], model: str = "claude-haiku-5-5") -> str:
        client = self._create_claude_client()
        system, chat = self._split(messages=messages)
        try:
            async with client.messages.stream(
                model=model,
                max_tokens=2048,
                system=system,
                messages=chat,
                output_config={"effort": "medium"}
            ) as stream:
                async for text in stream.text_stream:
                    yield text
                final = await stream.get_final_message()
                if final.stop_reason == "refusal":
                    logger.warning("Claude refused (details=%s)", final.stop_details)
        except APITimeoutError as e:
            logger.warning(
                "Claude stream timed out (model=%s, timeout=30s)", model
            )
            raise RuntimeError("Request timed out, please try again") from e
        except RateLimitError as e:
            retry_after = e.response.headers.get("retry-after")
            logger.warning(
                "Claude rate limit hit (model=%s, retry_after=%s)", model, retry_after
            )
            raise RuntimeError("AI service is busy, please try again later") from e
        except Exception as e:
            logger.exception(
                "Claude stream failed (model=%s, messages=%d)",
                model,
                len(messages)
            )
            raise RuntimeError("AI service temporarily unavailable") from e
