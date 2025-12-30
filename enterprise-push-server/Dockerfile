# Multi-stage Dockerfile for all services
# Usage: docker build --target <service-name> -t <image-name> .

# ============ Build Stage ============
FROM rust:1.75-slim-bookworm AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy workspace files
COPY Cargo.toml Cargo.lock* ./
COPY crates ./crates

# Build all binaries in release mode
RUN cargo build --release

# ============ Runtime Base ============
FROM debian:bookworm-slim AS runtime-base

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -r -s /bin/false appuser

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# ============ Auth Service ============
FROM runtime-base AS auth-service

COPY --from=builder /app/target/release/auth-service /app/auth-service

USER appuser
WORKDIR /app

ENV AUTH_HOST=0.0.0.0
ENV AUTH_PORT=8081

EXPOSE 8081

CMD ["./auth-service"]

# ============ Gateway Service ============
FROM runtime-base AS gateway-service

COPY --from=builder /app/target/release/gateway-service /app/gateway-service

USER appuser
WORKDIR /app

ENV GATEWAY_HOST=0.0.0.0
ENV GATEWAY_PORT=8080

EXPOSE 8080

CMD ["./gateway-service"]

# ============ Message Service ============
FROM runtime-base AS message-service

COPY --from=builder /app/target/release/message-service /app/message-service

USER appuser
WORKDIR /app

ENV MESSAGE_HOST=0.0.0.0
ENV MESSAGE_PORT=8082

EXPOSE 8082

CMD ["./message-service"]

# ============ Presence Service ============
FROM runtime-base AS presence-service

COPY --from=builder /app/target/release/presence-service /app/presence-service

USER appuser
WORKDIR /app

ENV PRESENCE_HOST=0.0.0.0
ENV PRESENCE_PORT=8083

EXPOSE 8083

CMD ["./presence-service"]

# ============ Push Service ============
FROM runtime-base AS push-service

COPY --from=builder /app/target/release/push-service /app/push-service

USER appuser
WORKDIR /app

ENV PUSH_HOST=0.0.0.0
ENV PUSH_PORT=8084

EXPOSE 8084

CMD ["./push-service"]
