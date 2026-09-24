from typing import Annotated

from ai_model.gemini_client import GeminiClient
from ai_model.grok_client import GrokClient
from ai_model.groq_client import GroqClient
from config.settings import Settings
from fastapi import Depends
from pydantic_settings import BaseSettings


def get_settings():
    return Settings()


def get_gemini_client(
    settings: Annotated[BaseSettings, Depends(get_settings)]
):
    return GeminiClient(
        api_key=settings.GEMINI_API_KEY
    )


def get_grok_client(
    settings: Annotated[BaseSettings, Depends(get_settings)]
):
    return GrokClient(
        api_key=settings.XAI_API_KEY
    )


def get_groq_client(
    settings: Annotated[BaseSettings, Depends(get_settings)]
):
    return GroqClient(
        api_key=settings.GROQ_API_KEY
    )
