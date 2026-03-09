#!/bin/sh
set -e # Fail immediately if any command returns non-zero status

cd /app

echo "Running database migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Firing up the Next.js server..."
exec node server.js
