# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install Python and required packages
RUN apk add --no-cache python3 py3-pip
RUN pip3 install chromadb sentence-transformers

# Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects anonymous telemetry data about usage
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install Python and required packages in the runner
RUN apk add --no-cache python3 py3-pip
RUN pip3 install chromadb sentence-transformers

# Create necessary directories
RUN mkdir -p /app/data /app/chroma_db /app/.cache

# Copy built files
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

# Copy custom server
COPY --from=builder /app/server.js ./
COPY --from=builder /app/dist ./dist

# Make data directories accessible
RUN chmod -R 777 /app/data /app/chroma_db /app/.cache

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
