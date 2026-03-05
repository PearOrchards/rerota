#!/bin/sh
set -e # Fail immediately if any command returns non-zero status

echo "Running database migrations..."
npx prisma migrate deploy

echo "Firing up the Next.js server..."
exec node server.js