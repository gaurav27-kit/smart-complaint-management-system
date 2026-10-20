# ─── Stage 1: Build Frontend Artifacts ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for Vite (baked in at build time)
ARG VITE_API_URL=/api
ARG VITE_GOOGLE_CLIENT_ID

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Copy package manifests and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and produce production bundle
COPY . .
RUN npm run build

# ─── Stage 2: Production Web Server (Non-root Nginx) ──────────────────────────
FROM nginxinc/nginx-unprivileged:alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose default unprivileged nginx port
EXPOSE 8080

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
