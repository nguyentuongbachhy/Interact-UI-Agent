# ============================================
# Stage 1: Builder
# ============================================
FROM rust:1.77-slim-bullseye AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy manifests
COPY Cargo.toml Cargo.lock ./

# Create a dummy main to build dependencies (cache optimization)
RUN mkdir -p src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Copy source code
COPY src ./src

# Build for release
# Touch main.rs to force rebuild of our code only
RUN touch src/main.rs && \
    cargo build --release

# ============================================
# Stage 2: Runtime
# ============================================
FROM debian:bullseye-slim

# Install runtime dependencies including Chromium
RUN apt-get update && apt-get install -y \
    ca-certificates \
    chromium \
    chromium-driver \
    libssl1.1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -u 1000 appuser

# Set working directory
WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/target/release/mcp-server /app/mcp-server

# Copy .env.example as template
COPY .env.example /app/.env.example

# Change ownership to appuser
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Set environment variables
ENV RUST_LOG=mcp_server=info,tower_http=info
ENV PORT=8080
# Chromium flags for running in container
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROMIUM_FLAGS="--no-sandbox --disable-dev-shm-usage --disable-gpu"

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run the binary
CMD ["/app/mcp-server"]
