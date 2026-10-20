# ─── SCMS Backend — Development Dockerfile ────────────────────────────────────
# Node.js 20 LTS (Alpine) — lightweight base image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# ─── Dependency Installation ─────────────────────────────────────────────────
# Copy package manifests first to leverage Docker layer caching.
# Rebuilds this layer only when package.json / package-lock.json change.
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies: nodemon, jest, etc.)
# Use npm ci for reproducible installs from package-lock.json
RUN npm ci

# ─── Source Files ────────────────────────────────────────────────────────────
# Copy application source into the container.
# In development, this layer is overridden by the bind-mount volume,
# but it ensures the image is self-contained when run without volumes.
COPY src/ ./src/

# ─── Runtime ──────────────────────────────────────────────────────────────────
# Expose the backend port (default: 5000)
EXPOSE 5000

# Start the Express server using the existing npm start script
CMD ["npm", "start"]
