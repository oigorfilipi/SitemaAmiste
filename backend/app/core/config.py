from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


COLLECTION_NAMES = [
    "accounts",
    "accountRequests",
    "systemSettings",
    "inventoryCounts",
    "inventoryLocations",
    "machineConfigs",
    "machines",
    "recipes",
    "supplies",
    "accessories",
    "clients",
    "checklists",
    "repairOrders",
    "proposals",
    "serviceSheets",
    "sales",
    "receivables",
    "payables",
    "labels",
    "options",
    "wikiSolutions",
    "history",
]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Amiste ERP API"
    environment: str = Field(default="local", alias="ENV")
    database_url: str = Field(default="", alias="DATABASE_URL")
    frontend_url: str = Field(default="http://127.0.0.1:5173", alias="FRONTEND_URL")
    secret_key: str = Field(default="local-dev-only", alias="SECRET_KEY")
    supabase_url: str = Field(default="", alias="SUPABASE_URL")
    supabase_anon_key: str = Field(default="", alias="SUPABASE_ANON_KEY")
    supabase_service_role_key: str = Field(default="", alias="SUPABASE_SERVICE_ROLE_KEY")
    allow_unknown_collections: bool = Field(default=False, alias="ALLOW_UNKNOWN_COLLECTIONS")
    access_token_ttl_minutes: int = Field(default=720, alias="ACCESS_TOKEN_TTL_MINUTES")

    @property
    def cors_origins(self) -> list[str]:
        origins = [
            self.frontend_url,
            "http://127.0.0.1:5173",
            "http://localhost:5173",
            "http://127.0.0.1:4173",
            "http://localhost:4173",
            "https://sitema-interno-amiste.vercel.app",
        ]

        return list(dict.fromkeys(origin for origin in origins if origin))


@lru_cache
def get_settings() -> Settings:
    return Settings()
