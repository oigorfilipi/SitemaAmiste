from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_current_account, get_repository
from app.core.permissions import can_access_page, can_perform_action, get_collection_page
from app.core.security import hash_password, sanitize_account
from app.services.collection_service import CollectionService, ensure_collection_name

router = APIRouter(tags=["collections"])


def get_service(repository = Depends(get_repository)) -> CollectionService:
    return CollectionService(repository)


def require_collection_access(account: dict, collection_name: str, action: str = "") -> None:
    page_id = get_collection_page(collection_name)
    role = account.get("role") or "VEN"

    if not can_access_page(role, page_id):
        raise HTTPException(status_code=403, detail="Voce nao tem acesso a este modulo.")

    if action and not can_perform_action(role, action):
        raise HTTPException(status_code=403, detail="Voce nao tem permissao para esta acao.")


def normalize_account_payload_for_storage(payload: dict[str, Any], current_account: dict, existing_account: dict[str, Any] | None = None) -> dict[str, Any]:
    existing_role = existing_account.get("role") if existing_account else ""
    target_role = payload.get("role") or existing_role

    if (target_role == "DEV" or existing_role == "DEV") and current_account.get("role") != "DEV":
        raise HTTPException(status_code=403, detail="Somente DEV pode criar ou alterar contas DEV.")

    next_payload = dict(payload)
    provisional_password = next_payload.get("temporaryPassword") or next_payload.get("password")

    if provisional_password:
        next_payload["passwordHash"] = hash_password(str(provisional_password))
        next_payload["password"] = ""
        next_payload["temporaryPassword"] = ""
        next_payload["mustChangePassword"] = True

    return next_payload


def serialize_record(collection_name: str, record: dict[str, Any] | None):
    if collection_name == "accounts":
        return sanitize_account(record)

    return record


@router.get("/collections")
def list_collections(
    account: dict = Depends(get_current_account),
    service: CollectionService = Depends(get_service),
) -> dict[str, list[str]]:
    return {"collections": service.list_collection_names()}


@router.get("/snapshot")
def get_snapshot(
    account: dict = Depends(get_current_account),
    service: CollectionService = Depends(get_service),
) -> dict[str, list[dict[str, Any]]]:
    return service.build_snapshot()


@router.put("/snapshot")
def replace_snapshot(
    database: dict[str, Any],
    account: dict = Depends(get_current_account),
    service: CollectionService = Depends(get_service),
) -> dict[str, list[dict[str, Any]]]:
    if account.get("role") != "DEV":
        raise HTTPException(status_code=403, detail="Somente DEV pode restaurar snapshot completo.")

    return service.replace_snapshot(database)


@router.get("/collections/{collection_name}")
def list_records(
    collection_name: str,
    account: dict = Depends(get_current_account),
    service: CollectionService = Depends(get_service),
) -> list[dict[str, Any]]:
    collection_name = ensure_collection_name(collection_name)
    require_collection_access(account, collection_name)
    records = service.repository.list_records(collection_name)

    if collection_name == "accounts":
        return [sanitize_account(record) for record in records]

    return records


@router.put("/collections/{collection_name}")
def set_collection(
    collection_name: str,
    records: list[dict[str, Any]],
    account: dict = Depends(get_current_account),
    service: CollectionService = Depends(get_service),
) -> list[dict[str, Any]]:
    collection_name = ensure_collection_name(collection_name)
    require_collection_access(account, collection_name, "action:update")
    if collection_name == "accounts":
        records = [normalize_account_payload_for_storage(record, account) for record in records]

    return service.repository.set_collection(collection_name, records)


@router.post("/collections/{collection_name}", status_code=status.HTTP_201_CREATED)
def create_record(
    collection_name: str,
    payload: dict[str, Any],
    account: dict = Depends(get_current_account),
    service: CollectionService = Depends(get_service),
) -> dict[str, Any]:
    collection_name = ensure_collection_name(collection_name)
    require_collection_access(account, collection_name, "action:create")
    if collection_name == "accounts":
        payload = normalize_account_payload_for_storage(payload, account)

    return serialize_record(collection_name, service.repository.create_record(collection_name, payload))


@router.put("/collections/{collection_name}/{record_id}")
def update_record(
    collection_name: str,
    record_id: str,
    payload: dict[str, Any],
    account: dict = Depends(get_current_account),
    service: CollectionService = Depends(get_service),
) -> dict[str, Any]:
    collection_name = ensure_collection_name(collection_name)
    require_collection_access(account, collection_name, "action:update")
    if collection_name == "accounts":
        existing_record = service.repository.get_record(collection_name, record_id)
        payload = normalize_account_payload_for_storage(payload, account, existing_record)

    updated_record = service.repository.update_record(collection_name, record_id, payload)

    if not updated_record:
        raise HTTPException(status_code=404, detail="Registro nao encontrado.")

    return serialize_record(collection_name, updated_record)


@router.delete("/collections/{collection_name}/{record_id}")
def delete_record(
    collection_name: str,
    record_id: str,
    account: dict = Depends(get_current_account),
    service: CollectionService = Depends(get_service),
) -> dict[str, Any]:
    collection_name = ensure_collection_name(collection_name)
    require_collection_access(account, collection_name, "action:delete")
    deleted_record = service.repository.delete_record(collection_name, record_id)

    if not deleted_record:
        raise HTTPException(status_code=404, detail="Registro nao encontrado.")

    return serialize_record(collection_name, deleted_record)
