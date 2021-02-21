FROM docker.io/resilio/sync AS rslsync



FROM docker.io/ekidd/rust-musl-builder as builder

WORKDIR /home/rust

# cargo needs a dummy src/main.rs to detect bin mode
RUN mkdir -p src && echo "fn main() {}" > src/main.rs

COPY Cargo.toml Cargo.lock ./
RUN cargo build --release

# We need to touch our real main.rs file or else docker will use
# the cached one.
COPY . ./
RUN sudo touch src/main.rs

RUN cargo build --release

# Size optimization
RUN strip target/x86_64-unknown-linux-musl/release/resilio-sync-watch-config



# Start building the final image
FROM docker.io/library/debian:buster
WORKDIR /
VOLUME /folders
VOLUME /.resilio-sync-watch-config

RUN ln -sf /run/secrets/share.txt .
COPY --from=rslsync /usr/bin/rslsync /usr/bin/
COPY --from=builder /home/rust/target/x86_64-unknown-linux-musl/release/resilio-sync-watch-config /usr/bin/

ENTRYPOINT ["resilio-sync-watch-config"]
CMD ["single"]
