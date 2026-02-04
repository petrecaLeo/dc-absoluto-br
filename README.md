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
git clone <url-do-repositorio>
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
```

`API_BASE_URL` é usado para gerar links públicos nos e-mails (ex.: desinscrição).

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

## Licença

Projeto privado.
