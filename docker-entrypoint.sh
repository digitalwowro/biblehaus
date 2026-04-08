#!/bin/sh
set -e

echo "Running database migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Ensuring default admin user exists..."
node prisma/seed.mjs

echo "Starting server..."
exec node server.js
