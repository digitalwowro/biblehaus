#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding default admin user..."
node prisma/seed.mjs

echo "Starting server..."
exec node server.js
