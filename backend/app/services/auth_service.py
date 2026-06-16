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
    required_fields = ["fullName", "email", "document", "phone"]
    missing_fields = [field for field in required_fields if not str(payload.get(field, "")).strip()]

    if missing_fields:
        raise HTTPException(status_code=422, detail="Preencha nome, e-mail, CPF/RG e telefone.")

    recipients = [
        {
            "email": account.get("email"),
            "name": account.get("displayName"),
            "phone": account.get("phone"),
            "role": account.get("role"),
        }
        for account in repository.list_records("accounts")
        if account.get("role") in {"DEV", "CEO"} and account.get("status") == "ativo"
    ]

    return repository.create_record("accountRequests", {
        **payload,
        "dispatches": [
            {"channel": channel, "recipient": recipient.get("email") if channel == "email" else recipient.get("phone"), "status": "pendente"}
            for recipient in recipients
            for channel in ["email", "whatsapp"]
        ],
        "recipients": recipients,
        "requestedAt": datetime.now(UTC).isoformat(),
        "status": "pendente",
    })
