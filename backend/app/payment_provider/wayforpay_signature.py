import hmac
import hashlib


def calculate_signature(
        values: list,
        secret_key: str
) -> str:
    message = ";".join([str(value) if value is not None else "" for value in values]).encode("UTF-8")
    key = secret_key.encode("UTF-8")
    result = hmac.new(key, message, hashlib.md5).hexdigest()

    return result


def verify_signature(
        values: list,
        secret_key: str,
        received_signature: str
) -> bool:
    if not isinstance(received_signature, str):
        return False
    if not received_signature.isascii():
        return False
    my_signature = calculate_signature(
        values=values,
        secret_key=secret_key
    )
    received_signature = received_signature.lower()

    return hmac.compare_digest(my_signature, received_signature)
