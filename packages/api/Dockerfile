# Fully static musl build — no runtime dependency issues
FROM rust:latest AS builder

RUN apt-get update && apt-get install -y musl-tools pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
RUN rustup target add x86_64-unknown-linux-musl

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN OPENSSL_DIR=/usr cargo build --release --target x86_64-unknown-linux-musl 2>/dev/null || true
RUN rm -rf src

COPY src/ src/
RUN OPENSSL_DIR=/usr cargo build --release --target x86_64-unknown-linux-musl

# Minimal runtime — static binary needs nothing
FROM alpine:latest

RUN apk add --no-cache ca-certificates

WORKDIR /app
COPY --from=builder /app/target/x86_64-unknown-linux-musl/release/reentry-api /app/reentry-api
COPY data/ /app/data/

ENV PORT=8080
ENV ENVIRONMENT=production
EXPOSE 8080

CMD ["/app/reentry-api"]
