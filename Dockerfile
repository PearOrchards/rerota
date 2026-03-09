FROM node:24-alpine AS builder

# Build
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY . .
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV JWT_ENC_KEY="7f0954fadf6a7e8d1a690b87ebf818cc87857bbc68e3a86d30c333fe2361b0fe"
RUN npm ci && npx prisma generate && npm run build

# Run lean app
FROM node:24-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3000
CMD ["./entrypoint.sh"]