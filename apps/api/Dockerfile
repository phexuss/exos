# syntax=docker/dockerfile:1.7
#
# EXØS API image. Build context is apps/api:
#   docker build -t exos-api apps/api
# or from the repo root: docker compose up -d --build
#
# apps/api is installed as a standalone package from its own pnpm-lock.yaml
# (--ignore-workspace), so the mobile app's patchedDependencies and the rest
# of the monorepo never enter the build.

ARG NODE_VERSION=22
ARG PNPM_VERSION=10.33.0

# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS base
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    # youtube-dl-exec's postinstall downloads its own yt-dlp; the runtime
    # image ships a pinned one at /usr/bin/yt-dlp instead.
    YOUTUBE_DL_SKIP_DOWNLOAD=true
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-workspace

# ---------------------------------------------------------------------------
FROM deps AS build
COPY . .
# prisma generate only needs a syntactically valid URL; it never connects.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm prisma:generate \
 && pnpm build \
 && test -f dist/src/main.js

# ---------------------------------------------------------------------------
# One-off migrations: docker compose run --rm migrate
FROM build AS migrate
CMD ["pnpm", "prisma:migrate:deploy"]

# ---------------------------------------------------------------------------
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-workspace --prod

# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runtime
ARG YTDLP_VERSION=latest
ARG TARGETARCH

# ffmpeg for yt-dlp post-processing, tini as PID 1 so yt-dlp/ffmpeg children
# are reaped and SIGTERM reaches Node. yt-dlp is the self-contained musl
# build (no Python needed); it uses Node for YouTube's JS challenges.
RUN set -eux; \
    apk add --no-cache ca-certificates ffmpeg tini; \
    case "${TARGETARCH:-amd64}" in \
      amd64) asset=yt-dlp_musllinux ;; \
      arm64) asset=yt-dlp_musllinux_aarch64 ;; \
      *) echo "unsupported arch ${TARGETARCH}" >&2; exit 1 ;; \
    esac; \
    if [ "$YTDLP_VERSION" = latest ]; then base=latest/download; else base="download/$YTDLP_VERSION"; fi; \
    # Lives in a directory the runtime user owns so docker-entrypoint.sh can
    # self-update it (yt-dlp -U renames files next to the binary).
    mkdir -p /opt/yt-dlp; \
    wget -qO /opt/yt-dlp/yt-dlp "https://github.com/yt-dlp/yt-dlp/releases/$base/$asset"; \
    chmod 0755 /opt/yt-dlp/yt-dlp; \
    chown -R node:node /opt/yt-dlp; \
    ln -s /opt/yt-dlp/yt-dlp /usr/bin/yt-dlp; \
    printf '%s\n' '--js-runtimes node' '--remote-components ejs:github' > /etc/yt-dlp.conf; \
    yt-dlp --version

ENV NODE_ENV=production \
    PORT=3000 \
    YTDLP_PATH=/usr/bin/yt-dlp \
    XDG_CACHE_HOME=/tmp/.cache

WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
COPY --chmod=0755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--", "docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
