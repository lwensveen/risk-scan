FROM oven/bun:1.1-alpine as base
WORKDIR /app
COPY bun.lock bun.lock
COPY package.json turbo.json ./
COPY packages ./packages
COPY apps ./apps
RUN bun install --frozen-lockfile

CMD ["bunx", "turbo", "run", "--filter=apps/api", "start"]
