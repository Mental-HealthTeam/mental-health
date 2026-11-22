import uuid

from fastapi import UploadFile

from storage.storage_interface import AvatarStorageInterface


class FakeAvatarStorage(AvatarStorageInterface):
    URL_PREFIX = "/media/avatars/"

    def __init__(self):
        self.storage: dict[str, bytes] = {}
        self.deleted: list[str] = []

    async def save_avatar(
            self,
            file: UploadFile,
            user_id: uuid.UUID,
    ) -> str:
        content = await file.read()
        extension = (file.filename or "avatar.png").rsplit(".", 1)[-1]
        url = f"{self.URL_PREFIX}{user_id}_{uuid.uuid4().hex}.{extension}"
        self.storage[url] = content
        return url


    def delete_avatar_file(
            self,
            avatar_url: str | None,
            user_id: uuid.UUID,
    ) -> None:
        if not avatar_url:
            return
        self.deleted.append(avatar_url)
        self.storage.pop(avatar_url, None)
