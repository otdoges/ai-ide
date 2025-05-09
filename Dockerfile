# Dockerfile for ai-ide
FROM node:20-bullseye as frontend
WORKDIR /app
COPY package*.json ./
COPY bun.lock ./
COPY pnpm-lock.yaml ./
COPY . .
RUN npm install -g bun pnpm && pnpm install && pnpm build

FROM rust:1.77 as cli
WORKDIR /cli
COPY cli ./cli
RUN cd cli && cargo build --release

FROM node:20-bullseye as final
WORKDIR /app
COPY --from=frontend /app/dist ./dist
COPY --from=cli /cli/cli/target/release/ai_ide_cli /usr/local/bin/ai_ide_cli
CMD ["node", "dist/main.js"]
