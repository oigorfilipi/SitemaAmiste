from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from psycopg import Connection

from app.db.postgres import get_connection
from app.repositories.record_repository import RecordRepository
from app.services.collection_service import CollectionService, ensure_collection_name

router = APIRouter(tags=["collections"])


def get_service(connection: Connection = Depends(get_connection)) -> CollectionService:
    return CollectionService(RecordRepository(connection))


@router.get("/collections")
def list_collections(service: CollectionService = Depends(get_service)) -> dict[str, list[str]]:
    return {"collections": service.list_collection_names()}


@router.get("/snapshot")
def get_snapshot(service: CollectionService = Depends(get_service)) -> dict[str, list[dict[str, Any]]]:
    return service.build_snapshot()


@router.put("/snapshot")
def replace_snapshot(
    database: dict[str, Any],
    service: CollectionService = Depends(get_service),
) -> dict[str, list[dict[str, Any]]]:
    return service.replace_snapshot(database)


@router.get("/collections/{collection_name}")
def list_records(
    collection_name: str,
    service: CollectionService = Depends(get_service),
) -> list[dict[str, Any]]:
    collection_name = ensure_collection_name(collection_name)
    return service.repository.list_records(collection_name)


@router.put("/collections/{collection_name}")
def set_collection(
    collection_name: str,
    records: list[dict[str, Any]],
    service: CollectionService = Depends(get_service),
) -> list[dict[str, Any]]:
    collection_name = ensure_collection_name(collection_name)
    return service.repository.set_collection(collection_name, records)


@router.post("/collections/{collection_name}", status_code=status.HTTP_201_CREATED)
def create_record(
    collection_name: str,
    payload: dict[str, Any],
    service: CollectionService = Depends(get_service),
) -> dict[str, Any]:
    collection_name = ensure_collection_name(collection_name)
    return service.repository.create_record(collection_name, payload)


@router.put("/collections/{collection_name}/{record_id}")
def update_record(
    collection_name: str,
    record_id: str,
    payload: dict[str, Any],
    service: CollectionService = Depends(get_service),
) -> dict[str, Any]:
    collection_name = ensure_collection_name(collection_name)
    updated_record = service.repository.update_record(collection_name, record_id, payload)

    if not updated_record:
        raise HTTPException(status_code=404, detail="Registro nao encontrado.")

    return updated_record


@router.delete("/collections/{collection_name}/{record_id}")
def delete_record(
    collection_name: str,
    record_id: str,
    service: CollectionService = Depends(get_service),
) -> dict[str, Any]:
    collection_name = ensure_collection_name(collection_name)
    deleted_record = service.repository.delete_record(collection_name, record_id)

    if not deleted_record:
        raise HTTPException(status_code=404, detail="Registro nao encontrado.")

    return deleted_record
