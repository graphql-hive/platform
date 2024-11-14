#/bin/bash

npm_version=$(node -p "require('./package.json').version")
cargo install set-cargo-version
set-cargo-version ./Cargo.toml $npm_version
