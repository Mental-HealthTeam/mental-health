class AppError(Exception):
    def __init__(  # noqa: B042
            self,
            status_code: int,
            code: str,
            detail: str,
            **extra
    ):
        super().__init__(detail)
        self.status_code = status_code
        self.code = code
        self.detail = detail
        self.extra = extra

        super().__init__(detail)
