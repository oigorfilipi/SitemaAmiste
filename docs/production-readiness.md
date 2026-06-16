# Prontidao comercial

## Status atual

O sistema esta publicado com frontend na Vercel, backend FastAPI no Render, dados no Supabase/Postgres e arquivos privados de etiquetas no Supabase Storage.

## Concluido

- Login corporativo por e-mail e senha.
- Primeiro acesso obrigatorio para senha definitiva, nome de exibicao e foto.
- Bloqueio backend das rotas operacionais enquanto o primeiro acesso nao for concluido.
- Politica minima para senhas novas e provisorias.
- Cadastro/edicao de colaboradores sem regravar senha padrao acidentalmente.
- Backup completo restrito a DEV.
- Auditoria de criacao, edicao, exclusao, backup e restauracao.
- Upload, preview/download e exclusao de arquivos de etiquetas via Supabase Storage privado.
- Smoke test de producao para frontend, API, login, bloqueio de primeiro acesso e Storage quando houver conta operacional.
- Fluxo interno de solicitacoes, incluindo pedido de conta, visivel para DONO/DEV e usuarios conforme permissao.
- Tema claro/escuro persistido por usuario.

## Bloqueios externos para 100% comercial

- Concluir o primeiro acesso das contas administrativas reais.
- Depois que todas as contas antigas tiverem senha definitiva, desativar a tolerancia de senha legada `1234`.

## Validacao atual

Com a conta administrativa ainda pendente de primeiro acesso, a smoke test valida:

- Frontend respondendo.
- Banco respondendo.
- Login respondendo.
- `/api/auth/me` respondendo.
- `/api/snapshot` bloqueado ate a conclusao do primeiro acesso.

Depois que uma conta DEV concluir o primeiro acesso, rode `npm run smoke:production` com `SMOKE_EMAIL` e `SMOKE_PASSWORD` para validar tambem snapshot, backup e Storage completo.
