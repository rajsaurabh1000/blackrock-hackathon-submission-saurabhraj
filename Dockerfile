# Build: docker build -t blk-hacking-ind-name-lastname .
# Base: Debian Bookworm - LTS, minimal footprint, secure defaults (non-root capable)
FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src
COPY test ./test

EXPOSE 5477

CMD ["node", "src/server.js"]
