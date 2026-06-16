from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import decode_access_token
from app.db.postgres import get_optional_connection
from app.repositories.repository_factory import ErpRecordRepository, build_repository

bearer_scheme = HTTPBearer(auto_error=False)


def get_repository(connection = Depends(get_optional_connection)) -> ErpRecordRepository:
    return build_repository(connection)


def get_current_account(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    repository: ErpRecordRepository = Depends(get_repository),
) -> dict:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessao obrigatoria.")

    payload = decode_access_token(credentials.credentials)
    account = repository.get_record("accounts", payload.get("sub", ""))

    if not account or account.get("status") != "ativo":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Conta inativa ou inexistente.")

    return account
