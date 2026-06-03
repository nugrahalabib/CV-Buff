# syntax=docker.io/docker/dockerfile:1

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g corepack@latest && corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS builder
COPY . .
RUN pnpm run build && pnpm prune --prod

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodeapp

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.mjs ./server.mjs
# auth source + tsconfig enable the one-time DB migration inside the container:
#   docker compose exec web pnpm db:migrate
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# DB is external Postgres, provided at runtime via DATABASE_URL (see docs/AUTH.md).
# No local data volume needed.

USER nodeapp

EXPOSE 1713
ENV PORT=1713
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.mjs"]
