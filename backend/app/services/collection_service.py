from typing import Any

from fastapi import HTTPException

from app.core.config import COLLECTION_NAMES, get_settings
from app.core.security import sanitize_account
from app.repositories.record_repository import RecordRepository


def ensure_collection_name(collection_name: str) -> str:
    settings = get_settings()

    if collection_name in COLLECTION_NAMES or settings.allow_unknown_collections:
        return collection_name

    raise HTTPException(status_code=404, detail=f"Colecao desconhecida: {collection_name}")


class CollectionService:
    def __init__(self, repository: RecordRepository):
        self.repository = repository

    def list_collection_names(self) -> list[str]:
        return COLLECTION_NAMES

    def build_snapshot(self, include_sensitive_accounts: bool = False) -> dict[str, list[dict[str, Any]]]:
        snapshot = {
            collection_name: self.repository.list_records(collection_name)
            for collection_name in COLLECTION_NAMES
        }

        if not include_sensitive_accounts:
            snapshot["accounts"] = [sanitize_account(account) for account in snapshot.get("accounts", [])]

        return snapshot

    def replace_snapshot(self, database: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
        # --- SECAO: RESTAURACAO CONTROLADA ---
        for collection_name in COLLECTION_NAMES:
            records = database.get(collection_name, [])

            if not isinstance(records, list):
                raise HTTPException(
                    status_code=422,
                    detail=f"Colecao {collection_name} precisa ser uma lista.",
                )

            self.repository.set_collection(collection_name, records)

        return self.build_snapshot()
