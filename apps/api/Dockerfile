FROM node:20-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/package.json

RUN pnpm install --frozen-lockfile --filter api...

COPY apps/api ./apps/api

RUN DATABASE_URL="postgresql://user:pass@host.neon.tech/dbname?sslmode=require" pnpm --filter api prisma:generate
RUN pnpm --filter api build \
  && printf "require('./src/main.js');\n" > apps/api/dist/main.js

FROM node:20-alpine AS runner

ENV NODE_ENV="production"
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV YTDLP_PATH="/usr/bin/yt-dlp"

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

RUN apk add --no-cache ca-certificates curl ffmpeg python3 \
  && curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
  && chmod 0755 /usr/local/bin/yt-dlp \
  && ln -sf /usr/local/bin/yt-dlp /usr/bin/yt-dlp \
  && printf '%s\n' '--js-runtimes node' '--remote-components ejs:github' > /etc/yt-dlp.conf

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/package.json

RUN apk add --no-cache --virtual .node-gyp-deps make g++ \
  && pnpm install --prod --frozen-lockfile --filter api... \
  && pnpm store prune \
  && apk del .node-gyp-deps

COPY --from=builder /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/main.js"]
