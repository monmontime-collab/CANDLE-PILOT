# Multi-architecture Dockerfile for Apple Silicon (Mac M1/M2/M3/M4 arm64) and Windows/Linux (x86_64 amd64)
# Build command: docker buildx build --platform linux/amd64,linux/arm64 -t cryptopulse/trading-app:latest .

FROM --platform=$BUILDPLATFORM golang:1.22-alpine AS go-builder
ARG TARGETOS
ARG TARGETARCH
WORKDIR /backend
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -ldflags="-w -s" -o /bin/auth-service ./services/auth-service || true

# Node.js Frontend Stage
FROM node:20-alpine AS node-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
RUN npm run build

# Production Server Stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=node-builder /app/dist ./dist
COPY --from=node-builder /app/package*.json ./
COPY --from=node-builder /app/server.ts ./
COPY --from=node-builder /app/node_modules ./node_modules
COPY --from=go-builder /bin/auth-service /usr/local/bin/auth-service

EXPOSE 3000 8081 8082
CMD ["npm", "run", "dev"]
