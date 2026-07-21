# syntax=docker/dockerfile:1

FROM node:22-slim AS base
WORKDIR /app
# Prisma's schema/migration engine need libssl on Debian-slim images.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# ---- deps: install full dependency tree (tsx/imapflow/mailparser are real
# runtime deps here, needed by the IMAP worker process, not just the build).
# `npm ci` runs the `postinstall` script (`prisma generate`), which needs the
# schema + config present, so those are copied in before installing. ----
FROM base AS deps
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

# ---- build: `npm run build` runs `prisma generate` itself before `next build` ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runtime: same image serves either the web service (next start) or the
# IMAP worker (npm run imap:poll) — override the start command per Railway
# service; see README "Deployment (Railway)" ----
FROM base AS runtime
ENV NODE_ENV=production
RUN useradd --system --create-home appuser
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/src ./src
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/scripts ./scripts
USER appuser

EXPOSE 3000
# Run migrations then start the Node app directly.
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
