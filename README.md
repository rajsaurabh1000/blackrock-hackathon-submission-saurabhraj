# Blackrock Challenge – Auto-Saving Retirement API

Production-style APIs for expense-based micro-investments: parse expenses, validate transactions, apply q/p/k period rules, and compute NPS and Index fund returns.

---

## Submission

This repository (default branch) contains everything required for evaluation:

- **Source code** in `src/` (server, routes, lib)
- **Dockerfile** and **compose.yaml** for containerized run
- **Test automation**: `npm test` runs unit/logic tests and, when the server is reachable, API integration tests
- **README.md** with configuration, run, and test instructions below

The repository must be **public** and accessible without extra permissions. Changes after the challenge deadline are not considered.

---

## Repository contents (default branch)

| Item | Location |
|------|----------|
| Source code | `src/` (server, routes, lib) |
| Dockerfile | `Dockerfile` (Node 20 Bookworm Slim) |
| Docker Compose | `compose.yaml` |
| Test automation | `test/run-all.js` (unit + logic), `test/api-test.js` (HTTP API) |
| This README | `README.md` |

---

## Requirements and dependencies

- **Node.js** ≥ 18 (recommended: 20 LTS)
- **npm** (comes with Node)
- **Docker** and **Docker Compose** (optional, for containerized run)

**Runtime dependency:** `express` only. No database or external services; the app is self-contained.

---

## Configuration

- **Port:** Set `PORT` (default `5477`). Used by the server and by Docker.
- **Request size:** JSON body limit is 10 MB (configurable in `src/server.js`).

Example:

```bash
export PORT=5477
```

---

## How to run

### 1. Local (development)

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Server listens on **http://localhost:5477** (or the port set in `PORT`).

### 2. Docker (single image)

```bash
# Build image (replace with your preferred tag)
docker build -t blk-hacking-ind-name-lastname .

# Run container
docker run -d -p 5477:5477 blk-hacking-ind-name-lastname
```

### 3. Docker Compose

```bash
docker compose up -d
```

Container exposes port **5477**; map it with `-p 5477:5477` if you override the default.

---

## How to test

### Run all tests (recommended)

```bash
npm test
```

This runs:

1. **Unit / logic tests** (`test/run-all.js`): parse, filter (q/p/k), NPS and Index returns against the challenge example (4 expenses, full-year amount 145, expected profits/returns).
2. **API integration tests** (`test/api-test.js`): HTTP calls to the running server. If the server is not running, the API tests are skipped and the exit code is still 0 so CI can run `npm test` without starting the server.

### Test with server running (full API coverage)

```bash
# Terminal 1
npm start

# Terminal 2
npm test
node test/api-test.js
```

If the server is already running on the default port, `node test/api-test.js` will exercise all documented endpoints and the health check.

### Test inside Docker

```bash
docker build -t blk-hacking-ind-name-lastname .
docker run --rm blk-hacking-ind-name-lastname node test/run-all.js
```

---

## API endpoints

Base path: **`/blackrock/challenge/v1`**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness/readiness (returns `{ "status": "ok" }`). Not under `/blackrock/challenge/v1`. |
| POST | `/transactions/parse` | Parse expenses → transactions (ceiling, remanent) |
| POST | `/transactions/validator` | Validate by wage and max invest; valid/invalid/duplicate |
| POST | `/transactions/filter` | Apply q, p periods; return valid/invalid transactions |
| POST | `/returns/nps` | NPS returns (7.11%, tax benefit) by k periods |
| POST | `/returns/index` | Index fund returns (14.49%, inflation-adjusted) by k periods |
| GET | `/performance` | Response time, memory, threads |

### 1. Parse – `POST /blackrock/challenge/v1/transactions/parse`

**Request body:**

```json
{
  "expenses": [
    { "timestamp": "2023-10-12 20:15:00", "amount": 250 },
    { "date": "2023-02-28 15:49:00", "amount": 375 }
  ]
}
```

**Response:** `transactions` (date, amount, ceiling, remanent), `totalInvested`, `totalRemanent`, `totalExpense`.

### 2. Validator – `POST /blackrock/challenge/v1/transactions/validator`

**Request body:**

```json
{
  "wage": 50000,
  "transactions": [
    { "date": "2023-10-12 20:15:00", "amount": 250, "ceiling": 300, "remanent": 50 }
  ]
}
```

**Response:** `valid`, `invalid`, `duplicate`.

### 3. Filter – `POST /blackrock/challenge/v1/transactions/filter`

**Request body:**

```json
{
  "q": [{ "fixed": 0, "start": "2023-07-01 00:00:00", "end": "2023-07-31 23:59:00" }],
  "p": [{ "extra": 25, "start": "2023-10-01 08:00:00", "end": "2023-12-31 19:59:00" }],
  "k": [{ "start": "2023-01-01 00:00:00", "end": "2023-12-31 23:59:00" }],
  "transactions": [ ... ]
}
```

**Response:** `valid` (transactions with effective remanent after q and p), `invalid`.

### 4. Returns NPS – `POST /blackrock/challenge/v1/returns/nps`

**Request body:** `age`, `wage`, `inflation` (optional), `q`, `p`, `k`, `transactions`.

**Response:** `transactionsTotalAmount`, `transactionsTotalCeiling`, `savingsByDates` (per k: start, end, amount, profits, taxBenefit).

### 5. Returns Index – `POST /blackrock/challenge/v1/returns/index`

**Request body:** `age`, `inflation` (optional), `q`, `p`, `k`, `transactions`.

**Response:** `transactionsTotalAmount`, `transactionsTotalCeiling`, `savingsByDates` (per k: start, end, amount, return).

### 6. Performance – `GET /blackrock/challenge/v1/performance`

**Response:** `time` (HH:mm:ss.SSS), `memory` (e.g. "XX.XX MB"), `threads`.

---

## Timestamp format

All dates use **`YYYY-MM-DD HH:mm:ss`** (e.g. `2023-10-12 20:15:00`). Ranges are inclusive (start and end).

---

## Design and security notes

- **Input validation:** Request bodies and numeric inputs are validated; invalid payloads return 400 with a clear `error` message.
- **No user input in paths or commands:** Only static routes and in-memory logic; no `eval`, dynamic `require`, or shell execution.
- **Secrets:** No hardcoded secrets; use environment variables for any future configuration.
- **Docker:** Image is based on `node:20-bookworm-slim`; can be run as non-root by adjusting the Dockerfile if required.
- **Health check:** `GET /health` is provided for orchestration and load balancers.

---

## License

MIT.
