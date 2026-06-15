from typing import Any
from urllib.parse import quote

import httpx
from fastapi import HTTPException

from app.core.config import get_settings
from app.repositories.record_repository import build_record_id, utc_now_iso


class SupabaseRecordRepository:
    def __init__(self) -> None:
        settings = get_settings()

        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise HTTPException(
                status_code=503,
                detail="Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar Supabase REST.",
            )

        self.base_url = settings.supabase_url.rstrip("/")
        self.headers = {
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "Content-Type": "application/json",
        }

    def _url(self, query: str = "") -> str:
        return f"{self.base_url}/rest/v1/erp_records{query}"

    def _request(self, method: str, query: str = "", **kwargs) -> Any:
        try:
            response = httpx.request(
                method,
                self._url(query),
                headers={**self.headers, **kwargs.pop("headers", {})},
                timeout=20,
                **kwargs,
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as error:
            raise HTTPException(
                status_code=error.response.status_code,
                detail=error.response.text or "Falha ao comunicar com Supabase.",
            ) from error
        except httpx.HTTPError as error:
            raise HTTPException(status_code=503, detail="Supabase indisponivel.") from error

        if not response.text:
            return None

        return response.json()

    def _filter_query(self, collection_name: str, record_id: str = "") -> str:
        query = f"?collection_name=eq.{quote(collection_name, safe='')}"

        if record_id:
            query += f"&record_id=eq.{quote(record_id, safe='')}"

        return query

    def list_records(self, collection_name: str) -> list[dict[str, Any]]:
        rows = self._request(
            "GET",
            f"{self._filter_query(collection_name)}&select=payload&order=updated_at.desc",
        ) or []

        return [row.get("payload", {}) for row in rows]

    def get_record(self, collection_name: str, record_id: str) -> dict[str, Any] | None:
        rows = self._request(
            "GET",
            f"{self._filter_query(collection_name, record_id)}&select=payload&limit=1",
        ) or []

        return rows[0].get("payload", {}) if rows else None

    def create_record(self, collection_name: str, payload: dict[str, Any]) -> dict[str, Any]:
        now = utc_now_iso()
        record = {
            **payload,
            "id": payload.get("id") or build_record_id(collection_name),
            "createdAt": payload.get("createdAt") or now,
            "updatedAt": now,
        }

        self._request(
            "POST",
            json={
                "collection_name": collection_name,
                "record_id": record["id"],
                "payload": record,
            },
            headers={"Prefer": "return=minimal"},
        )

        return record

    def update_record(self, collection_name: str, record_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        existing_record = self.get_record(collection_name, record_id)

        if not existing_record:
            return None

        updated_record = {
            **existing_record,
            **payload,
            "id": record_id,
            "updatedAt": utc_now_iso(),
        }

        self._request(
            "PATCH",
            self._filter_query(collection_name, record_id),
            json={
                "payload": updated_record,
                "updated_at": utc_now_iso(),
            },
            headers={"Prefer": "return=minimal"},
        )

        return updated_record

    def delete_record(self, collection_name: str, record_id: str) -> dict[str, Any] | None:
        existing_record = self.get_record(collection_name, record_id)

        if not existing_record:
            return None

        self._request(
            "DELETE",
            self._filter_query(collection_name, record_id),
            headers={"Prefer": "return=minimal"},
        )

        return existing_record

    def set_collection(self, collection_name: str, records: list[dict[str, Any]]) -> list[dict[str, Any]]:
        now = utc_now_iso()
        normalized_records = [
            {
                **record,
                "id": record.get("id") or build_record_id(collection_name),
                "createdAt": record.get("createdAt") or now,
                "updatedAt": record.get("updatedAt") or now,
            }
            for record in records
        ]

        self._request(
            "DELETE",
            self._filter_query(collection_name),
            headers={"Prefer": "return=minimal"},
        )

        if normalized_records:
            self._request(
                "POST",
                json=[
                    {
                        "collection_name": collection_name,
                        "record_id": record["id"],
                        "payload": record,
                    }
                    for record in normalized_records
                ],
                headers={"Prefer": "return=minimal"},
            )

        return normalized_records
