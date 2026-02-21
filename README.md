# Blackrock Challenge – Self-saving for your retirement

A REST API that supports automated retirement savings through expense-based micro-investments. It parses expenses into rounded transactions, validates them against wage and investment limits, applies temporal rules (q, p, and k periods), and computes returns for both **NPS** (7.11% with tax benefit) and **Index fund** (14.49%, inflation-adjusted).

---

## What’s in this repository

| Item | Location |
|------|----------|
| Source code | `src/` (server, routes, lib, config) |
| Dockerfile | `Dockerfile` |
| Compose | `compose.yaml` |
| Tests | `test/run-all.js`, `test/api-test.js` |
| Documentation | This file |

The repository and its container image are intended to be **public** for submission. No changes should be made after the challenge deadline.

---

## Requirements

- **Node.js** ≥ 18 (20 LTS recommended)
- **npm** (bundled with Node.js)
- **Docker** and **Docker Compose** (optional; for running the pre-built image or building locally)

**Runtime:** The only dependency is **express**. There is no database or other external service; the app is self-contained.

---

## Configuration

- **Port** — The server listens on the port given by the `PORT` environment variable. Default: **5477**.
- **Request body size** — JSON payloads are limited to 10 MB (see `src/config.js` to change this).

Example:

```bash
export PORT=5477
```

---

## Running the application

### Locally

```bash
npm install
npm start
```

The server will be available at **http://localhost:5477** (or the port you set via `PORT`).

### Docker (pre-built image)

The image supports **linux/amd64** and **linux/arm64** and is published on GitHub Container Registry:

```bash
docker pull ghcr.io/rajsaurabh1000/blackrock-hackathon-saurabhraj:latest
docker run -d -p 5477:5477 ghcr.io/rajsaurabh1000/blackrock-hackathon-saurabhraj:latest
```

To build the image yourself: `docker build -t blackrock-challenge .` then `docker run -d -p 5477:5477 blackrock-challenge`.

### Docker Compose

From the repository root:

```bash
docker compose up -d
```

For more options (e.g. port mapping, running tests inside the container), see **DOCKER.md**.

---

## Testing

Tests are in the `test/` directory. Each test file documents **test type**, **validation**, and **command** in a header comment, as required by the challenge.

### Run the full test suite

```bash
npm test
```

This executes:

1. **Unit / logic tests** (`test/run-all.js`) — Parse, filter (q/p/k), and return calculations against the challenge example (4 expenses, full-year amount 145, expected NPS profits and Index return).
2. **API integration tests** (`test/api-test.js`) — HTTP calls to all endpoints. If the server is not running, API tests are skipped and the process exits successfully so CI can run without a live server.

### Full API coverage (with server running)

In one terminal, start the server; in another, run:

```bash
npm test
node test/api-test.js
```

### Unit tests inside Docker

```bash
docker run --rm ghcr.io/rajsaurabh1000/blackrock-hackathon-saurabhraj:latest node test/run-all.js
```

---

## Deployment (challenge requirements)

- **Container** — The application listens on **port 5477** inside the container.
- **Port mapping** — Use `-p 5477:5477` (host:container).
- **Dockerfile** — The first lines document the pull and run commands for the published image (`ghcr.io/rajsaurabh1000/blackrock-hackathon-saurabhraj:latest`). The base image is Linux (Debian Bookworm Slim); the Dockerfile comments explain the choice.
- **Compose** — `compose.yaml` defines the service; run it with `docker compose up -d`. No external services are required.

---

## API reference

All challenge endpoints are under the base path **`/blackrock/challenge/v1`**.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | API overview (name, base path, list of endpoints) |
| GET | `/health` | Liveness check; returns `{ "status": "ok" }` |
| POST | `/transactions/parse` | Convert expenses into transactions (ceiling and remanent) |
| POST | `/transactions/validator` | Validate transactions by wage; returns valid, invalid, and duplicate |
| POST | `/transactions/filter` | Apply q and p periods; returns valid and invalid transactions |
| POST | `/returns/nps` | NPS returns (7.11%, tax benefit) per k period |
| POST | `/returns/index` | Index fund returns (14.49%, inflation-adjusted) per k period |
| GET | `/performance` | Uptime (HH:mm:ss.SSS), memory (MB), and thread count |

**Timestamps** — Use the format `YYYY-MM-DD HH:mm:ss`. All period ranges are **inclusive** (start and end).

### Example: parse

```bash
curl -X POST http://localhost:5477/blackrock/challenge/v1/transactions/parse \
  -H "Content-Type: application/json" \
  -d '{"expenses":[{"date":"2023-10-12 20:15:00","amount":250}]}'
```

### Validator

**Request:** `wage` (number), optional `maxAmountToInvest`, and `transactions` (array of `{ date, amount, ceiling, remanent }`).  
**Response:** `valid`, `invalid`, and `duplicate` arrays.

### Filter

**Request:** `q` (fixed-amount periods), `p` (extra-amount periods), `k` (evaluation periods), and `transactions`.  
**Response:** `valid` and `invalid`; valid entries include the effective remanent after applying q and p.

### Returns (NPS and Index)

- **NPS** — Request: `age`, `wage`, optional `inflation`, `q`, `p`, `k`, `transactions`. Response: `transactionsTotalAmount`, `transactionsTotalCeiling`, and `savingsByDates` (per k: start, end, amount, profits, taxBenefit).
- **Index** — Request: `age`, optional `inflation`, `q`, `p`, `k`, `transactions`. Response: `transactionsTotalAmount`, `transactionsTotalCeiling`, and `savingsByDates` (per k: start, end, amount, return).

---

## Commands

Run the server first (`npm start`), then in another terminal set `BASE` and paste these commands in order.

```bash
export BASE="http://localhost:5477/blackrock/challenge/v1"
```

```bash
curl -s $BASE/ | jq
curl -s $BASE/health | jq
```

## Parse
```bash
curl -s -X POST "$BASE/transactions/parse" \
  -H "Content-Type: application/json" \
  -d '{
    "expenses": [
      {"date": "2023-10-12 20:15:00", "amount": 250},
      {"date": "2023-02-28 15:49:00", "amount": 375},
      {"date": "2023-07-01 21:59:00", "amount": 620},
      {"date": "2023-12-17 08:09:00", "amount": 480}
    ]
  }' | jq
```
## Validator
```bash
curl -s -X POST "$BASE/transactions/validator" \
  -H "Content-Type: application/json" \
  -d '{
    "wage": 5000,
    "transactions": [
      {"date": "2023-10-12 20:15:00", "amount": 250, "ceiling": 250, "remanent": 0},
      {"date": "2023-02-28 15:49:00", "amount": 375, "ceiling": 375, "remanent": 25},
      {"date": "2023-07-01 21:59:00", "amount": 620, "ceiling": 625, "remanent": 75},
      {"date": "2023-12-17 08:09:00", "amount": 480, "ceiling": 500, "remanent": 75}
    ]
  }' | jq
```
## Filter
```bash
curl -s -X POST "$BASE/transactions/filter" \
  -H "Content-Type: application/json" \
  -d '{
    "q": [{"fixed": 0, "start": "2023-07-01 00:00:00", "end": "2023-07-31 23:59:00"}],
    "p": [{"extra": 25, "start": "2023-10-01 08:00:00", "end": "2023-12-31 19:59:00"}],
    "k": [
      {"start": "2023-03-01 00:00:00", "end": "2023-11-30 23:59:00"},
      {"start": "2023-01-01 00:00:00", "end": "2023-12-31 23:59:00"}
    ],
    "transactions": [
      {"date": "2023-10-12 20:15:00", "amount": 250, "ceiling": 250, "remanent": 0},
      {"date": "2023-02-28 15:49:00", "amount": 375, "ceiling": 375, "remanent": 25},
      {"date": "2023-07-01 21:59:00", "amount": 620, "ceiling": 625, "remanent": 75},
      {"date": "2023-12-17 08:09:00", "amount": 480, "ceiling": 500, "remanent": 75}
    ]
  }' | jq
```
## NPS
```bash
curl -s -X POST "$BASE/returns/nps" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 30,
    "wage": 5000,
    "q": [{"fixed": 0, "start": "2023-07-01 00:00:00", "end": "2023-07-31 23:59:00"}],
    "p": [{"extra": 25, "start": "2023-10-01 08:00:00", "end": "2023-12-31 19:59:00"}],
    "k": [
      {"start": "2023-03-01 00:00:00", "end": "2023-11-30 23:59:00"},
      {"start": "2023-01-01 00:00:00", "end": "2023-12-31 23:59:00"}
    ],
    "transactions": [
      {"date": "2023-10-12 20:15:00", "amount": 250, "ceiling": 250, "remanent": 0},
      {"date": "2023-02-28 15:49:00", "amount": 375, "ceiling": 375, "remanent": 25},
      {"date": "2023-07-01 21:59:00", "amount": 620, "ceiling": 625, "remanent": 75},
      {"date": "2023-12-17 08:09:00", "amount": 480, "ceiling": 500, "remanent": 75}
    ]
  }' | jq
```
## Index
```bash
curl -s -X POST "$BASE/returns/index" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 30,
    "q": [{"fixed": 0, "start": "2023-07-01 00:00:00", "end": "2023-07-31 23:59:00"}],
    "p": [{"extra": 25, "start": "2023-10-01 08:00:00", "end": "2023-12-31 19:59:00"}],
    "k": [
      {"start": "2023-03-01 00:00:00", "end": "2023-11-30 23:59:00"},
      {"start": "2023-01-01 00:00:00", "end": "2023-12-31 23:59:00"}
    ],
    "transactions": [
      {"date": "2023-10-12 20:15:00", "amount": 250, "ceiling": 250, "remanent": 0},
      {"date": "2023-02-28 15:49:00", "amount": 375, "ceiling": 375, "remanent": 25},
      {"date": "2023-07-01 21:59:00", "amount": 620, "ceiling": 625, "remanent": 75},
      {"date": "2023-12-17 08:09:00", "amount": 480, "ceiling": 500, "remanent": 75}
    ]
  }' | jq
```
## Performance
```bash
curl -s $BASE/performance | jq
```

---

## System design

### Architecture

- **Layered structure** — HTTP layer (`server.js`, `routes/`) handles requests and validation; business logic lives in `lib/` (parse, validator, filter, returns, dates). Routes delegate to lib functions and return JSON. No business logic in route handlers.
- **Stateless API** — No server-side session or in-memory state between requests. Each request is independent; the service can be scaled horizontally behind a load balancer.
- **Single process** — One Node process per container; no database or external service calls, so there are no outbound I/O retries inside the app.

### Design patterns

- **Router-per-resource** — Express routers are split by domain: `transactions` (parse, validator, filter), `returns` (nps, index), `performance`. Mounted under a versioned base path (`/blackrock/challenge/v1`).
- **Centralized configuration** — Port and body limit come from `src/config.js`; env-based (e.g. `PORT`) with safe defaults. Keeps tunables in one place and avoids hardcoded values.
- **Global middleware** — `express.json()` with a configurable body size limit to protect against large payloads; applied before any route.
- **Central error handling** — A 404 handler returns JSON for unknown paths; a global error handler returns 500 with a JSON `error` message. Validation errors are returned as 400 with a clear message from the route.

### Retry and resilience

- **Idempotent endpoints** — All POST endpoints are deterministic: the same request body produces the same response. Clients can safely retry on network failure or timeouts without duplicate side effects (there are no server-side side effects like writes).
- **Client-side retry** — The API does not call external services, so there is no server-side retry logic. Integrators and clients should implement retries (e.g. exponential backoff) for transient failures when calling this API. Use `GET /health` or `GET /blackrock/challenge/v1/health` for liveness before or between retries.
- **Graceful shutdown** — On SIGTERM/SIGINT the server stops accepting new connections, closes the HTTP server, then exits. A 10s timeout forces exit if shutdown hangs. Suitable for orchestrated environments (e.g. Kubernetes, Docker).

### Operability

- **Health and performance** — `GET /health` (and versioned `/blackrock/challenge/v1/health`) for liveness; `GET /blackrock/challenge/v1/performance` for uptime, memory, and thread count. Supports readiness/liveness probes and basic monitoring.
- **Port conflict** — If the configured port is in use (EADDRINUSE), the process logs a clear message and exits with code 1 instead of binding to a different port.

### Scalability

- **Horizontal scaling** — Stateless design allows running multiple instances behind a load balancer; no shared in-process state.
- **No external dependencies** — No database or third-party APIs, so availability and latency are not tied to external retries or connection pools.

---

## Design and security

- **Input validation** — Request bodies and numeric fields are validated; invalid input returns **400** with a clear `error` message.
- **Safe usage** — No user input is used in file paths or shell commands; no `eval` or dynamic `require`.
- **Secrets** — No credentials are hardcoded; use environment variables for any sensitive configuration.
- **Docker** — Base image is `node:20-bookworm-slim` (Linux, LTS). The process handles SIGTERM and SIGINT for graceful shutdown in container environments.

---

## Contributors

- [Saurabh Raj](https://github.com/rajsaurabh1000)

