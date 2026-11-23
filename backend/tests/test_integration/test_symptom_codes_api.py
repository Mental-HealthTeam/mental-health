from database.models.models import SymptomCode


async def test_symptom_codes_list(client):
    response = await client.get("/api/symptom-codes")

    assert response.status_code == 200
    assert response.json() == [code.value for code in SymptomCode]


async def test_symptom_codes_has_no_duplicates(client):
    response = await client.get("/api/symptom-codes")

    codes = response.json()
    assert len(codes) == len(set(codes))
