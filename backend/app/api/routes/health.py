import httpx
from fastapi import APIRouter, Depends, HTTPException
from psycopg import Connection

from app.core.config import get_settings
from app.db.postgres import get_optional_connection

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/database")
def database_health_check(connection: Connection | None = Depends(get_optional_connection)) -> dict[str, str]:
    settings = get_settings()

    if connection:
        with connection.cursor() as cursor:
            cursor.execute("select 1")
            cursor.fetchone()

        return {"database": "ok", "provider": "postgres"}

    if settings.supabase_url and settings.supabase_service_role_key:
        response = httpx.get(
            f"{settings.supabase_url.rstrip('/')}/rest/v1/erp_records?select=record_id&limit=1",
            headers={
                "apikey": settings.supabase_service_role_key,
                "Authorization": f"Bearer {settings.supabase_service_role_key}",
            },
            timeout=20,
        )
        response.raise_for_status()

        return {"database": "ok", "provider": "supabase-rest"}

    raise HTTPException(status_code=503, detail="Nenhuma fonte de banco configurada.")
