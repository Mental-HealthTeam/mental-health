from pydantic import BaseModel, field_validator


class PayoutDetailsFields(BaseModel):
    iban: str
    tax_id: str
    account_name: str

    @field_validator("iban")
    @classmethod
    def validate_iban(cls, value: str) -> str:
        iban = value.replace(" ", "").upper()

        if len(iban) != 29:
            raise ValueError("IBAN must be 29 characters long")
        if not iban.startswith("UA"):
            raise ValueError("IBAN must start with UA")
        if not (iban[2:].isascii() and iban[2:].isdigit()):
            raise ValueError("IBAN must contain only digits after UA")

        rearranged = iban[4:] + iban[:4]
        numeric_iban = "".join(
            str(int(char, 36)) for char in rearranged
        )
        if int(numeric_iban) % 97 != 1:
            raise ValueError("IBAN checksum is invalid")

        return iban

    @field_validator("tax_id")
    @classmethod
    def validate_tax_id(cls, value: str) -> str:
        if len(value) not in (8, 10):
            raise ValueError("Tax ID must be 8 or 10 digits long")
        if not (value.isascii() and value.isdigit()):
            raise ValueError("Tax ID must contain only digits 0-9")
        return value

    @field_validator("account_name")
    @classmethod
    def validate_account_name(cls, value: str) -> str:
        account_name = value.strip()
        if not account_name:
            raise ValueError("Account name must not be empty")
        if len(account_name) > 255:
            raise ValueError("Account name is too long")
        return account_name


class PayoutDetailsResponse(PayoutDetailsFields):
    pass
