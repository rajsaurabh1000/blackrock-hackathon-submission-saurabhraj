# Docker – Blackrock Challenge API

Run the API in a container. Application listens on **port 5477** inside the container; use `-p 5477:5477` for host mapping.

---

## Pre-built image (recommended)

Multi-platform image (linux/amd64, linux/arm64) from GitHub Container Registry:

```bash
docker pull ghcr.io/rajsaurabh1000/blackrock-hackathon-saurabhraj:latest
docker run -d -p 5477:5477 ghcr.io/rajsaurabh1000/blackrock-hackathon-saurabhraj:latest
```

- **Image:** [ghcr.io/rajsaurabh1000/blackrock-hackathon-saurabhraj](https://github.com/users/rajsaurabh1000/packages/container/package/blackrock-hackathon-saurabhraj)
- **Port:** App listens on 5477 inside the container. Use `-p 5477:5477` or e.g. `-p 8080:5477` to expose on another host port.

---

## Build from source

```bash
docker build -t blackrock-challenge .
docker run -d -p 5477:5477 blackrock-challenge
```

---

## Docker Compose

From the repo root:

```bash
docker compose up -d
```

Uses `compose.yaml` (builds from Dockerfile, exposes 5477).

---

## Test inside the container

Unit tests (no server needed):

```bash
docker run --rm ghcr.io/rajsaurabh1000/blackrock-hackathon-saurabhraj:latest node test/run-all.js
```

Or with a locally built image:

```bash
docker run --rm blackrock-challenge node test/run-all.js
```

---

## Verify

```bash
curl http://localhost:5477/health
# {"status":"ok"}
```

---

## Troubleshooting

- **Port already in use:** Stop the process using 5477 (`lsof -i :5477` then `kill <PID>`) or run with a different host port, e.g. `docker run -d -p 5478:5477 ...` and use `http://localhost:5478`.
- **Docker daemon not running:** Start Docker Desktop (or your Docker daemon) and retry.
