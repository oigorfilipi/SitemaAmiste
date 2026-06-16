from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status

from app.core.security import create_access_token, hash_password, sanitize_account, validate_password_strength, verify_password
from app.repositories.repository_factory import ErpRecordRepository

LOCAL_DEFAULT_PASSWORD = "1234"


def _normalize_email(value: str) -> str:
    return str(value or "").strip().lower()


def _build_access_history(account: dict[str, Any], label: str) -> list[dict[str, str]]:
    history = account.get("accessHistory") if isinstance(account.get("accessHistory"), list) else []

    return [{"at": datetime.now(UTC).isoformat(), "label": label}, *history][:20]


def _find_active_account_by_email(repository: ErpRecordRepository, email: str) -> dict[str, Any] | None:
    normalized_email = _normalize_email(email)

    return next(
        (
            account for account in repository.list_records("accounts")
            if account.get("status") == "ativo" and _normalize_email(account.get("email", "")) == normalized_email
        ),
        None,
    )


def _legacy_password_matches(account: dict[str, Any], password: str) -> bool:
    candidates = [
        account.get("password"),
        account.get("temporaryPassword"),
        LOCAL_DEFAULT_PASSWORD if not account.get("password") and not account.get("temporaryPassword") else "",
    ]

    return any(str(candidate or "") == str(password or "") for candidate in candidates)


def _password_matches(account: dict[str, Any], password: str) -> tuple[bool, bool]:
    password_hash = account.get("passwordHash")

    if password_hash and verify_password(password, password_hash):
        return True, False

    legacy_match = _legacy_password_matches(account, password)
    return legacy_match, legacy_match


def login(repository: ErpRecordRepository, email: str, password: str) -> dict[str, Any]:
    account = _find_active_account_by_email(repository, email)

    if not account:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-mail ou senha invalidos.")

    password_matches, used_legacy_password = _password_matches(account, password)

    if not password_matches:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-mail ou senha invalidos.")

    now = datetime.now(UTC).isoformat()
    updated_account = repository.update_record("accounts", account["id"], {
        "accessHistory": _build_access_history(account, "Login corporativo"),
        "activeSessions": [
            {"createdAt": now, "device": "Navegador web", "id": f"session_{int(datetime.now(UTC).timestamp() * 1000)}"},
            *(account.get("activeSessions") or []),
        ][:5],
        "lastLogin": now,
        "passwordHash": account.get("passwordHash") or hash_password(password),
        "mustChangePassword": bool(account.get("mustChangePassword") or used_legacy_password),
    }) or account

    return {
        "token": create_access_token(updated_account),
        "user": sanitize_account(updated_account),
    }


def complete_first_login(repository: ErpRecordRepository, account: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    if not str(payload.get("password", "")).strip():
        raise HTTPException(status_code=422, detail="Informe a nova senha.")

    validate_password_strength(payload["password"])

    if not str(payload.get("displayName", "")).strip():
        raise HTTPException(status_code=422, detail="Informe o nome de exibicao.")

    if not payload.get("profilePhotoDataUrl") and not payload.get("profilePhotoUrl"):
        raise HTTPException(status_code=422, detail="Adicione uma foto de perfil para continuar.")

    updated_account = repository.update_record("accounts", account["id"], {
        "accessHistory": _build_access_history(account, "Primeiro acesso concluido"),
        "displayName": payload["displayName"].strip(),
        "firstLoginCompletedAt": datetime.now(UTC).isoformat(),
        "fullName": account.get("fullName") or payload["displayName"].strip(),
        "mustChangePassword": False,
        "password": "",
        "passwordHash": hash_password(payload["password"]),
        "profilePhotoDataUrl": payload.get("profilePhotoDataUrl") or account.get("profilePhotoDataUrl") or "",
        "profilePhotoUrl": payload.get("profilePhotoUrl") or account.get("profilePhotoUrl") or "",
        "temporaryPassword": "",
    })

    return {
        "token": create_access_token(updated_account),
        "user": sanitize_account(updated_account),
    }


def request_account_access(repository: ErpRecordRepository, payload: dict[str, Any]) -> dict[str, Any]:
    device_key = str(payload.get("deviceKey", "")).strip()
    similar_request = next(
        (
            request for request in repository.list_records("accountRequests")
            if request.get("requestType") == "accountCreation"
            and request.get("deviceKey")
            and request.get("deviceKey") == device_key
            and request.get("status") in {"pendente", "reativado", "atendendo", "analise", "aguardando-resposta"}
        ),
        None,
    )
    now = datetime.now(UTC).isoformat()

    if similar_request:
        occurrence_count = int(similar_request.get("occurrenceCount") or 1) + 1
        events = similar_request.get("events") if isinstance(similar_request.get("events"), list) else []
        return repository.update_record("accountRequests", similar_request["id"], {
            "events": [
                {
                    "action": "Reenviou",
                    "at": now,
                    "details": "Pedido de conta reenviado pela tela de login.",
                    "role": "PUBLICO",
                    "userId": "",
                    "userName": payload.get("fullName") or "Novo Usuario",
                },
                *events,
            ],
            "occurrenceCount": occurrence_count,
            "requestedAt": similar_request.get("requestedAt") or now,
            "status": "reativado" if similar_request.get("status") == "encerrado" else similar_request.get("status", "pendente"),
            "updatedAt": now,
        }) or similar_request

    return repository.create_record("accountRequests", {
        "category": "Conta",
        "description": payload.get("description") or "Necessitando de criacao de CONTA.",
        "deviceKey": device_key,
        "events": [{
            "action": "Criou",
            "at": now,
            "details": "Pedido de conta aberto pela tela de login.",
            "role": "PUBLICO",
            "userId": "",
            "userName": payload.get("fullName") or "Novo Usuario",
        }],
        "isGeneral": False,
        "occurrenceCount": 1,
        "pageId": "accounts",
        "priority": "Media",
        "problemType": "Criacao de Conta",
        "requestType": "accountCreation",
        "requestedAt": now,
        "requesterId": "",
        "requesterName": payload.get("fullName") or "Novo Usuario",
        "status": "pendente",
        "title": "Criacao de Conta",
    })
