# ─────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias primero (cache layer)
COPY package*.json ./
RUN npm ci --only=production=false

# Copiar código fuente y compilar
COPY . .
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Production runtime
# ─────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Instalar solo dependencias de producción
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar build compilado
COPY --from=builder /app/dist ./dist

# Usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]
