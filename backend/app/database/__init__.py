import os

from database.models.base import Base  # noqa: F401

environment = os.getenv("ENVIRONMENT", "developing")

if environment == "testing":
    from database.session_sqlite import (  # noqa: F401
        get_sqlite_db as get_db,
        get_sqlite_db_contextmanager as get_db_contextmanager
    )
else:
    from database.session_postgresql import (  # noqa: F401
        get_postgresql_db as get_db,
        get_postgresql_db_contextmanager as get_db_contextmanager
    )
