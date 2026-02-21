# Blackrock Challenge – Self-saving for your retirement

Production-grade APIs for expense-based micro-investments: parse expenses into transactions, validate by wage and max investment, apply q/p/k temporal rules, and compute NPS (7.11%) and Index fund (14.49%) returns with inflation adjustment.

---

## Repository contents (default branch)

| Item | Location |
|------|----------|
| Source code | `src/` (server, routes, lib, config) |
| Dockerfile | `Dockerfile` |
| Compose | `compose.yaml` |
| Test automation | `test/run-all.js`, `test/api-test.js` |
| README | This file |

Public repository and public container image required for submission. No repository changes after the challenge deadline.

---

## Requirements

- **Node.js** ≥ 18 (recommended: 20 LTS)
- **npm** (included with Node.js)
- **Docker** and **Docker Compose** (optional; for containerized run and pre-built image)

**Runtime:** Single dependency `express`. No database or external services; the application is self-contained.

---

## Configure

- **Port:** Set `PORT` to the port the server will listen on. Default: `5477`.
- **Request body size:** JSON body limit is 10 MB (configurable in `src/config.js`).

Example:

```bash
export PORT=5477
```

---

## Run

### Local (development)
```bash
npm install
npm start
```

Server listens on **http://localhost:5477** (or the value of `PORT`).

### Docker (pre-built image, amd64 + arm64)

```bash
docker pull ghcr.io/rajsaurabh1000/blackrock-hackathon-saurabhraj:latest
docker run -d -p 5477:5477 ghcr.io/rajsaurabh1000/blackrock-hackathon-saurabhraj:latest
```

To build from source instead: `docker build -t blackrock-challenge .` then `docker run -d -p 5477:5477 blackrock-challenge`.

### Docker Compose

```bash
docker compose up -d
```

See **DOCKER.md** for more options (port mapping, running tests inside the container).

---

## Test

All tests live under the `test/` directory. Each test file includes a header comment with: **Test type**, **Validation**, and **Command** (as per challenge requirements).

### Run all tests

```bash
npm test
```

- **Unit / logic** (`test/run-all.js`): parse, filter, NPS/Index against challenge example (4 expenses, full-year 145).
- **API** (`test/api-test.js`): HTTP against running server; skipped if server is down (exit 0).

1. **Unit / logic tests** (`test/run-all.js`): parse, filter (q/p/k), NPS and Index returns against the challenge PDF example (4 expenses, full-year amount 145, expected profits and return).
2. **API integration tests** (`test/api-test.js`): HTTP requests to all endpoints. If the server is not reachable, API tests are skipped and the process exits with code 0 so CI does not fail.

### Run with server (full API coverage)

**Tests inside Docker:**

```bash
docker run --rm ghcr.io/rajsaurabh1000/blackrock-hackathon-saurabhraj:latest node test/run-all.js
```

**Run with server (full API coverage):**

```bash
# Terminal 1
npm start

# Terminal 2
npm test
node test/api-test.js
```

---

## Deployment (challenge requirements)

- **Container:** Application runs on **port 5477** inside the container.
- **Port mapping:** `-p 5477:5477` (host:container).
- **Dockerfile:** First lines contain the pull and run commands for the published image (`ghcr.io/rajsaurabh1000/blackrock-hackathon-saurabhraj:latest`). Base image is Linux (Debian Bookworm Slim) with selection criteria noted in the Dockerfile.
- **Compose:** `compose.yaml` defines the service and can be run with `docker compose up -d`. No external services required.

---

## API

Base path: **`/blackrock/challenge/v1`**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | API overview (name, base path, endpoints) |
| GET | `/health` | Liveness: `{ "status": "ok" }` |
| POST | `/transactions/parse` | Expenses → transactions (ceiling, remanent) |
| POST | `/transactions/validator` | Validate by wage → valid, invalid, duplicate |
| POST | `/transactions/filter` | Apply q, p → valid, invalid |
| POST | `/returns/nps` | NPS returns (7.11%, tax benefit) by k periods |
| POST | `/returns/index` | Index returns (14.49%, inflation-adjusted) by k periods |
| GET | `/performance` | Uptime (HH:mm:ss.SSS), memory (MB), threads |

**Timestamp format:** `YYYY-MM-DD HH:mm:ss`. All period ranges are inclusive (start and end).

### Example: parse

```bash
curl -X POST http://localhost:5477/blackrock/challenge/v1/transactions/parse \
  -H "Content-Type: application/json" \
  -d '{"expenses":[{"date":"2023-10-12 20:15:00","amount":250}]}'
```

### Example: validator

Request body: `wage` (number), optional `maxAmountToInvest`, `transactions` (array of `{ date, amount, ceiling, remanent }`).  
Response: `valid`, `invalid`, `duplicate`.

### Example: filter

Request body: `q` (fixed-amount periods), `p` (extra-amount periods), `k` (evaluation periods), `transactions`.  
Response: `valid`, `invalid` (transactions with effective remanent after q and p).

### Returns (NPS / Index)

- **NPS:** Body: `age`, `wage`, optional `inflation`, `q`, `p`, `k`, `transactions`. Response: `transactionsTotalAmount`, `transactionsTotalCeiling`, `savingsByDates` (per k: start, end, amount, profits, taxBenefit).
- **Index:** Body: `age`, optional `inflation`, `q`, `p`, `k`, `transactions`. Response: `transactionsTotalAmount`, `transactionsTotalCeiling`, `savingsByDates` (per k: start, end, amount, return).

---

## Design and security

- **Validation:** All request bodies and numeric inputs are validated; invalid payloads return 400 with a clear `error` message.
- **No unsafe patterns:** No user input in file paths or shell commands; no `eval` or dynamic `require`.
- **Secrets:** No hardcoded credentials; use environment variables for any sensitive configuration.
- **Docker:** Base image `node:20-bookworm-slim` (Linux, LTS). Graceful shutdown on SIGTERM/SIGINT for container orchestration.

---

## Contributors

- [Saurabh Raj](https://github.com/rajsaurabh1000)

