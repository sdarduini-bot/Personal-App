#!/bin/bash
# ==========================================
# deploy.sh — Trainer Pro
# Deploy para AWS Lightsail (mesmo servidor do Psicogestão)
# Uso: bash deploy/deploy.sh
# ==========================================

set -e

# ------------------------------------------
# Configuração — edite conforme seu servidor
# ------------------------------------------
SERVER_USER="ubuntu"
SERVER_IP="IP_DO_SEU_LIGHTSAIL"          # ex: 18.234.xxx.xxx
SSH_KEY_PATH="~/.ssh/lightsail-key.pem"  # caminho da chave SSH do Lightsail
REMOTE_DIR="/home/ubuntu/trainer-pro"
APP_URL="https://trainer.seudominio.com.br"

echo "=================================================="
echo "  🚀 Deploy Trainer Pro"
echo "  🌐 Servidor: $SERVER_IP"
echo "=================================================="
echo ""

# ------------------------------------------
# 1. Build local
# ------------------------------------------
echo "🔨 [1/5] Gerando build de produção..."
# O build usa DATABASE_URL dummy (definido no Dockerfile)
npm run build
echo "✅ Build gerado."

# ------------------------------------------
# 2. Empacota arquivos (exclui node_modules, db, uploads)
# ------------------------------------------
echo "📦 [2/5] Empacotando arquivos para envio..."
DEPLOY_PACKAGE="/tmp/trainer-pro-deploy-$(date +%Y%m%d%H%M%S).tar.gz"

tar -czf "$DEPLOY_PACKAGE" \
  --exclude="./node_modules" \
  --exclude="./.git" \
  --exclude="./data" \
  --exclude="./.next/cache" \
  --exclude="./prisma/*.db" \
  --exclude="./scratch" \
  .next/ \
  public/ \
  prisma/ \
  deploy/ \
  docker-compose.yml \
  Dockerfile \
  package.json \
  package-lock.json

echo "✅ Pacote criado: $DEPLOY_PACKAGE"

# ------------------------------------------
# 3. Envia para o servidor
# ------------------------------------------
echo "📤 [3/5] Enviando para $SERVER_IP..."
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no \
  "$SERVER_USER@$SERVER_IP" "mkdir -p $REMOTE_DIR"

scp -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no \
  "$DEPLOY_PACKAGE" "$SERVER_USER@$SERVER_IP:/tmp/trainer-pro-deploy.tar.gz"

echo "✅ Arquivos enviados."

# ------------------------------------------
# 4. Extrai e configura no servidor
# ------------------------------------------
echo "⚙️  [4/5] Configurando servidor remoto..."
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no \
  "$SERVER_USER@$SERVER_IP" << REMOTE_SCRIPT
  set -e
  cd $REMOTE_DIR

  # Extrai os novos arquivos
  tar -xzf /tmp/trainer-pro-deploy.tar.gz
  rm -f /tmp/trainer-pro-deploy.tar.gz

  # Garante que os diretórios de dados existem
  mkdir -p data/postgres data/uploads

  echo "Servidor configurado."
REMOTE_SCRIPT

echo "✅ Configuração remota concluída."

# ------------------------------------------
# 5. Reconstrói imagem e reinicia container
# ------------------------------------------
echo "🐳 [5/5] (Re)construindo e iniciando container..."
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no \
  "$SERVER_USER@$SERVER_IP" << REMOTE_SCRIPT
  set -e
  cd $REMOTE_DIR

  # Verifica se o .env.server existe
  if [ ! -f .env.server ]; then
    echo "❌ ERRO: Arquivo .env.server não encontrado em $REMOTE_DIR"
    echo "   Crie o arquivo com base em deploy/.env.server.example"
    exit 1
  fi

  # Para container anterior se existir
  sudo docker compose down 2>/dev/null || true

  # Reconstrói imagem e sobe os containers
  sudo docker compose --env-file .env.server build --no-cache
  sudo docker compose --env-file .env.server up -d

  echo "Containers iniciados:"
  sudo docker ps --filter "name=trainer_pro"
REMOTE_SCRIPT

echo "✅ Containers em execução."

# ------------------------------------------
# Verifica saúde
# ------------------------------------------
echo ""
echo "🩺 Verificando saúde do serviço em 15s..."
sleep 15

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "http://$SERVER_IP:3335/api/health" 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Serviço respondendo! Status: $HTTP_STATUS"
else
  echo "⚠️  Status: $HTTP_STATUS (pode ainda estar inicializando)"
  echo "   Verifique: ssh -i $SSH_KEY_PATH $SERVER_USER@$SERVER_IP 'sudo docker logs trainer_pro_app'"
fi

rm -f "$DEPLOY_PACKAGE"

echo ""
echo "=================================================="
echo "  ✅ DEPLOY CONCLUÍDO!"
echo "  🌐 App: $APP_URL"
echo "=================================================="
