# syntax=docker/dockerfile:1

FROM node:22-bookworm AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY index.html vite.config.ts ./
COPY public ./public
COPY src ./src
RUN npm ci && npm run build

FROM node:22-bookworm AS server
WORKDIR /app/server
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/src ./src
COPY server/tsconfig.json ./
COPY --from=frontend /app/dist /app/dist

ENV NODE_ENV=production
ENV STATIC_DIR=/app/dist
ENV DATABASE_PATH=/data/vandrounik.sqlite
ENV PORT=8787

EXPOSE 8787
CMD ["npm", "run", "start"]
