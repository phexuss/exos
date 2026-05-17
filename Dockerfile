FROM node:20-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV API_APP_DIR="."

WORKDIR /app

RUN apk add --no-cache make g++ python3
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY . .

RUN set -eux; \
  if [ -f api/package.json ]; then \
    API_APP_DIR="api"; \
  elif [ -f apps/api/package.json ]; then \
    API_APP_DIR="apps/api"; \
  else \
    API_APP_DIR="."; \
  fi; \
  test -f "$API_APP_DIR/package.json"; \
  echo "$API_APP_DIR" > /app/.api-app-dir

RUN set -eux; \
  API_APP_DIR="$(cat /app/.api-app-dir)"; \
  cd "$API_APP_DIR"; \
  if [ -f pnpm-lock.yaml ] || [ -f /app/pnpm-lock.yaml ]; then \
    pnpm install --frozen-lockfile; \
  else \
    pnpm install --no-frozen-lockfile; \
  fi; \
  DATABASE_URL="postgresql://user:pass@host.neon.tech/dbname?sslmode=require" pnpm prisma:generate; \
  pnpm build; \
  if [ -f dist/src/main.js ] && [ ! -f dist/main.js ]; then printf "require('./src/main.js');\n" > dist/main.js; fi; \
  pnpm prune --prod

FROM node:20-alpine AS runner

ENV NODE_ENV="production"
ENV YTDLP_PATH="/usr/bin/yt-dlp"

WORKDIR /app

RUN apk add --no-cache ca-certificates curl ffmpeg libstdc++ python3 \
  && curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
  && chmod 0755 /usr/local/bin/yt-dlp \
  && ln -sf /usr/local/bin/yt-dlp /usr/bin/yt-dlp \
  && printf '%s\n' '--js-runtimes node' '--remote-components ejs:github' > /etc/yt-dlp.conf

COPY --from=builder /app /app

EXPOSE 3000

CMD ["sh", "-c", "cd \"$(cat /app/.api-app-dir)\" && node dist/main.js"]
