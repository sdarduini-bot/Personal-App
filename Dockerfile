FROM node:22-alpine

WORKDIR /app

# Dependências de sistema necessárias para o Prisma no Alpine
RUN apk add --no-cache openssl

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências do projeto
RUN npm install

# Copiar todo o código-fonte
COPY . .

# Gerar o client Prisma e compilar a aplicação Next.js
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "start"]
