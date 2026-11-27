import uuid
from datetime import datetime, timezone

import pytest

from database.models.models import Language
from payment_provider.wayforpay_signature import (
    calculate_signature,
    verify_signature,
)
from services.localization import pick
from services.slot_service import free_slots, slots_in_window


def test_pick_prefers_requested_language():
    assert pick("uk", "en", Language.UKRAINIAN) == "uk"
    assert pick("uk", "en", Language.ENGLISH) == "en"


def test_pick_defaults_to_ukrainian():
    assert pick("uk", "en") == "uk"


@pytest.mark.parametrize("empty", [None, ""])
def test_pick_falls_back_to_other_language(empty):
    assert pick(empty, "en", Language.UKRAINIAN) == "en"
    assert pick("uk", empty, Language.ENGLISH) == "uk"


def test_pick_both_empty():
    assert pick(None, None, Language.ENGLISH) is None


def test_calculate_signature_is_stable_md5_hex():
    first = calculate_signature(["a", "b", 1], "secret")
    second = calculate_signature(["a", "b", 1], "secret")

    assert first == second
    assert len(first) == 32
    assert int(first, 16) >= 0


def test_calculate_signature_treats_none_as_empty_string():
    assert calculate_signature(["a", None, "b"], "k") == calculate_signature(
        ["a", "", "b"], "k"
    )


def test_calculate_signature_depends_on_secret_and_values():
    base = calculate_signature(["a"], "k1")

    assert base != calculate_signature(["a"], "k2")
    assert base != calculate_signature(["b"], "k1")


def test_verify_signature():
    signature = calculate_signature(["a", "b"], "k")

    assert verify_signature(["a", "b"], "k", signature) is True
    assert verify_signature(["a", "b"], "k", signature.upper()) is True
    assert verify_signature(["a", "b"], "k", "0" * 32) is False
    assert verify_signature(["a", "x"], "k", signature) is False


@pytest.mark.parametrize("bad", [None, 123, "підпис"])
def test_verify_signature_rejects_invalid_types(bad):
    assert verify_signature(["a"], "k", bad) is False


def iso(hour, day=1):
    return datetime(2030, 1, day, hour, tzinfo=timezone.utc).isoformat()


def test_slots_in_window_bounds_are_inclusive():
    slots = [iso(10), iso(14), iso(18)]
    low = datetime(2030, 1, 1, 14, tzinfo=timezone.utc)
    high = datetime(2030, 1, 1, 18, tzinfo=timezone.utc)

    assert slots_in_window(slots, low, high) == [iso(14), iso(18)]


def test_slots_in_window_none_means_no_limit():
    slots = [iso(10), iso(14)]
    bound = datetime(2030, 1, 1, 12, tzinfo=timezone.utc)

    assert slots_in_window(slots, None, None) == slots
    assert slots_in_window(slots, bound, None) == [iso(14)]
    assert slots_in_window(slots, None, bound) == [iso(10)]


def test_free_slots_skips_past_and_taken():
    psychologist_id = uuid.uuid4()
    past = datetime(2020, 1, 1, 10, tzinfo=timezone.utc).isoformat()
    taken = datetime(2099, 1, 1, 10, tzinfo=timezone.utc)
    free = datetime(2099, 1, 2, 10, tzinfo=timezone.utc)
    mock_slots = [past, taken.isoformat(), free.isoformat()]

    result = free_slots(mock_slots, {(psychologist_id, taken)}, psychologist_id)

    assert result == [free.isoformat()]


def test_free_slots_ignores_slots_taken_by_other_psychologist():
    mine, other = uuid.uuid4(), uuid.uuid4()
    slot_time = datetime(2099, 1, 1, 10, tzinfo=timezone.utc)

    result = free_slots([slot_time.isoformat()], {(other, slot_time)}, mine)

    assert result == [slot_time.isoformat()]


def test_free_slots_handles_missing_slots():
    assert free_slots(None, set(), uuid.uuid4()) == []
