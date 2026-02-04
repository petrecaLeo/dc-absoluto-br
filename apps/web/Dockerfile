FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copiar arquivos de configuração do workspace
COPY package.json pnpm-workspace.yaml tsconfig.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-schemas/package.json ./packages/shared-schemas/

# Instalar dependências
RUN pnpm install

# Copiar código fonte
COPY apps/web ./apps/web
COPY packages ./packages

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["pnpm", "dev"]
