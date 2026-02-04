.PHONY: dev dev-web dev-api down logs lint format install build clean clean-next test test-watch test-web test-api

# Sobe todos os serviços (web + api) com Docker
dev:
	docker compose up --build

# Sobe apenas o frontend
dev-web:
	docker compose up --build web

# Sobe apenas o backend
dev-api:
	docker compose up --build api

# Para todos os containers
down:
	docker compose down

# Exibe logs de todos os serviços
logs:
	docker compose logs -f

# Executa linting com Biome
lint:
	pnpm lint

# Formata código com Biome
format:
	pnpm format

# Instala dependências com pnpm
install:
	pnpm install

# Build de produção
build:
	pnpm build

# Executa todos os testes
test:
	pnpm test

# Executa testes em modo watch
test-watch:
	pnpm test:watch

# Executa testes do frontend
test-web:
	pnpm test:web

# Executa testes da API
test-api:
	pnpm test:api

# Limpa o cache do Next.js
clean-next:
	find . -name ".next" -type d -prune -exec rm -rf {} +
	@echo "Cache do Next.js removido."

# Remove containers, volumes e node_modules
clean:
	docker compose down -v --rmi local
	find . -name "node_modules" -type d -prune -exec rm -rf {} +
	find . -name ".turbo" -type d -prune -exec rm -rf {} +
	find . -name ".next" -type d -prune -exec rm -rf {} +
