from typing import TypeVar

from database.models.models import Language


T = TypeVar("T")


def pick(
        uk_value: T | None,
        en_value: T | None,
        language: Language = Language.UKRAINIAN
) -> T | None:
    if language == Language.ENGLISH:
        preferred, fallback = en_value, uk_value
    else:
        preferred, fallback = uk_value, en_value
    return preferred or fallback
