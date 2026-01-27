# Estágio 1: Build - Instala as dependências
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Estágio 2: Dev Server - Executa a aplicação
# Usamos a mesma base para manter a consistência
FROM node:20-alpine
WORKDIR /app
# Copia as dependências já instaladas do estágio anterior
COPY --from=builder /app/node_modules ./node_modules
# Copia o código-fonte
COPY . .

# Expõe a porta do Angular Live Development Server
EXPOSE 0568

# O '--host 0.0.0.0' é crucial para que o servidor seja acessível de fora do contêiner
CMD ["ng", "serve", "--host", "0.0.0.0"]
