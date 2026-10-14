# ==========================================
# Trainer Pro — Dockerfile para Produção (AWS Lightsail)
# Next.js 14 LTS — Multi-Stage Build Alpine
# ==========================================

# Estágio 1: Build da aplicação
FROM node:22-alpine AS builder

WORKDIR /app

# OpenSSL necessário para o Prisma no Alpine
RUN apk add --no-cache openssl

# DATABASE_URL dummy para que o Prisma não falhe durante o build
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy

# Copia manifestos
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Instala todas as dependências (incluindo dev para o build)
RUN npm ci

# Gera o Prisma Client
RUN npx prisma generate

# Copia o restante do código
COPY . .

# Build Next.js
RUN npm run build

# ==========================================
# Estágio 2: Runtime de Produção
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl wget

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Copia apenas o necessário para rodar
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Instala somente dependências de produção
RUN npm ci --omit=dev && npm cache clean --force

# Copia artefatos do builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Diretório para uploads de fotos (montado como volume)
RUN mkdir -p /app/public/uploads

# Usuário não-root para segurança
RUN chown -R node:node /app
USER node

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start: gera client → sincroniza schema → inicia servidor
CMD ["sh", "-c", "npx prisma generate && npx prisma db push && npx next start -H 0.0.0.0"]
