# ─────────────────────────────────────────────
# Stage 1: Build React app
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production=false

COPY . .

# VITE_API_URL se inyecta en build-time via ARG
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Serve con nginx
# ─────────────────────────────────────────────
FROM nginx:1.25-alpine AS production

# Copiar config de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar el build de Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Usuario no-root
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
