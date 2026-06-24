#!/bin/bash
# =============================================================================
# setup_vps.sh — Script de configuración inicial del VPS Hostinger
# Servidor: 2.25.207.105 (Ubuntu 24.04 LTS)
# Ejecutar como root: bash setup_vps.sh
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[SETUP]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ===========================================================================
# 1. Sistema base
# ===========================================================================
log "Actualizando paquetes del sistema..."
apt-get update -qq && apt-get upgrade -y -qq

log "Instalando dependencias base..."
apt-get install -y -qq curl git ufw nginx certbot python3-certbot-nginx

# ===========================================================================
# 2. Node.js 20 LTS
# ===========================================================================
log "Instalando Node.js 20 LTS..."
if ! command -v node &>/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null
  apt-get install -y -qq nodejs
fi
log "Node.js: $(node -v) | npm: $(npm -v)"

# ===========================================================================
# 3. PM2
# ===========================================================================
log "Instalando PM2..."
npm install -g pm2 --quiet
pm2 startup systemd -u root --hp /root | tail -n1 | bash || true

# ===========================================================================
# 4. Directorio de la aplicación
# ===========================================================================
APP_DIR="/var/www/semiologia"
log "Preparando directorio de la app en $APP_DIR..."
mkdir -p "$APP_DIR"

# ===========================================================================
# 5. SSH key para GitHub Actions deploy
# ===========================================================================
log "Generando par de claves SSH para CI/CD..."
SSH_KEY_FILE="$HOME/.ssh/deploy_key"
if [ ! -f "$SSH_KEY_FILE" ]; then
  ssh-keygen -t ed25519 -C "github-actions-deploy@semiologia" -f "$SSH_KEY_FILE" -N ""
  cat "$SSH_KEY_FILE.pub" >> "$HOME/.ssh/authorized_keys"
  chmod 600 "$HOME/.ssh/authorized_keys"
  log "✓ Clave SSH generada"
else
  log "✓ Clave SSH ya existe"
fi

echo ""
warn "==================================================================="
warn "COPIA ESTA CLAVE PRIVADA EN: GitHub → Settings → Secrets → SSH_PRIVATE_KEY"
warn "==================================================================="
echo ""
cat "$SSH_KEY_FILE"
echo ""

# ===========================================================================
# 6. Firewall
# ===========================================================================
log "Configurando firewall UFW..."
ufw allow 22/tcp   comment 'SSH'
ufw allow 80/tcp   comment 'HTTP'
ufw allow 443/tcp  comment 'HTTPS'
ufw --force enable
ufw status

# ===========================================================================
# 7. Nginx — Configuración del reverse proxy
# ===========================================================================
log "Configurando Nginx..."

NGINX_CONF="/etc/nginx/sites-available/semiologia"
cat > "$NGINX_CONF" << 'NGINXEOF'
server {
    listen 80;
    server_name 2.25.207.105 srv1757384.hstgr.cloud;

    # Requerido por Next.js App Router streaming
    proxy_buffering off;
    add_header X-Accel-Buffering no;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 1000;

    # Archivos estáticos de Next.js con cache largo
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }

    # App
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}
NGINXEOF

ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/semiologia
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx
log "✓ Nginx configurado y recargado"

# ===========================================================================
# 8. Resumen
# ===========================================================================
echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  SERVIDOR LISTO — Próximos pasos:${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo "  1. Clona tu repo:"
echo "     cd /var/www"
echo "     git clone https://github.com/TU_USUARIO/semiologia.git"
echo ""
echo "  2. Configura variables de entorno:"
echo "     cp /var/www/semiologia/.env.example /var/www/semiologia/.env"
echo "     nano /var/www/semiologia/.env"
echo ""
echo "  3. Build inicial y arranque:"
echo "     cd /var/www/semiologia"
echo "     npm ci && npm run build"
echo "     pm2 start npm --name 'semiologia' -- start"
echo "     pm2 save"
echo ""
echo "  4. Añade la clave SSH privada (mostrada arriba) a GitHub Secrets."
echo ""
echo "  5. (Opcional) HTTPS con tu dominio:"
echo "     certbot --nginx -d tu-dominio.com"
echo ""
