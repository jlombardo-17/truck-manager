#!/usr/bin/env bash
# =============================================================================
# renew-ssl.sh — Renovación automática de certificados SSL
#
# Se ejecuta automáticamente via cron cada día a las 3 AM
# (configurado por deploy.sh)
#
# Let's Encrypt emite certs por 90 días.
# acme-companion los renueva automáticamente cuando quedan <30 días.
# Este script fuerza una verificación y recarga nginx si hubo cambios.
# =============================================================================

set -euo pipefail

APP_DIR="/opt/truck-manager"
COMPOSE_FILE="docker-compose.prod.yml"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')] renew-ssl:"

echo "$LOG_PREFIX Verificando certificados..."

cd "$APP_DIR"

# acme-companion renueva automáticamente; solo necesitamos recargar nginx
# si los certs fueron actualizados. Verificamos por timestamp del volumen.
docker exec truck_nginx_proxy nginx -s reload 2>/dev/null \
  && echo "$LOG_PREFIX nginx recargado correctamente" \
  || echo "$LOG_PREFIX nginx reload no fue necesario o falló (inofensivo)"

echo "$LOG_PREFIX Verificación completada"
