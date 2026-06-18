from typing import Any
from datetime import UTC, datetime
from secrets import token_hex

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_operational_account, get_repository
from app.core.permissions import can_access_page, can_perform_action, get_collection_page
from app.core.security import hash_password, sanitize_account, validate_password_strength
from app.services.auth_service import get_admin_password
from app.services.collection_service import CollectionService, ensure_collection_name

router = APIRouter(tags=["collections"])

COLLECTION_LABELS = {
    "accounts": "Contas",
    "accountRequests": "Solicitacoes",
    "systemSettings": "Configuracoes de Seguranca",
    "inventoryCounts": "Historico de Contagem",
    "inventoryLocations": "Estoques Separados",
    "machineConfigs": "Configuracoes de Maquina",
    "machines": "Maquinas",
    "recipes": "Receitas",
    "supplies": "Insumos",
    "accessories": "Acessorios",
    "clients": "Clientes",
    "checklists": "Checklists",
    "repairOrders": "Ordens de Servico",
    "proposals": "Portfolios",
    "serviceSheets": "Fichas Operacionais",
    "sales": "Vendas",
    "receivables": "Contas a Receber",
    "payables": "Contas a Pagar",
    "labels": "Etiquetas",
    "options": "Adicionar Opcoes",
    "wikiSolutions": "Wiki",
    "history": "Historico",
    "system": "Sistema",
}

AUDIT_IGNORED_FIELDS = {
    "createdAt",
    "fileDataUrl",
    "imageDataUrl",
    "password",
    "passwordHash",
    "photoDataUrl",
    "profilePhotoDataUrl",
    "profilePhotoUrl",
    "temporaryPassword",
    "updatedAt",
    "value",
}

CRITICAL_ACCOUNT_ROLES = {"DEV", "DON", "CEO"}
ACCOUNT_MANAGER_ROLES = {"DEV", "DON", "CEO"}


def get_service(repository = Depends(get_repository)) -> CollectionService:
    return CollectionService(repository)


def require_collection_access(account: dict, collection_name: str, action: str = "") -> None:
    page_id = get_collection_page(collection_name)
    role = account.get("role") or "VEN"

    if not can_access_page(role, page_id):
        raise HTTPException(status_code=403, detail="Voce nao tem acesso a este modulo.")

    if action and not can_perform_action(role, action):
        raise HTTPException(status_code=403, detail="Voce nao tem permissao para esta acao.")


def is_request_manager(account: dict) -> bool:
    return account.get("role") in {"DEV", "CEO", "DON"}


def request_visible_to_account(request: dict[str, Any], account: dict) -> bool:
    return is_request_manager(account) or request.get("isGeneral") or request.get("requesterId") == account.get("id")


def normalize_request_payload_for_storage(payload: dict[str, Any], account: dict, existing_request: dict[str, Any] | None = None) -> dict[str, Any]:
    next_payload = dict(payload)

    if is_request_manager(account):
        return next_payload

    if existing_request and not request_visible_to_account(existing_request, account):
        raise HTTPException(status_code=403, detail="Voce nao tem acesso a esta solicitacao.")

    protected_fields = {
        "assigneeId",
        "assigneeName",
        "assigneeRole",
        "attendedAt",
        "closedAt",
        "completedAt",
        "giveUpAt",
        "rejectionReason",
        "status",
        "transferReason",
        "transferredAt",
        "unresolvedAt",
    }

    for field_name in protected_fields:
        if existing_request and field_name in existing_request:
            next_payload[field_name] = existing_request.get(field_name)
        else:
            next_payload.pop(field_name, None)

    if not existing_request:
        next_payload["requesterId"] = account.get("id") or ""
        next_payload["requesterName"] = account.get("displayName") or account.get("fullName") or "Usuario"
        next_payload["status"] = "pendente"

    return next_payload


def normalize_account_payload_for_storage(
    payload: dict[str, Any],
    current_account: dict,
    existing_account: dict[str, Any] | None = None,
    repository = None,
) -> dict[str, Any]:
    existing_role = existing_account.get("role") if existing_account else ""
    target_role = payload.get("role") or existing_role

    if (target_role in CRITICAL_ACCOUNT_ROLES or existing_role in CRITICAL_ACCOUNT_ROLES) and current_account.get("role") not in ACCOUNT_MANAGER_ROLES:
        raise HTTPException(status_code=403, detail="Somente DONO e DEV podem criar ou alterar contas criticas.")

    requires_admin_password = target_role in CRITICAL_ACCOUNT_ROLES and (
        not existing_account or existing_role != target_role
    )

    if requires_admin_password:
        if not repository:
            raise HTTPException(status_code=403, detail="Senha ADM obrigatoria para cargos criticos.")

        if str(payload.get("adminPasswordConfirmation", "")).strip() != get_admin_password(repository):
            raise HTTPException(status_code=403, detail="Senha ADM invalida para cargo critico.")

    next_payload = dict(payload)
    next_payload.pop("adminPasswordConfirmation", None)
    provisional_password = next_payload.get("temporaryPassword") or next_payload.get("password")

    if not existing_account and not provisional_password:
        raise HTTPException(status_code=422, detail="Informe uma senha provisoria para o primeiro acesso.")

    if provisional_password:
        validate_password_strength(str(provisional_password))
        next_payload["passwordHash"] = hash_password(str(provisional_password))
        next_payload["password"] = ""
        next_payload["temporaryPassword"] = ""
        next_payload["mustChangePassword"] = True

    return next_payload


def serialize_record(collection_name: str, record: dict[str, Any] | None):
    if collection_name == "accounts":
        return sanitize_account(record)

    if collection_name == "systemSettings" and record:
        if record.get("key") == "adminPassword":
            return {**record, "value": ""}

    return record


def build_history_id() -> str:
    return f"history_{int(datetime.now(UTC).timestamp() * 1000)}_{token_hex(3)}"


def summarize_value(value: Any) -> str:
    if value is None or value == "":
        return "-"

    if isinstance(value, bool):
        return "Sim" if value else "Nao"

    if isinstance(value, list):
        return f"{len(value)} item(ns)"

    if isinstance(value, dict):
        return f"{len(value.keys())} campo(s)"

    text = str(value)
    return f"{text[:87]}..." if len(text) > 90 else text


def resolve_record_title(record: dict[str, Any] | None, fallback: str = "-") -> str:
    if not record:
        return fallback

    return str(
        record.get("name") or
        record.get("code") or
        record.get("description") or
        record.get("origin") or
        record.get("id") or
        fallback
    )


def build_change_details(previous_record: dict[str, Any] | None, next_record: dict[str, Any] | None) -> str:
    previous_record = previous_record or {}
    next_record = next_record or {}
    field_names = sorted(set(previous_record.keys()) | set(next_record.keys()))
    changes = [
        f"{field_name}: {summarize_value(previous_record.get(field_name))} -> {summarize_value(next_record.get(field_name))}"
        for field_name in field_names
        if field_name not in AUDIT_IGNORED_FIELDS and previous_record.get(field_name) != next_record.get(field_name)
    ]

    return "\n".join(changes[:12]) if changes else "Registro salvo sem alteracoes relevantes nos campos auditaveis."


def add_history_entry(repository, account: dict, collection_name: str, action: str, title: str, details: str = "") -> None:
    if collection_name == "history":
        return

    repository.create_record("history", {
        "action": action,
        "date": datetime.now(UTC).isoformat(),
        "details": details,
        "id": build_history_id(),
        "module": COLLECTION_LABELS.get(collection_name, collection_name),
        "role": account.get("role") or "SYS",
        "title": title,
        "userId": account.get("id") or "",
        "userName": account.get("displayName") or account.get("fullName") or "Sistema",
    })


@router.get("/collections")
def list_collections(
    account: dict = Depends(get_operational_account),
    service: CollectionService = Depends(get_service),
) -> dict[str, list[str]]:
    return {"collections": service.list_collection_names()}


@router.get("/snapshot")
def get_snapshot(
    account: dict = Depends(get_operational_account),
    service: CollectionService = Depends(get_service),
) -> dict[str, list[dict[str, Any]]]:
    return service.build_snapshot()


@router.get("/backup")
def get_backup(
    account: dict = Depends(get_operational_account),
    service: CollectionService = Depends(get_service),
) -> dict[str, list[dict[str, Any]]]:
    if account.get("role") != "DEV":
        raise HTTPException(status_code=403, detail="Somente DEV pode gerar backup completo.")

    add_history_entry(
        service.repository,
        account,
        "system",
        "Backup",
        "Snapshot completo",
        "Backup completo gerado por DEV.",
    )
    return service.build_snapshot(include_sensitive_accounts=True)


@router.put("/snapshot")
def replace_snapshot(
    database: dict[str, Any],
    account: dict = Depends(get_operational_account),
    service: CollectionService = Depends(get_service),
) -> dict[str, list[dict[str, Any]]]:
    if account.get("role") != "DEV":
        raise HTTPException(status_code=403, detail="Somente DEV pode restaurar snapshot completo.")

    restored_snapshot = service.replace_snapshot(database)
    add_history_entry(
        service.repository,
        account,
        "system",
        "Restaurou",
        "Snapshot completo",
        "Backup restaurado por DEV.",
    )

    return restored_snapshot


@router.get("/collections/{collection_name}")
def list_records(
    collection_name: str,
    account: dict = Depends(get_operational_account),
    service: CollectionService = Depends(get_service),
) -> list[dict[str, Any]]:
    collection_name = ensure_collection_name(collection_name)
    require_collection_access(account, collection_name)
    records = service.repository.list_records(collection_name)

    if collection_name == "accounts":
        return [sanitize_account(record) for record in records]

    if collection_name == "accountRequests":
        return [record for record in records if request_visible_to_account(record, account)]

    if collection_name == "systemSettings":
        return [serialize_record(collection_name, record) for record in records]

    return records


@router.put("/collections/{collection_name}")
def set_collection(
    collection_name: str,
    records: list[dict[str, Any]],
    account: dict = Depends(get_operational_account),
    service: CollectionService = Depends(get_service),
) -> list[dict[str, Any]]:
    collection_name = ensure_collection_name(collection_name)
    require_collection_access(account, collection_name, "action:update")
    if collection_name == "accounts":
        records = [normalize_account_payload_for_storage(record, account, repository=service.repository) for record in records]

    updated_records = service.repository.set_collection(collection_name, records)
    add_history_entry(
        service.repository,
        account,
        collection_name,
        "Atualizou",
        f"Colecao {COLLECTION_LABELS.get(collection_name, collection_name)}",
        f"{len(updated_records)} registro(s) substituido(s).",
    )

    if collection_name == "accounts":
        return [sanitize_account(record) for record in updated_records]

    if collection_name == "systemSettings":
        return [serialize_record(collection_name, record) for record in updated_records]

    return updated_records


@router.post("/collections/{collection_name}", status_code=status.HTTP_201_CREATED)
def create_record(
    collection_name: str,
    payload: dict[str, Any],
    account: dict = Depends(get_operational_account),
    service: CollectionService = Depends(get_service),
) -> dict[str, Any]:
    collection_name = ensure_collection_name(collection_name)
    require_collection_access(account, collection_name, "action:create")
    if collection_name == "accounts":
        payload = normalize_account_payload_for_storage(payload, account, repository=service.repository)
    if collection_name == "accountRequests":
        payload = normalize_request_payload_for_storage(payload, account)

    created_record = service.repository.create_record(collection_name, payload)
    add_history_entry(
        service.repository,
        account,
        collection_name,
        "Criou",
        resolve_record_title(created_record),
        f"Registro criado. ID: {created_record.get('id', '-')}",
    )

    return serialize_record(collection_name, created_record)


@router.put("/collections/{collection_name}/{record_id}")
def update_record(
    collection_name: str,
    record_id: str,
    payload: dict[str, Any],
    account: dict = Depends(get_operational_account),
    service: CollectionService = Depends(get_service),
) -> dict[str, Any]:
    collection_name = ensure_collection_name(collection_name)
    require_collection_access(account, collection_name, "action:update")
    if collection_name == "accounts":
        existing_record = service.repository.get_record(collection_name, record_id)
        payload = normalize_account_payload_for_storage(payload, account, existing_record, service.repository)
    elif collection_name == "accountRequests":
        existing_record = service.repository.get_record(collection_name, record_id)
        payload = normalize_request_payload_for_storage(payload, account, existing_record)
    else:
        existing_record = service.repository.get_record(collection_name, record_id)

    updated_record = service.repository.update_record(collection_name, record_id, payload)

    if not updated_record:
        raise HTTPException(status_code=404, detail="Registro nao encontrado.")

    add_history_entry(
        service.repository,
        account,
        collection_name,
        "Editou",
        resolve_record_title(updated_record, record_id),
        build_change_details(existing_record, updated_record),
    )

    return serialize_record(collection_name, updated_record)


@router.delete("/collections/{collection_name}/{record_id}")
def delete_record(
    collection_name: str,
    record_id: str,
    account: dict = Depends(get_operational_account),
    service: CollectionService = Depends(get_service),
) -> dict[str, Any]:
    collection_name = ensure_collection_name(collection_name)
    require_collection_access(account, collection_name, "action:delete")

    if collection_name == "accountRequests" and not is_request_manager(account):
        raise HTTPException(status_code=403, detail="Somente DONO e DEV podem excluir solicitacoes.")

    deleted_record = service.repository.delete_record(collection_name, record_id)

    if not deleted_record:
        raise HTTPException(status_code=404, detail="Registro nao encontrado.")

    add_history_entry(
        service.repository,
        account,
        collection_name,
        "Excluiu",
        resolve_record_title(deleted_record, record_id),
        f"Registro excluido. ID: {deleted_record.get('id', record_id)}",
    )

    return serialize_record(collection_name, deleted_record)
