FROM node:20-alpine3.22

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@9.11.0 --activate

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile --prod

# Copiar el resto del código
COPY . .

# Generar Prisma Client
RUN pnpm prisma:generate

# Compilar TypeScript
RUN pnpm build

# Exponer puerto (Render asigna dinámicamente)
EXPOSE 3000

# Cambiar a usuario no-root
USER node

# Comando de inicio
CMD ["pnpm", "start"]