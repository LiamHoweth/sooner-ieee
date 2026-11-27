# Website service on Railway (ieee-sooners-web). Build context: the repository root.
# Stage 1 prerenders the static site with Vinext; stage 2 serves dist/client with Caddy.
# The API (server/) is a separate Railway service with its own build. See docs/BACKEND.md.

FROM node:22.23.4-bookworm-slim AS build
WORKDIR /app

# Railway passes service variables to declared build args. The site embeds the API
# address at build time, so a change to it needs a redeploy of this service.
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

FROM caddy:2.11.8-alpine
COPY deploy/web/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist/client /srv
# Railway sets PORT; the Caddyfile listens on it (80 when run elsewhere).
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
