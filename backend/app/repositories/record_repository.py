from datetime import UTC, datetime
from secrets import token_hex
from typing import Any

from psycopg import Connection
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb


def utc_now_iso() -> str:
    return datetime.now(UTC).isoformat()


def build_record_id(collection_name: str) -> str:
    timestamp = int(datetime.now(UTC).timestamp() * 1000)
    return f"{collection_name}_{timestamp}_{token_hex(3)}"


class RecordRepository:
    def __init__(self, connection: Connection):
        self.connection = connection

    def list_records(self, collection_name: str) -> list[dict[str, Any]]:
        with self.connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                select payload
                from public.erp_records
                where collection_name = %s
                order by updated_at desc
                """,
                (collection_name,),
            )

            return [row["payload"] for row in cursor.fetchall()]

    def get_record(self, collection_name: str, record_id: str) -> dict[str, Any] | None:
        with self.connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                select payload
                from public.erp_records
                where collection_name = %s and record_id = %s
                """,
                (collection_name, record_id),
            )
            row = cursor.fetchone()

            return row["payload"] if row else None

    def create_record(self, collection_name: str, payload: dict[str, Any]) -> dict[str, Any]:
        now = utc_now_iso()
        record = {
            **payload,
            "id": payload.get("id") or build_record_id(collection_name),
            "createdAt": payload.get("createdAt") or now,
            "updatedAt": now,
        }

        with self.connection.cursor() as cursor:
            cursor.execute(
                """
                insert into public.erp_records (collection_name, record_id, payload)
                values (%s, %s, %s)
                """,
                (collection_name, record["id"], Jsonb(record)),
            )

        self.connection.commit()
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

        with self.connection.cursor() as cursor:
            cursor.execute(
                """
                update public.erp_records
                set payload = %s, updated_at = now()
                where collection_name = %s and record_id = %s
                """,
                (Jsonb(updated_record), collection_name, record_id),
            )

        self.connection.commit()
        return updated_record

    def delete_record(self, collection_name: str, record_id: str) -> dict[str, Any] | None:
        existing_record = self.get_record(collection_name, record_id)

        if not existing_record:
            return None

        with self.connection.cursor() as cursor:
            cursor.execute(
                """
                delete from public.erp_records
                where collection_name = %s and record_id = %s
                """,
                (collection_name, record_id),
            )

        self.connection.commit()
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

        with self.connection.cursor() as cursor:
            cursor.execute("delete from public.erp_records where collection_name = %s", (collection_name,))

            for record in normalized_records:
                cursor.execute(
                    """
                    insert into public.erp_records (collection_name, record_id, payload)
                    values (%s, %s, %s)
                    """,
                    (collection_name, record["id"], Jsonb(record)),
                )

        self.connection.commit()
        return normalized_records
