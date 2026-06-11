# Backend Amiste ERP

Backend FastAPI preparado para persistir os dados do ERP em Postgres/Supabase sem quebrar o modo local atual do frontend.

## Stack

- FastAPI
- Postgres/Supabase
- `psycopg` com pool de conexoes
- Render para deploy

## Como rodar localmente

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Variaveis de ambiente

Copie `.env.example` para `.env` no diretorio `backend`.

```bash
DATABASE_URL=postgresql://...
FRONTEND_URL=http://127.0.0.1:5173
SECRET_KEY=troque-esta-chave
ENV=local
```

## Banco de dados

Execute o arquivo `migrations/001_create_erp_records.sql` no SQL Editor do Supabase ou no Postgres usado pelo Render.

## Estrategia inicial

O backend usa uma tabela generica `erp_records` com `payload JSONB`. Isso preserva todos os campos atuais do sistema enquanto a modelagem relacional definitiva ainda nao foi fechada. A migracao futura pode transformar colecoes criticas em tabelas especificas sem obrigar a reescrever todas as telas de uma vez.
