create table if not exists public.erp_records (
  collection_name text not null,
  record_id text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection_name, record_id)
);

create index if not exists erp_records_collection_updated_idx
  on public.erp_records (collection_name, updated_at desc);

create index if not exists erp_records_payload_gin_idx
  on public.erp_records using gin (payload);

alter table public.erp_records enable row level security;

comment on table public.erp_records is
  'Persistencia inicial do ERP Amiste. Cada registro guarda a colecao de origem e o payload JSONB do frontend.';
