
from fastapi import APIRouter

from database.models.models import SymptomCode

router = APIRouter()


@router.get(
    "/symptom-codes",
    response_model=list[str],
    summary="Get available symptom codes",
)
async def get_symptom_codes() -> list[str]:
    return [symptom.value for symptom in SymptomCode]
