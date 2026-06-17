from typing import Any

from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_account, get_repository
from app.core.security import sanitize_account
from app.repositories.repository_factory import ErpRecordRepository
from app.services.auth_service import change_password, complete_first_login, login, request_account_access

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login_route(
    credentials: dict[str, str],
    repository: ErpRecordRepository = Depends(get_repository),
) -> dict[str, Any]:
    return login(repository, credentials.get("email", ""), credentials.get("password", ""))


@router.get("/me")
def me_route(account: dict = Depends(get_current_account)) -> dict[str, Any]:
    return {"user": sanitize_account(account)}


@router.get("/sidebar-users")
def sidebar_users_route(account: dict = Depends(get_current_account), repository: ErpRecordRepository = Depends(get_repository)) -> list[dict[str, Any]]:
    if account.get("role") not in {"DEV", "CEO"}:
        return [sanitize_account(account)]

    accounts = [record for record in repository.list_records("accounts") if record.get("status") == "ativo"]

    if account.get("role") == "CEO":
        accounts = [record for record in accounts if record.get("role") != "DEV"]

    return [sanitize_account(record) for record in accounts]


@router.get("/login-accounts")
def login_accounts_route() -> list[dict[str, Any]]:
    return []


@router.post("/first-login")
def complete_first_login_route(
    payload: dict[str, Any],
    account: dict = Depends(get_current_account),
    repository: ErpRecordRepository = Depends(get_repository),
) -> dict[str, Any]:
    return complete_first_login(repository, account, payload)


@router.post("/change-password")
def change_password_route(
    payload: dict[str, Any],
    repository: ErpRecordRepository = Depends(get_repository),
) -> dict[str, str]:
    return change_password(repository, payload)


@router.post("/request-account")
def request_account_route(
    payload: dict[str, Any],
    repository: ErpRecordRepository = Depends(get_repository),
) -> dict[str, Any]:
    return request_account_access(repository, payload)
