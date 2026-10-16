# DC Absoluto BR

Site catálogo para quadrinhos do Universo Absoluto da DC em português brasileiro.

## Stack Tecnológica

**Frontend (apps/web)**
- Next.js 15 + React 19
- Tailwind CSS v4
- TanStack Query
- Vitest + React Testing Library

**Backend (apps/api)**
- Bun + Elysia
- Drizzle ORM
- Neon PostgreSQL
- Swagger (documentação)

**Monorepo**
- Turborepo + pnpm workspaces
- Biome (linting e formatação)

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Docker](https://www.docker.com/) e Docker Compose
- [Bun](https://bun.sh/) (para desenvolvimento local da API)

## Instalação

```bash
# Clone o repositório
git clone https://github.com/petrecaLeo/dc-absoluto-br.git
cd dc-absoluto-br

# Instale as dependências
make install
# ou
pnpm install
```

## Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL=postgres://usuario:senha@host/banco
API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RESEND_API_KEY=seu_token_resend
RESEND_FROM_EMAIL="DC Absoluto BR <noreply@dcabsoluto.com.br>"
AUTH_SECRET=gere_com_openssl_rand_base64_48
ADMIN_EMAIL=seu@email.com
```

`API_BASE_URL` é usado para gerar links públicos nos e-mails (ex.: desinscrição).
`SITE_URL` é usado para gerar links públicos do site (ex.: confirmação de e-mail).
`AUTH_SECRET` assina as sessões. A API e o web precisam do **mesmo** valor, com no mínimo 32 caracteres
(`openssl rand -base64 48`). Sem ele a API não sobe e o web trata todo mundo como deslogado.
Trocar o valor desloga todos os usuários.
`ADMIN_EMAIL` é o único e-mail que pode entrar em `/adicionar` (só a API usa).

## Autenticação

- O login devolve um token assinado (HMAC-SHA256) que o web guarda no cookie `dcabsoluto.session`
  (`HttpOnly`, `SameSite=Lax`, 30 dias). O JavaScript da página não lê nem consegue forjar a sessão.
- As rotas autenticadas da API aceitam o token no cookie ou em `Authorization: Bearer <token>`.
- O `localStorage` guarda só nome e foto para exibir na interface.

## Área administrativa (`/adicionar`)

Página para cadastrar HQs sem chamar o endpoint na mão. Pede e-mail e senha da conta do `ADMIN_EMAIL`
e cria uma sessão de admin separada de 30 minutos (cookie `dcabsoluto.admin`, `HttpOnly`,
`SameSite=Strict`). Sem essa sessão, o formulário nem é renderizado. O `POST /api/comics` também
exige o token de admin. Pelo `api.http`, rode antes o "Login de admin".

## Executando o Projeto

### Com Docker (recomendado)

```bash
# Subir todos os serviços (frontend + API)
make dev

# Subir apenas o frontend
make dev-web

# Subir apenas a API
make dev-api

# Ver logs
make logs

# Parar os containers
make down
```

### Sem Docker

```bash
# Frontend
pnpm dev:web

# API
pnpm dev:api
```

## URLs

| Serviço   | URL                         |
|-----------|------------------------------|
| Frontend  | http://localhost:3000        |
| API       | http://localhost:3001        |
| Swagger   | http://localhost:3001/swagger|

## Endpoints de Newsletter

- `POST /api/newsletter/subscribe` inscreve na newsletter geral
- `POST /api/newsletter/character/subscribe` inscreve na newsletter de personagem
- `GET /api/newsletter/unsubscribe/:id` desinscreve da newsletter geral
- `GET /api/newsletter/character/unsubscribe/:id` desinscreve da newsletter de personagem

## Comandos Úteis

### Desenvolvimento

| Comando         | Descrição                          |
|-----------------|------------------------------------|
| `make dev`      | Inicia todos os serviços via Docker|
| `make dev-web`  | Inicia apenas o frontend           |
| `make dev-api`  | Inicia apenas a API                |
| `make down`     | Para todos os containers           |
| `make logs`     | Exibe logs dos containers          |

### Qualidade de Código

| Comando          | Descrição                    |
|------------------|------------------------------|
| `pnpm lint`      | Executa linting com Biome    |
| `pnpm lint:fix`  | Corrige problemas de linting |
| `pnpm format`    | Formata código com Biome     |

### Testes

| Comando              | Descrição                      |
|----------------------|--------------------------------|
| `make test`          | Executa todos os testes        |
| `make test-watch`    | Testes em modo watch           |
| `make test-web`      | Testes do frontend             |
| `make test-api`      | Testes da API                  |
| `pnpm test:coverage` | Testes com cobertura           |

### Banco de Dados

| Comando           | Descrição                  |
|-------------------|----------------------------|
| `pnpm db:generate`| Gera migrations do Drizzle |
| `pnpm db:migrate` | Executa migrations         |

### Build

| Comando       | Descrição                              |
|---------------|----------------------------------------|
| `pnpm build`  | Build de produção                      |
| `make clean`  | Remove containers, volumes e node_modules|


## Estrutura do Projeto

```
dc-absoluto-br/
├── apps/
│   ├── web/          # Frontend Next.js
│   └── api/          # Backend Elysia/Bun
├── packages/
│   ├── shared-types/   # Interfaces TypeScript compartilhadas
│   └── shared-schemas/ # Schemas Zod compartilhados
├── docker-compose.yml
├── Makefile
└── turbo.json
```

## Convenções

- **Arquivos**: `kebab-case.ts`
- **Componentes React**: `PascalCase.tsx`
- **Variáveis/Funções**: `camelCase`
- **Types/Interfaces**: `PascalCase`
- **Commits**: Português, conventional commits (`feat:`, `fix:`, `chore:`)

## Autor

Desenvolvido por [petrecaLeo](https://github.com/petrecaLeo).

## Licença

© 2026 petrecaLeo. Todos os direitos reservados.
