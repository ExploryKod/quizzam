# Aligné sur package.json > packageManager (pnpm@9.9.0).

# Development stage
FROM node:20 AS development
ARG PNPM_VERSION=9.9.0
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /usr/src/app
COPY pnpm-lock.yaml ./
RUN pnpm fetch --prod
COPY . .
RUN pnpm install
USER node

# Build stage
FROM node:20 AS build
ARG PNPM_VERSION=9.9.0
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /usr/src/app
COPY pnpm-lock.yaml ./
COPY --from=development /usr/src/app/node_modules ./node_modules
COPY . .
RUN pnpm build
ENV NODE_ENV=production
RUN pnpm install --prod
USER node

# Production stage
FROM node:20-alpine AS production
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/views ./views
COPY --from=build /usr/src/app/static ./static
CMD ["node", "dist/main.js"]
