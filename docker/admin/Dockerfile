# Build context: ./bymed-admin

# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
# npm ci rejects this repo's lockfile under npm 10 (strict tree vs nested chokidar). Install is slower but reliable.
RUN npm install --no-audit --no-fund

COPY . .

RUN npm run build -- --configuration production

# ─── Stage 2: Serve with nginx ────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Angular 17+ application builder outputs the browser bundle under dist/<name>/browser.
COPY --from=builder /app/dist/bymed-admin/browser /usr/share/nginx/html

# SPA routing config — supplied from the adjacent nginx.conf in bymed-admin/.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Use 127.0.0.1 — Alpine resolves "localhost" to ::1 first; nginx may not listen on IPv6.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
