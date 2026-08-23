# Optional: native binary + ExifTool for a Linux server.
# Default path is still the per-OS Release binary (no Docker required).
FROM rust:1-bookworm AS build
WORKDIR /src
COPY . .
RUN cargo build --release --bin metapeek

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates libimage-exiftool-perl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /src/target/release/metapeek /usr/local/bin/metapeek
EXPOSE 5173
ENTRYPOINT ["metapeek"]
CMD ["serve", "--host", "0.0.0.0", "--port", "5173"]
