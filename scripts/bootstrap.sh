#!/usr/bin/env bash

set -e

copy_env() {
    local src="$PWD/$1"
    local dest="$PWD/$2"
    if [ -f "$dest" ]; then
        echo "skipping $2, reusing existing file"
    else
        echo "creating $2 from $1"
        cp "$src" "$dest"
    fi
}

echo "bootstrapping local development environment"
copy_env .env.example .env.local
copy_env .env.test.example .env.test

echo "installing node modules"
npm i

echo "generating prisma client"
npm run db:generate

# sqlite creates the database file but not its directory
DATABASE_URL=$(set -a && source .env.local && echo "$DATABASE_URL")
mkdir -p "$(dirname "${DATABASE_URL#file:}")"

# deploy only applies pending migrations; migrate dev can prompt to reset an existing database on drift
echo "migrating database"
npx prisma migrate deploy

echo "successfully bootstrapped project"
echo "fill in SUPER_USER, JWT_SECRET (32+ characters) and the CLOUDINARY_* values in .env.local, then run"
echo "npm run dev"
echo "to start the server"

exit 0
