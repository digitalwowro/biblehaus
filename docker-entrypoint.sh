#!/bin/sh
set -e

echo "Waiting for database..."
node - <<'EOF'
const net = require("net");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const { hostname, port } = new URL(databaseUrl);
const maxAttempts = 30;
let attempt = 0;

function tryConnect() {
  attempt += 1;
  const socket = net.createConnection({
    host: hostname,
    port: Number(port || 5432),
  });

  socket.setTimeout(2000);

  socket.on("connect", () => {
    socket.end();
    process.exit(0);
  });

  const retry = () => {
    socket.destroy();
    if (attempt >= maxAttempts) {
      console.error(`Database not reachable after ${maxAttempts} attempts`);
      process.exit(1);
    }
    setTimeout(tryConnect, 2000);
  };

  socket.on("error", retry);
  socket.on("timeout", retry);
}

tryConnect();
EOF

echo "Running database migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Ensuring default admin user exists..."
./node_modules/.bin/tsx prisma/seed.ts

echo "Starting server..."
exec node server.js
