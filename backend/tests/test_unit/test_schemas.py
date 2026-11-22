from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import pytest
from pydantic import ValidationError

from database.models.models import BookingStatus
from schemas.booking import BookingCreateRequest, ResolveDisputeRequest
from schemas.contact import ContactRequest
from schemas.matching import MatchingInfo
from schemas.payout import PayoutDetailsFields
from schemas.psychologist import PsychologistBioFields, PsychologistProfileUpdate
from schemas.users import UserProfileUpdate


def payout(iban, tax_id="12345678", name="Test"):
    return PayoutDetailsFields(iban=iban, tax_id=tax_id, account_name=name)


def test_payout_iban_is_normalised(make_iban):
    iban = make_iban(3)

    result = payout(f"{iban[:4].lower()} {iban[4:]}")

    assert result.iban == iban


@pytest.mark.parametrize("bad", ["UA12", "PL" + "1" * 27, "UA" + "A" * 27])
def test_payout_iban_rejects_bad_format(bad):
    with pytest.raises(ValidationError):
        payout(bad)


def test_payout_iban_rejects_wrong_checksum(make_iban):
    iban = make_iban(3)

    with pytest.raises(ValidationError):
        payout(iban[:-1] + ("0" if iban[-1] != "0" else "1"))


@pytest.mark.parametrize("tax_id", ["12345678", "1234567890"])
def test_payout_tax_id_valid(make_iban, tax_id):
    assert payout(make_iban(1), tax_id=tax_id).tax_id == tax_id


@pytest.mark.parametrize("tax_id", ["1234567", "123456789", "12345abc", ""])
def test_payout_tax_id_invalid(make_iban, tax_id):
    with pytest.raises(ValidationError):
        payout(make_iban(1), tax_id=tax_id)


def test_payout_account_name_is_stripped_and_limited(make_iban):
    assert payout(make_iban(1), name="  Іван ").account_name == "Іван"
    with pytest.raises(ValidationError):
        payout(make_iban(1), name="   ")
    with pytest.raises(ValidationError):
        payout(make_iban(1), name="x" * 256)


@pytest.mark.parametrize(
    "value,expected",
    [("@abcde", "abcde"), ("abcde", "abcde"), ("  abcde ", "abcde"),
     ("", None), ("   ", None), (None, None)],
)
def test_user_telegram_normalised(value, expected):
    assert UserProfileUpdate(telegram=value).telegram == expected


@pytest.mark.parametrize("bad", ["abcd", "a" * 33, "bad name", "кирилиця"])
def test_user_telegram_invalid(bad):
    with pytest.raises(ValidationError):
        UserProfileUpdate(telegram=bad)


def test_user_update_forbids_extra_fields():
    with pytest.raises(ValidationError):
        UserProfileUpdate(role="admin")


def contact(**overrides):
    data = {"name": "Ivan", "contact": "@my_user", "message": "Hello"}
    data.update(overrides)
    return ContactRequest(**data)


@pytest.mark.parametrize(
    "value,expected",
    [
        ("@my_user", "my_user"),
        ("  my_user  ", "my_user"),
        ("my.name1@gmail.com", "my.name1@gmail.com"),
        ("my.name1@googlemail.com", "my.name1@googlemail.com"),
    ],
)
def test_contact_accepts_telegram_and_gmail(value, expected):
    assert contact(contact=value).contact == expected


@pytest.mark.parametrize(
    "bad",
    ["a@yahoo.com", "ab", "a..bcdef@gmail.com", ".abcdef@gmail.com", "ab@gmail.com"],
)
def test_contact_rejects_other_contacts(bad):
    with pytest.raises(ValidationError):
        contact(contact=bad)


def test_contact_trims_and_validates_text():
    assert contact(name="  Ivan  ", message="  Hi  ").message == "Hi"
    with pytest.raises(ValidationError):
        contact(name="Iv\nan")
    with pytest.raises(ValidationError):
        contact(message="   ")


def matching(**overrides):
    data = {"session_id": "s", "symptom_codes": ["anxiety"], "language": ["uk"]}
    data.update(overrides)
    return MatchingInfo(**data)


def test_matching_swaps_reversed_ranges():
    info = matching(
        min_price_per_hour=2000, max_price_per_hour=500,
        min_experience_years=10, max_experience_years=2,
    )

    assert (info.min_price_per_hour, info.max_price_per_hour) == (500, 2000)
    assert (info.min_experience_years, info.max_experience_years) == (2, 10)


def test_matching_swaps_reversed_time_window():
    info = matching(
        min_range_suitable_time="2030-01-01T15:00:00+00:00",
        max_range_suitable_time="2030-01-01T10:00:00+00:00",
    )

    assert info.min_range_suitable_time < info.max_range_suitable_time


def test_matching_naive_time_becomes_kyiv():
    info = matching(min_range_suitable_time="2030-01-01T12:00:00")

    assert info.min_range_suitable_time.tzinfo == ZoneInfo("Europe/Kyiv")


def test_matching_requires_at_least_one_symptom():
    with pytest.raises(ValidationError):
        matching(symptom_codes=[])


def test_booking_create_requires_timezone():
    with pytest.raises(ValidationError):
        BookingCreateRequest(
            psychologist_id="00000000-0000-0000-0000-000000000001",
            selected_time=datetime(2030, 1, 1, 10),
        )


def test_booking_create_accepts_aware_time_and_rejects_extra():
    aware = datetime(2030, 1, 1, 10, tzinfo=timezone.utc)
    ok = BookingCreateRequest(
        psychologist_id="00000000-0000-0000-0000-000000000001", selected_time=aware
    )

    assert ok.ai_session_id is None
    with pytest.raises(ValidationError):
        BookingCreateRequest(
            psychologist_id="00000000-0000-0000-0000-000000000001",
            selected_time=aware, unexpected=1,
        )


@pytest.mark.parametrize(
    "status,valid",
    [(BookingStatus.COMPLETED, True), (BookingStatus.CANCELLED, True),
     (BookingStatus.CONFIRMED, False), (BookingStatus.PENDING, False)],
)
def test_resolve_dispute_allowed_statuses(status, valid):
    if valid:
        assert ResolveDisputeRequest(new_status=status).new_status == status
    else:
        with pytest.raises(ValidationError):
            ResolveDisputeRequest(new_status=status)


def test_bio_fields_need_at_least_one_value():
    with pytest.raises(ValidationError):
        PsychologistBioFields()
    with pytest.raises(ValidationError):
        PsychologistBioFields(about="   ")
    assert PsychologistBioFields(about="Текст").about == "Текст"


@pytest.mark.parametrize(
    "data",
    [
        {}, {"title": " "}, {"methods": [" "]}, {"certificates": ["a", ""]},
        {"languages": []}, {"languages": ["xx"]}, {"price_per_hour": 0},
        {"experience_years": -1}, {"meet_link": "nope"},
    ],
)
def test_profile_update_rejects_invalid_data(data):
    with pytest.raises(ValidationError):
        PsychologistProfileUpdate(**data)


def test_profile_update_accepts_partial_data():
    update = PsychologistProfileUpdate(languages=["uk", "en"], experience_years=3)

    assert update.languages == ["uk", "en"]
    assert update.title is None
