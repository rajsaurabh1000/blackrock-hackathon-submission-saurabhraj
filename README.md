# Blackrock Challenge – Auto-Saving Retirement API

REST API for expense-based micro-investments: parse expenses into transactions, validate by wage, filter by q/p/k periods, and compute NPS and Index fund returns.

---

## Quick start

**Local (Node.js)**  
```bash
npm install && npm start
```

**Docker (pre-built image, amd64 + arm64)**  
```bash
docker pull ghcr.io/rajsaurabh1000/blackrock-hackathon-saurabhraj:latest
docker run -d -p 5477:5477 ghcr.io/rajsaurabh1000/blackrock-hackathon-saurabhraj:latest
```

Server: **http://localhost:5477** · Health: **http://localhost:5477/health**

---

## Submission

This repo contains everything required for evaluation:

| Item | Location |
|------|----------|
| Source code | `src/` |
| Dockerfile | `Dockerfile` |
| Compose | `compose.yaml` |
| Tests | `test/run-all.js`, `test/api-test.js` |

Public repo and public Docker image (GHCR). No changes after deadline.

---

## Requirements

- **Node.js** ≥ 18 (recommended 20)
- **npm**
- **Docker** (optional, for container run)

Single runtime dependency: **express**. No database or external services.

---

## Configuration

- **Port:** `PORT` (default `5477`)
- **Body limit:** 10 MB (in `src/server.js`)

```bash
export PORT=5477
```

---

## Run

### Local
```bash
npm install
npm start
```

### Docker (build locally)
```bash
docker build -t blackrock-challenge .
docker run -d -p 5477:5477 blackrock-challenge
```

### Docker Compose
```bash
docker compose up -d
```

See **[DOCKER.md](DOCKER.md)** for more Docker options (pre-built image, testing in container).

---

## Test

```bash
npm test
```

- **Unit / logic** (`test/run-all.js`): parse, filter, NPS/Index against challenge example (4 expenses, full-year 145).
- **API** (`test/api-test.js`): HTTP against running server; skipped if server is down (exit 0).

**Full API coverage:** start server in one terminal, then `npm test` and `node test/api-test.js` in another.

**Tests inside Docker:**
```bash
docker run --rm ghcr.io/rajsaurabh1000/blackrock-hackathon-saurabhraj:latest node test/run-all.js
```

---

## API

Base path: **`/blackrock/challenge/v1`**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | API overview (name, base path, endpoints) |
| GET | `/health` | `{ "status": "ok" }` |
| POST | `/transactions/parse` | Expenses → transactions (ceiling, remanent) |
| POST | `/transactions/validator` | Validate by wage → valid / invalid / duplicate |
| POST | `/transactions/filter` | Apply q, p → valid / invalid |
| POST | `/returns/nps` | NPS returns (7.11%, tax benefit) by k |
| POST | `/returns/index` | Index returns (14.49%, inflation-adjusted) by k |
| GET | `/performance` | Uptime, memory, threads |

**Timestamp format:** `YYYY-MM-DD HH:mm:ss`. Ranges inclusive.

### Example: parse
```bash
curl -X POST http://localhost:5477/blackrock/challenge/v1/transactions/parse \
  -H "Content-Type: application/json" \
  -d '{"expenses":[{"date":"2023-10-12 20:15:00","amount":250}]}'
```

### Example: validator
Body: `wage`, optional `maxAmountToInvest`, `transactions` (array of `{ date, amount, ceiling, remanent }`).  
Response: `valid`, `invalid`, `duplicate`.

### Example: filter
Body: `q` (fixed remanent periods), `p` (extra remanent periods), `k` (reporting periods), `transactions`.  
Response: `valid`, `invalid` (with effective remanent after q and p).

### Returns NPS
Body: `age`, `wage`, optional `inflation`, `q`, `p`, `k`, `transactions`.  
Response: `transactionsTotalAmount`, `transactionsTotalCeiling`, `savingsByDates` (per k: start, end, amount, profits, taxBenefit).

### Returns Index
Body: `age`, optional `inflation`, `q`, `p`, `k`, `transactions`.  
Response: `transactionsTotalAmount`, `transactionsTotalCeiling`, `savingsByDates` (per k: start, end, amount, return).

---

## Design & security

- Validated inputs; 400 + `error` for invalid payloads.
- No user input in file paths or shell; no `eval` or dynamic `require`.
- No hardcoded secrets; use env vars.
- Docker: `node:20-bookworm-slim`; port 5477.

---

## License

MIT
