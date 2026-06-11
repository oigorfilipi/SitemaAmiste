from fastapi import APIRouter, Depends
from psycopg import Connection

from app.db.postgres import get_connection

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/database")
def database_health_check(connection: Connection = Depends(get_connection)) -> dict[str, str]:
    with connection.cursor() as cursor:
        cursor.execute("select 1")
        cursor.fetchone()

    return {"database": "ok"}
