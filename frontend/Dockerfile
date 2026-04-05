# ─────────────────────────────────────────────
# Stage 1: Build React app
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production=false

COPY . .

# Variables API para build de Vite (Railway):
# - VITE_API_BASE_URL: usada por la mayoría de servicios
# - VITE_API_URL: fallback para módulos legacy
ARG VITE_API_BASE_URL=/api
ARG VITE_API_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Serve con nginx
# ─────────────────────────────────────────────
FROM nginx:1.25-alpine AS production

# URL pública del backend usada por nginx en runtime.
# En docker-compose/local el default puede ser el servicio interno.
ENV BACKEND_PUBLIC_URL=http://backend:3000

# Copiar template de nginx para que el entrypoint oficial haga envsubst en runtime
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copiar el build de Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Permisos para usuario no-root + acceso a conf.d para envsubst en runtime
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
