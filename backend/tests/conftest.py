import io
import itertools
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from PIL import Image
from sqlalchemy import delete

from auth.dependencies import get_google_provider
from auth.token_manager import JWTAuthManager
from config.dependencies import (
    get_email_sender,
    get_local_storage,
    get_payment_provider,
    get_redis_storage,
    get_settings,
)
from config.settings import TestSettings
from database import (
    get_db_contextmanager,
    reset_database,
    sqlite_engine,
)
from database.models.models import (
    AI_Session,
    Booking,
    BookingStatus,
    Gender,
    PaymentStatus,
    Psychologist,
    PsychologistSpecialization,
    PsychologistStatus,
    SymptomCode,
    User,
    UserRole,
    UserSymptomCode,
)
from main import app
from payment_provider.factory import build_payment_provider, clear_provider_cache
from payment_provider.payment_types import (
    PaymentEventType,
    PaymentProviderName,
    PaymentWebhook,
)
from payment_provider.wayforpay_signature import calculate_signature
from storage.local_storage import AvatarLocalStorage
from tests.doubles.fakes.auth_provider import FakeAuthProvider
from tests.doubles.fakes.email_sender import FakeContactService
from tests.doubles.fakes.payment import FakePaymentProvider
from tests.doubles.fakes.redis_storage import FakeSessionStorage


def pytest_configure(config):
    config.addinivalue_line("markers", "e2e: End-to-end tests")
    config.addinivalue_line("markers", "unit: Unit tests")
    config.addinivalue_line("markers", "integration: Integration tests")


def pytest_collection_modifyitems(config, items):
    for item in items:
        path = str(item.fspath)
        if "test_integration" in path:
            item.add_marker(pytest.mark.integration)
        if "test_e2e" in path:
            item.add_marker(pytest.mark.e2e)
        if "test_unit" in path:
            item.add_marker(pytest.mark.unit)


@pytest_asyncio.fixture(autouse=True)
async def reset_db():
    """Every test starts with empty tables."""
    await reset_database()
    yield


@pytest_asyncio.fixture(scope="session", autouse=True)
async def db_session_dispose():
    yield
    await sqlite_engine.dispose()


@pytest_asyncio.fixture
async def db_session():
    async with get_db_contextmanager() as session:
        yield session


@pytest.fixture
def fetch(db_session):
    """fetch(select(Model)) -> list of fresh rows (not from identity map)."""
    async def _fetch(statement):
        result = await db_session.execute(
            statement.execution_options(populate_existing=True)
        )
        return list(result.scalars().all())
    return _fetch


@pytest.fixture
def reload(db_session):
    """Re-read an object from the DB after the API changed it."""
    async def _reload(obj):
        await db_session.refresh(obj)
        return obj
    return _reload


@pytest.fixture
def settings(tmp_path):
    return TestSettings(AVATAR_STORAGE_DIR=str(tmp_path / "avatars"))


@pytest.fixture
def jwt_manager(settings):
    return JWTAuthManager(
        secret_key_access=settings.SECRET_KEY_ACCESS,
        secret_key_refresh=settings.SECRET_KEY_REFRESH,
        algorithm=settings.JWT_SIGNING_ALGORITHM,
        access_key_timedelta_minutes=settings.ACCESS_TTL_MIN,
        refresh_key_timedelta_minutes=settings.refresh_ttl_min,
    )


@pytest.fixture
def fake_payment():
    return FakePaymentProvider()


@pytest.fixture
def fake_google():
    return FakeAuthProvider()


@pytest.fixture
def fake_redis():
    return FakeSessionStorage()


@pytest.fixture
def fake_email():
    return FakeContactService()


@pytest.fixture
def avatar_storage(settings):
    """Real local storage in a temporary folder."""
    return AvatarLocalStorage(
        max_avatar_upload_size=settings.MAX_AVATAR_UPLOAD_SIZE,
        max_avatar_size=settings.MAX_AVATAR_SIZE,
        max_avatar_pixels=settings.MAX_AVATAR_PIXELS,
        avatar_storage_dir=settings.AVATAR_STORAGE_DIR,
        avatar_storage_url=settings.AVATAR_STORAGE_URL,
    )


@pytest_asyncio.fixture
async def client(
    settings,
    fake_payment,
    fake_google,
    fake_redis,
    fake_email,
    avatar_storage,
):
    clear_provider_cache()
    app.dependency_overrides[get_settings] = lambda: settings
    app.dependency_overrides[get_payment_provider] = lambda: fake_payment
    app.dependency_overrides[get_google_provider] = lambda: fake_google
    app.dependency_overrides[get_redis_storage] = lambda: fake_redis
    app.dependency_overrides[get_email_sender] = lambda: fake_email
    app.dependency_overrides[get_local_storage] = lambda: avatar_storage
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
    clear_provider_cache()


@pytest.fixture
def use_real_wayforpay(settings):
    """Swap the fake provider for the real WayForPay one (signatures)."""
    def _use():
        clear_provider_cache()
        provider = build_payment_provider(
            name=PaymentProviderName.WAYFORPAY, settings=settings
        )
        app.dependency_overrides[get_payment_provider] = lambda: provider
        return provider
    return _use


@pytest.fixture
def slot():
    """slot(days=2, hour=10) -> an hour-aligned UTC datetime in the future."""
    def _slot(days: int = 2, hour: int = 10) -> datetime:
        base = datetime.now(timezone.utc) + timedelta(days=days)
        return base.replace(hour=hour, minute=0, second=0, microsecond=0)
    return _slot


_counter = itertools.count(1)


@pytest.fixture
def make_user(db_session):
    async def _make(
        role: UserRole = UserRole.CLIENT,
        email: str | None = None,
        name: str | None = "Test User",
        telegram: str | None = None,
        avatar_url: str | None = None,
    ) -> User:
        number = next(_counter)
        user = User(
            id=uuid.uuid4(),
            email=email or f"user{number}@example.com",
            name=name,
            telegram=telegram,
            avatar_url=avatar_url,
            role=role,
        )
        db_session.add(user)
        await db_session.commit()
        return user
    return _make


@pytest.fixture
def auth_headers(jwt_manager, settings):
    """auth_headers(user) -> {"Cookie": "access=<jwt>"}"""
    def _headers(user: User) -> dict:
        token = jwt_manager.create_access_token(
            data={
                "sub": str(user.id),
                "role": user.role.value,
                "type": "access",
            }
        )
        return {"Cookie": f"{settings.ACCESS_COOKIE}={token}"}
    return _headers


@pytest_asyncio.fixture
async def client_user(make_user):
    return await make_user(role=UserRole.CLIENT)


@pytest_asyncio.fixture
async def other_client(make_user):
    return await make_user(role=UserRole.CLIENT)


@pytest_asyncio.fixture
async def admin_user(make_user):
    return await make_user(role=UserRole.ADMIN, name="Admin")


@pytest.fixture
def client_headers(client_user, auth_headers):
    return auth_headers(client_user)


@pytest.fixture
def set_user_symptoms(db_session):
    """set_user_symptoms(user, [SymptomCode.STRESS]) -> replaces the user's symptom codes."""
    async def _set(user: User, codes: list[SymptomCode]) -> None:
        await db_session.execute(
            delete(UserSymptomCode).where(UserSymptomCode.user_id == user.id)
        )
        db_session.add_all(
            UserSymptomCode(user_id=user.id, symptom_code=code) for code in codes
        )
        await db_session.commit()
    return _set


@pytest.fixture
def admin_headers(admin_user, auth_headers):
    return auth_headers(admin_user)


@pytest.fixture
def make_iban():
    """Valid UA IBAN (29 chars, mod 97 checksum) for a given number."""
    def _iban(number: int = 1) -> str:
        bban = f"{300001:06d}{number:019d}"
        digits = int(bban + "301000")
        check = 98 - (digits % 97)
        return f"UA{check:02d}{bban}"
    return _iban


@pytest.fixture
def make_psychologist(db_session, make_user, slot, make_iban):
    async def _make(
        *,
        topics=("anxiety", "stress"),
        price: Decimal | str = "1000.00",
        experience_years: int = 5,
        gender: Gender = Gender.FEMALE,
        languages=("uk",),
        status: PsychologistStatus = PsychologistStatus.ACTIVE,
        slots: list[datetime] | None = None,
        full_name: str | None = "Тест Психолог",
        full_name_eng: str | None = "Test Psychologist",
        title: str | None = "Клінічний психолог",
        title_eng: str | None = "Clinical psychologist",
        methods=("КПТ",),
        methods_eng=("CBT",),
        meet_link: str | None = "https://meet.google.com/abc-defg-hij",
        email: str | None = None,
        avatar_url: str | None = None,
    ) -> Psychologist:
        number = next(_counter)
        user = await make_user(
            role=UserRole.PSYCHOLOGIST,
            email=email,
            name=full_name or full_name_eng,
            avatar_url=avatar_url,
        )
        if slots is None:
            slots = [slot(days=2, hour=10), slot(days=3, hour=12)]
        psychologist = Psychologist(
            user=user,
            psychologist_id=user.id,
            full_name=full_name,
            full_name_eng=full_name_eng,
            title=title,
            title_eng=title_eng,
            mock_slots=[s.isoformat() for s in slots],
            certificates=["Сертифікат"],
            certificates_eng=["Certificate"],
            bio={"about": "Про мене", "approach": "Підхід", "scope": "Запити"},
            bio_eng={"about": "About", "approach": "Approach", "scope": "Scope"},
            reviews=[],
            methods=list(methods),
            methods_eng=list(methods_eng),
            experience_years=experience_years,
            meet_link=meet_link,
            price_per_hour=Decimal(str(price)),
            profile_status=status,
            gender=gender,
            languages=list(languages),
            iban=make_iban(number),
            tax_id=f"{number:010d}",
            account_name="Test Account",
        )
        db_session.add(psychologist)
        await db_session.flush()
        for topic in topics:
            db_session.add(
                PsychologistSpecialization(
                    psychologist_id=user.id,
                    symptom_code=SymptomCode(topic),
                )
            )
        await db_session.commit()
        return psychologist
    return _make


@pytest_asyncio.fixture
async def psychologist(make_psychologist):
    return await make_psychologist()


@pytest.fixture
def psychologist_headers(psychologist, auth_headers):
    return auth_headers(psychologist.user)


@pytest.fixture
def make_booking(db_session, slot):
    async def _make(
        client: User,
        psychologist: Psychologist,
        *,
        selected_time: datetime | None = None,
        status: BookingStatus = BookingStatus.PENDING,
        payment_status: PaymentStatus = PaymentStatus.UNPAID,
        price: Decimal | str | None = None,
        hold_expires_at: datetime | None = None,
        payment_provider: PaymentProviderName | None = None,
        provider_session_id: str | None = None,
        payment_reference: str | None = None,
        **extra,
    ) -> Booking:
        if hold_expires_at is None and status == BookingStatus.PENDING:
            hold_expires_at = datetime.now(timezone.utc) + timedelta(minutes=20)
        booking = Booking(
            client_id=client.id,
            psychologist_id=psychologist.psychologist_id,
            selected_time=selected_time or slot(days=2, hour=10),
            status=status,
            payment_status=payment_status,
            price=Decimal(str(price)) if price is not None
            else psychologist.price_per_hour,
            currency="UAH",
            hold_expires_at=hold_expires_at,
            payment_provider=payment_provider,
            provider_session_id=provider_session_id,
            payment_reference=payment_reference,
            **extra,
        )
        if "id" not in extra:
            booking.id = uuid.uuid4()
        db_session.add(booking)
        await db_session.commit()
        return booking
    return _make


@pytest.fixture
def make_paid_booking(make_booking):
    """A CONFIRMED / HELD booking, as after a successful payment."""
    async def _make(client, psychologist, **kwargs):
        booking_id = uuid.uuid4()
        defaults = dict(
            status=BookingStatus.CONFIRMED,
            payment_status=PaymentStatus.HELD,
            payment_provider=PaymentProviderName.WAYFORPAY,
            provider_session_id=f"{booking_id}_1",
            payment_reference=f"{booking_id}_1",
            paid_at=datetime.now(timezone.utc),
            id=booking_id,
        )
        defaults.update(kwargs)
        return await make_booking(client, psychologist, **defaults)
    return _make


@pytest.fixture
def make_ai_session(db_session):
    async def _make(user: User | None, session_id: str = "chat-session-1"):
        record = AI_Session(
            id=uuid.uuid4(),
            ai_session_id=session_id,
            user_id=user.id if user else None,
            messages_count=3,
            duration_sec=60,
            recommendations_count=1,
        )
        db_session.add(record)
        await db_session.commit()
        return record
    return _make


@pytest.fixture
def make_webhook():
    """make_webhook(booking, "Approved") -> PaymentWebhook for the fake."""
    mapping = {
        "Approved": PaymentEventType.PAID,
        "Declined": PaymentEventType.FAILED,
        "Expired": PaymentEventType.EXPIRED,
        "Refunded": PaymentEventType.REFUNDED,
        "Voided": PaymentEventType.REFUNDED,
        "InProcessing": PaymentEventType.IGNORED,
    }

    def _make(booking: Booking, status: str, amount=None, reference=None):
        reference = reference or f"{booking.id}_1"
        amount = booking.price if amount is None else amount
        return PaymentWebhook(
            event_id=f"{reference}:{status}",
            event_type=mapping[status],
            payment_reference=reference,
            provider_session_id=reference,
            booking_id=booking.id,
            metadata={
                "amount": f"{Decimal(str(amount)):.2f}",
                "currency": "UAH",
                "reason_code": "1100",
            },
        )
    return _make


@pytest.fixture
def signed_wayforpay_payload(settings):
    """Signed JSON body, as WayForPay sends it to the webhook."""
    def _payload(order_reference: str, status="Approved", amount="1000.00"):
        values = [
            settings.WAYFORPAY_MERCHANT_ACCOUNT,
            order_reference,
            amount,
            "UAH",
            "123456",
            "41****1111",
            status,
            "1100",
        ]
        return {
            "merchantAccount": settings.WAYFORPAY_MERCHANT_ACCOUNT,
            "orderReference": order_reference,
            "amount": amount,
            "currency": "UAH",
            "authCode": "123456",
            "cardPan": "41****1111",
            "transactionStatus": status,
            "reasonCode": "1100",
            "merchantSignature": calculate_signature(
                values=values, secret_key=settings.WAYFORPAY_SECRET_KEY
            ),
        }
    return _payload


@pytest.fixture
def make_image():
    """make_image("PNG", (50, 50)) -> bytes"""
    def _image(fmt: str = "PNG", size=(50, 50)) -> bytes:
        buffer = io.BytesIO()
        Image.new("RGB", size, "red").save(buffer, format=fmt)
        return buffer.getvalue()
    return _image
