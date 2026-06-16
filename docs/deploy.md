# Deploy do Amiste ERP

Este guia deixa o frontend pronto para Vercel, o backend pronto para Render e o banco preparado para Supabase/Postgres.

## 1. Supabase

1. Crie ou abra o projeto Supabase.
2. Rode a migration `supabase/migrations/20260611194000_create_erp_records.sql` pelo SQL Editor ou pela Supabase CLI.
3. Copie a connection string Postgres para usar como `DATABASE_URL` no Render.

## 2. Render

O arquivo `render.yaml` define o servico `amiste-erp-api`.

Configure as variaveis secretas no dashboard do Render:

- `DATABASE_URL`
- `FRONTEND_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

`DATABASE_URL` e opcional se `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estiverem configurados. Nesse modo, o backend usa a API REST do Supabase.

O Render deve usar:

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check: `/api/health`

## 3. Vercel

O arquivo `vercel.json` configura o build Vite.

Variaveis do frontend:

- `VITE_DATA_SOURCE=api` para usar o backend.
- `VITE_API_URL=https://sua-api.onrender.com`

Enquanto `VITE_DATA_SOURCE=local`, o sistema continua usando o modo local atual.

## 4. Ordem segura de ativacao

1. Deploy do backend no Render.
2. Testar `GET /api/health`.
3. Rodar a migration no Supabase.
4. Configurar `DATABASE_URL` no Render.
5. Testar `GET /api/health/database`.
6. Deploy do frontend na Vercel ainda com `VITE_DATA_SOURCE=local`.
7. Alterar para `VITE_DATA_SOURCE=api` somente depois que a API estiver validada.

## 5. Carga inicial do seed

Para popular o Supabase com os dados mockados atuais do ERP, rode localmente:

```powershell
$env:SUPABASE_URL="https://jrikpqfplwfakkesuzuv.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="cole-a-service-role-key"
node scripts/seed-supabase.mjs
```

O script usa `on_conflict=collection_name,record_id`, entao pode ser executado novamente sem duplicar os registros do seed.

## 6. Backup de producao

No modo API, o backup baixado pela pagina Configuracoes usa `/api/backup` e fica restrito ao perfil DEV. Esse backup completo preserva hashes de senha e dados administrativos, entao deve ser armazenado apenas em local seguro.

## 7. Arquivos e uploads

No modo API, arquivos de etiquetas sao enviados pelo backend para o Supabase Storage no bucket privado `amiste-files`. O frontend recebe apenas metadados e usa URLs assinadas temporarias para preview, download e impressao.
