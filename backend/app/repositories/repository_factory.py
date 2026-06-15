from typing import Protocol

from psycopg import Connection

from app.core.config import get_settings
from app.repositories.record_repository import RecordRepository
from app.repositories.supabase_record_repository import SupabaseRecordRepository


class ErpRecordRepository(Protocol):
    def list_records(self, collection_name: str): ...
    def get_record(self, collection_name: str, record_id: str): ...
    def create_record(self, collection_name: str, payload: dict): ...
    def update_record(self, collection_name: str, record_id: str, payload: dict): ...
    def delete_record(self, collection_name: str, record_id: str): ...
    def set_collection(self, collection_name: str, records: list[dict]): ...


def build_repository(connection: Connection | None = None) -> ErpRecordRepository:
    settings = get_settings()

    if settings.database_url and connection:
        return RecordRepository(connection)

    return SupabaseRecordRepository()
