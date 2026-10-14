#!/bin/bash
# ==========================================
# migrate-db.sh — Migração Railway → Lightsail
# Exporta dados do Railway e importa no PostgreSQL local do Docker
#
# Pré-requisito: ter o DATABASE_URL do Railway em mãos
# Uso: bash deploy/migrate-db.sh "postgresql://user:pass@host:port/db"
# ==========================================

set -e

RAILWAY_URL="${1:-}"

if [ -z "$RAILWAY_URL" ]; then
  echo "❌ Uso: bash deploy/migrate-db.sh \"postgresql://user:pass@host:port/db\""
  echo ""
  echo "   O DATABASE_URL do Railway está em:"
  echo "   Railway Console → Postgres service → Variables → DATABASE_URL"
  exit 1
fi

echo "=================================================="
echo "  📦 Migração Railway → Lightsail PostgreSQL"
echo "=================================================="

DUMP_FILE="/tmp/trainer-pro-railway-$(date +%Y%m%d%H%M%S).sql"

# ------------------------------------------
# 1. Exporta do Railway
# ------------------------------------------
echo "📤 [1/3] Exportando banco do Railway..."
pg_dump "$RAILWAY_URL" \
  --no-owner \
  --no-privileges \
  --format=plain \
  --file="$DUMP_FILE"

echo "✅ Dump gerado: $DUMP_FILE ($(du -sh $DUMP_FILE | cut -f1))"

# ------------------------------------------
# 2. Aguarda o container PostgreSQL local estar pronto
# ------------------------------------------
echo "⏳ [2/3] Aguardando PostgreSQL local..."
for i in $(seq 1 30); do
  if sudo docker exec trainer_pro_db pg_isready -U trainer_user -d trainer_pro &>/dev/null; then
    echo "✅ PostgreSQL local pronto."
    break
  fi
  echo "   Tentativa $i/30..."
  sleep 2
done

# ------------------------------------------
# 3. Importa no container local
# ------------------------------------------
echo "📥 [3/3] Importando dados no PostgreSQL local..."
sudo docker exec -i trainer_pro_db \
  psql -U trainer_user -d trainer_pro < "$DUMP_FILE"

echo "✅ Migração concluída!"
rm -f "$DUMP_FILE"

echo ""
echo "=================================================="
echo "  ✅ BANCO MIGRADO COM SUCESSO!"
echo "  Reinicie o app para garantir que o schema está atualizado:"
echo "  sudo docker restart trainer_pro_app"
echo "=================================================="
