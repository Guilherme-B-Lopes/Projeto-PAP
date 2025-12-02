FROM node:20-alpine

# Diretório de trabalho dentro do container
WORKDIR /app

# Copiar apenas ficheiros de configuração primeiro (melhora cache)
COPY package*.json ./

# Instalar dependências em modo produção
RUN npm ci --only=production

# Copiar restante código
COPY . .

# Expor a porta usada pelo server.js (ajusta se for diferente)
EXPOSE 3000

# Variáveis de ambiente (o Docker vai usar o teu .env se fizeres bind ou compose)
ENV NODE_ENV=production

# Criar utilizador não-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

CMD ["node", "server.js"]
