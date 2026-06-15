from collections.abc import Generator

from fastapi import HTTPException
from psycopg import Connection
from psycopg_pool import ConnectionPool

from app.core.config import get_settings

_pool: ConnectionPool | None = None


def init_pool() -> None:
    global _pool
    settings = get_settings()

    if _pool or not settings.database_url:
        return

    # --- SECAO: POOL POSTGRES ---
    _pool = ConnectionPool(
        conninfo=settings.database_url,
        min_size=1,
        max_size=5,
        open=True,
    )


def close_pool() -> None:
    global _pool

    if _pool:
        _pool.close()
        _pool = None


def get_pool() -> ConnectionPool:
    if not _pool:
        init_pool()

    if not _pool:
        raise HTTPException(
            status_code=503,
            detail="DATABASE_URL nao configurado para o backend.",
        )

    return _pool


def get_connection() -> Generator[Connection, None, None]:
    with get_pool().connection() as connection:
        yield connection


def get_optional_connection() -> Generator[Connection | None, None, None]:
    settings = get_settings()

    if not settings.database_url:
        yield None
        return

    with get_pool().connection() as connection:
        yield connection
