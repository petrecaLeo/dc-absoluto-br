FROM oven/bun:1.1-alpine AS base

RUN apk add --no-cache nodejs npm && npm install -g pnpm

WORKDIR /app

# Copiar arquivos de configuração do workspace
COPY package.json pnpm-workspace.yaml tsconfig.json .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-schemas/package.json ./packages/shared-schemas/

# Instalar dependências
RUN pnpm install

# Copiar código fonte
COPY apps/api ./apps/api
COPY packages ./packages

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["bun", "run", "--watch", "src/index.ts"]
