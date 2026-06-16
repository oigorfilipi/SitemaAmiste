from datetime import UTC, datetime
from pathlib import PurePosixPath
from re import sub
from secrets import token_hex
from typing import Any

import httpx
from fastapi import HTTPException, UploadFile

from app.core.config import get_settings

DEFAULT_BUCKET = "amiste-files"
MAX_UPLOAD_BYTES = 25 * 1024 * 1024


def _headers(content_type: str = "application/json") -> dict[str, str]:
    settings = get_settings()

    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(status_code=503, detail="Supabase Storage nao configurado.")

    return {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": content_type,
    }


def _storage_url(path: str) -> str:
    settings = get_settings()
    return f"{settings.supabase_url.rstrip('/')}/storage/v1{path}"


def sanitize_filename(filename: str) -> str:
    safe_name = sub(r"[^a-zA-Z0-9._-]+", "-", filename or "arquivo").strip("-").lower()
    return safe_name or "arquivo"


def build_storage_path(folder: str, user_id: str, filename: str) -> str:
    safe_folder = sub(r"[^a-zA-Z0-9_-]+", "-", folder or "uploads").strip("-").lower() or "uploads"
    safe_user = sub(r"[^a-zA-Z0-9_-]+", "-", user_id or "system").strip("-").lower() or "system"
    timestamp = datetime.now(UTC).strftime("%Y%m%d%H%M%S")
    return str(PurePosixPath(safe_folder, safe_user, f"{timestamp}_{token_hex(4)}_{sanitize_filename(filename)}"))


def ensure_bucket(bucket: str = DEFAULT_BUCKET) -> None:
    response = httpx.post(
        _storage_url("/bucket"),
        headers=_headers(),
        json={"id": bucket, "name": bucket, "public": False},
        timeout=20,
    )

    if response.status_code in {200, 201, 409}:
        return

    if response.status_code == 400 and "already" in response.text.lower():
        return

    raise HTTPException(status_code=response.status_code, detail=response.text or "Falha ao preparar bucket.")


async def upload_file_to_storage(file: UploadFile, folder: str, user_id: str) -> dict[str, Any]:
    ensure_bucket()
    contents = await file.read()

    if not contents:
        raise HTTPException(status_code=422, detail="Arquivo vazio.")

    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Arquivo muito grande. Limite atual: 25 MB.")

    storage_path = build_storage_path(folder, user_id, file.filename or "arquivo")
    response = httpx.post(
        _storage_url(f"/object/{DEFAULT_BUCKET}/{storage_path}"),
        content=contents,
        headers={
            **_headers(file.content_type or "application/octet-stream"),
            "x-upsert": "true",
        },
        timeout=60,
    )

    if response.status_code not in {200, 201}:
        raise HTTPException(status_code=response.status_code, detail=response.text or "Falha ao enviar arquivo.")

    return {
        "bucket": DEFAULT_BUCKET,
        "contentType": file.content_type or "application/octet-stream",
        "fileName": file.filename or storage_path.split("/")[-1],
        "size": len(contents),
        "storageKey": storage_path,
        "storageProvider": "supabase",
    }


def create_signed_file_url(storage_key: str, expires_in: int = 3600) -> dict[str, Any]:
    if not storage_key:
        raise HTTPException(status_code=422, detail="Informe a chave do arquivo.")

    response = httpx.post(
        _storage_url(f"/object/sign/{DEFAULT_BUCKET}/{storage_key}"),
        headers=_headers(),
        json={"expiresIn": expires_in},
        timeout=20,
    )

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text or "Falha ao gerar URL segura.")

    payload = response.json()
    signed_url = payload.get("signedURL") or payload.get("signedUrl") or ""

    if signed_url.startswith("/"):
        signed_url = f"{get_settings().supabase_url.rstrip('/')}/storage/v1{signed_url}"

    return {
        "expiresIn": expires_in,
        "url": signed_url,
    }


def delete_file_from_storage(storage_key: str) -> dict[str, Any]:
    if not storage_key:
        return {"deleted": False}

    response = httpx.request(
        "DELETE",
        _storage_url(f"/object/{DEFAULT_BUCKET}"),
        headers=_headers(),
        json={"prefixes": [storage_key]},
        timeout=20,
    )

    if response.status_code not in {200, 204}:
        raise HTTPException(status_code=response.status_code, detail=response.text or "Falha ao excluir arquivo.")

    return {"deleted": True}
