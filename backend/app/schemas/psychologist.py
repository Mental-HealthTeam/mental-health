from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class MockSlot(BaseModel):
    time_label: str
    time: datetime


class Review(BaseModel):
    author: str
    age: int
    topic_tag: str
    rating: int
    verified: bool
    text: str


class Certificate(BaseModel):
    title: str


class PsychologistListItem(BaseModel):
    psychologist_id: UUID
    full_name: str
    specialization: list[str]
    mock_slots: list[MockSlot]


class PsychologistDetailResponse(BaseModel):
    psychologist_id: UUID
    full_name: str
    specialization: list[str]
    experience: str
    methods: list[str]
    bio: dict[str, str]
    certificates: list[Certificate]
    reviews: list[Review]
    meet_link: str
    mock_slots: list[MockSlot]
