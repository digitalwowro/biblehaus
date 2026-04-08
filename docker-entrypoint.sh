#!/bin/sh
set -e

echo "Running database migrations..."
./node_modules/.bin/prisma migrate deploy

if [ -n "$ADMIN_SEED_EMAIL" ] && [ -n "$ADMIN_SEED_PASSWORD" ]; then
  echo "Seeding admin user..."
  node prisma/seed.mjs
else
  echo "Skipping admin seed."
fi

echo "Starting server..."
exec node server.js
