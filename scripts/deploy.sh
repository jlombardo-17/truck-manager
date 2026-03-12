#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Setup inicial de Truck Manager en servidor Ubuntu/Debian
#
# Uso (desde tu máquina local, conectado por SSH al servidor):
#   chmod +x scripts/deploy.sh
#   ./scripts/deploy.sh
#
# O ejecutar directo en el servidor:
#   bash <(curl -fsSL https://raw.githubusercontent.com/<TU_USER>/truck-manager/main/scripts/deploy.sh)
#
# Requisitos:
#   - Ubuntu 22.04 / 24.04 o Debian 12 (como root o con sudo)
#   - Dominio apuntando a la IP del servidor (registro A configurado)
#   - Puerto 80 y 443 abiertos en el firewall
# =============================================================================

set -euo pipefail

# ── Colores ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}   $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERR]${NC}  $*"; exit 1; }

# ── Variables de configuración ────────────────────────────────────────────────
REPO_URL="${REPO_URL:-https://github.com/<TU_USER>/truck-manager.git}"
APP_DIR="${APP_DIR:-/opt/truck-manager}"
COMPOSE_FILE="docker-compose.prod.yml"

echo ""
echo "  ========================================="
echo "   Truck Manager — Deploy Script"
echo "  ========================================="
echo ""

# ── 1. Verificar que corremos como root o con sudo ────────────────────────────
if [[ $EUID -ne 0 ]]; then
  error "Ejecutar como root o con sudo: sudo bash deploy.sh"
fi

# ── 2. Instalar Docker y Docker Compose ──────────────────────────────────────
if ! command -v docker &>/dev/null; then
  info "Instalando Docker..."
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg lsb-release

  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin

  systemctl enable docker
  systemctl start docker
  success "Docker instalado: $(docker --version)"
else
  success "Docker ya instalado: $(docker --version)"
fi

# ── 3. Clonar o actualizar el repositorio ────────────────────────────────────
if [[ -d "$APP_DIR/.git" ]]; then
  info "Actualizando repositorio en $APP_DIR..."
  cd "$APP_DIR"
  git pull origin main
  success "Repositorio actualizado"
else
  info "Clonando repositorio en $APP_DIR..."
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
  success "Repositorio clonado"
fi

# ── 4. Configurar variables de entorno ────────────────────────────────────────
if [[ ! -f "$APP_DIR/.env.production" ]]; then
  info "Creando .env.production desde el template..."
  cp "$APP_DIR/.env.production.example" "$APP_DIR/.env.production"
  chmod 600 "$APP_DIR/.env.production"

  echo ""
  warn "┌─────────────────────────────────────────────────────────┐"
  warn "│  ACCIÓN REQUERIDA: editar .env.production               │"
  warn "│                                                          │"
  warn "│  nano $APP_DIR/.env.production        │"
  warn "│                                                          │"
  warn "│  Completar al menos:                                     │"
  warn "│    DOMAIN=           (tu dominio, ej: truck.miempresa.com) │"
  warn "│    SSL_EMAIL=        (tu email para Let's Encrypt)       │"
  warn "│    DB_PASSWORD=      (contraseña segura para MySQL)      │"
  warn "│    DB_ROOT_PASSWORD= (contraseña root MySQL)             │"
  warn "│    JWT_SECRET=       (string aleatorio largo)            │"
  warn "└─────────────────────────────────────────────────────────┘"
  echo ""
  read -rp "Presioná ENTER cuando hayas editado el archivo .env.production..."
else
  success ".env.production ya existe"
fi

# Verificar que se completaron los campos obligatorios
source "$APP_DIR/.env.production"
[[ "${DOMAIN:-}" == "" || "${DOMAIN}" == "tudominio.com" ]] \
  && error "Completar DOMAIN en .env.production"
[[ "${SSL_EMAIL:-}" == "" || "${SSL_EMAIL}" == "tu@email.com" ]] \
  && error "Completar SSL_EMAIL en .env.production"
[[ "${DB_PASSWORD:-}" == "" || "${DB_PASSWORD}" == *"CAMBIAR"* ]] \
  && error "Completar DB_PASSWORD en .env.production"
[[ "${JWT_SECRET:-}" == "" || "${JWT_SECRET}" == *"CAMBIAR"* ]] \
  && error "Completar JWT_SECRET en .env.production"

# ── 5. Configurar firewall básico ─────────────────────────────────────────────
if command -v ufw &>/dev/null; then
  info "Configurando UFW firewall..."
  ufw allow 22/tcp  > /dev/null   # SSH
  ufw allow 80/tcp  > /dev/null   # HTTP
  ufw allow 443/tcp > /dev/null   # HTTPS
  ufw --force enable > /dev/null
  success "Firewall configurado (22, 80, 443 abiertos)"
fi

# ── 6. Build y levantar contenedores ─────────────────────────────────────────
info "Construyendo imágenes Docker..."
cd "$APP_DIR"
docker compose -f "$COMPOSE_FILE" --env-file .env.production build --no-cache

info "Levantando servicios..."
docker compose -f "$COMPOSE_FILE" --env-file .env.production up -d

# ── 7. Esperar que los servicios estén healthy ────────────────────────────────
info "Esperando que los servicios estén listos (puede tardar ~60s)..."
sleep 15

MAX_WAIT=120
ELAPSED=0
until docker compose -f "$COMPOSE_FILE" --env-file .env.production \
        ps --format json 2>/dev/null | grep -q '"Health":"healthy"' \
     || [[ $ELAPSED -ge $MAX_WAIT ]]; do
  sleep 5
  ELAPSED=$((ELAPSED + 5))
  echo -n "."
done
echo ""

# ── 8. Configurar renovación automática de SSL (cron) ────────────────────────
CRON_JOB="0 3 * * * /opt/truck-manager/scripts/renew-ssl.sh >> /var/log/truck-ssl-renew.log 2>&1"
if ! (crontab -l 2>/dev/null | grep -qF "renew-ssl.sh"); then
  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
  success "Cron de renovación SSL configurado (diario a las 3 AM)"
fi

# ── 9. Estado final ───────────────────────────────────────────────────────────
echo ""
success "══════════════════════════════════════════════"
success " Deploy completado!"
success "══════════════════════════════════════════════"
echo ""
info "URL de la app: https://${DOMAIN}"
info "Estado de contenedores:"
docker compose -f "$COMPOSE_FILE" --env-file .env.production ps
echo ""
info "Para ver logs en tiempo real:"
echo "  docker compose -f $APP_DIR/$COMPOSE_FILE --env-file $APP_DIR/.env.production logs -f"
echo ""
info "Para actualizar la app (nuevo código):"
echo "  cd $APP_DIR && git pull && docker compose -f $COMPOSE_FILE --env-file .env.production up -d --build"
