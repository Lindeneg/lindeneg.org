#!/usr/bin/env bash

set -e

# only regenerable output: env files and the dev database in data/ are kept
targets=(
    node_modules
    dist
    src/generated
    data/test
)

for target in "${targets[@]}"; do
    if [ -e "$target" ]; then
        echo "removing $target"
        rm -rf "$target"
    fi
done

echo "clean, run"
echo "npm run bootstrap"
echo "to set the project up again"

exit 0
