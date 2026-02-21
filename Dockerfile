# Build: docker build -t blackrock-challenge .
# Pre-built: ghcr.io/rajsaurabh1000/blackrock-hackathon-saurabhraj:latest
FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src
COPY test ./test

EXPOSE 5477

CMD ["node", "src/server.js"]
