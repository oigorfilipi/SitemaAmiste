from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile

from app.api.dependencies import get_current_account
from app.core.permissions import can_perform_action
from app.services.storage_service import create_signed_file_url, delete_file_from_storage, upload_file_to_storage

router = APIRouter(prefix="/files", tags=["files"])


def require_file_permission(account: dict, action: str) -> None:
    if not can_perform_action(account.get("role") or "VEN", action):
        raise HTTPException(status_code=403, detail="Voce nao tem permissao para arquivos.")


@router.post("")
async def upload_file_route(
    folder: str = Query(default="uploads"),
    file: UploadFile = File(...),
    account: dict = Depends(get_current_account),
) -> dict[str, Any]:
    require_file_permission(account, "action:upload")
    return await upload_file_to_storage(file, folder, account.get("id") or "system")


@router.get("/signed-url")
def signed_file_url_route(
    storageKey: str,
    account: dict = Depends(get_current_account),
) -> dict[str, Any]:
    require_file_permission(account, "action:download")
    return create_signed_file_url(storageKey)


@router.delete("")
def delete_file_route(
    storageKey: str,
    account: dict = Depends(get_current_account),
) -> dict[str, Any]:
    require_file_permission(account, "action:delete")
    return delete_file_from_storage(storageKey)
