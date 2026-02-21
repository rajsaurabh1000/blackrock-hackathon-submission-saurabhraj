#!/usr/bin/env node
'use strict';

/**
 * API integration tests: HTTP calls to the running server.
 * Run with server up: npm start (then in another terminal) node test/api-test.js
 * Or after npm test; if server is not reachable, skips and exits 0.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5477';
const base = (path) => `${BASE_URL}${path}`;

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    failed++;
  } else {
    console.log('OK:', msg);
  }
}

async function get(path) {
  const res = await fetch(base(path), { method: 'GET' });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (_) {
    json = null;
  }
  return { status: res.status, json, text };
}

async function post(path, body) {
  const res = await fetch(base(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (_) {
    json = null;
  }
  return { status: res.status, json, text };
}

async function run() {
  // Health
  const health = await get('/health');
  assert(health.status === 200, 'GET /health 200');
  assert(health.json && health.json.status === 'ok', 'health status ok');

  // Parse
  const parseRes = await post('/blackrock/challenge/v1/transactions/parse', {
    expenses: [
      { date: '2023-10-12 20:15:00', amount: 250 },
      { date: '2023-02-28 15:49:00', amount: 375 },
    ],
  });
  assert(parseRes.status === 200, 'POST /transactions/parse 200');
  assert(Array.isArray(parseRes.json?.transactions), 'parse returns transactions array');
  assert(parseRes.json.transactions.length === 2, 'parse 2 transactions');
  assert(typeof parseRes.json.totalRemanent === 'number', 'parse totalRemanent number');

  // Validator
  const validRes = await post('/blackrock/challenge/v1/transactions/validator', {
    wage: 50000,
    transactions: parseRes.json.transactions,
  });
  assert(validRes.status === 200, 'POST /transactions/validator 200');
  assert(Array.isArray(validRes.json?.valid), 'validator returns valid array');
  assert(Array.isArray(validRes.json?.invalid), 'validator returns invalid array');
  assert(Array.isArray(validRes.json?.duplicate), 'validator returns duplicate array');

  // Filter
  const q = [{ fixed: 0, start: '2023-07-01 00:00:00', end: '2023-07-31 23:59:00' }];
  const p = [{ extra: 25, start: '2023-10-01 08:00:00', end: '2023-12-31 19:59:00' }];
  const k = [{ start: '2023-01-01 00:00:00', end: '2023-12-31 23:59:00' }];
  const filterRes = await post('/blackrock/challenge/v1/transactions/filter', {
    q,
    p,
    k,
    transactions: parseRes.json.transactions,
  });
  assert(filterRes.status === 200, 'POST /transactions/filter 200');
  assert(Array.isArray(filterRes.json?.valid), 'filter returns valid array');
  assert(Array.isArray(filterRes.json?.invalid), 'filter returns invalid array');

  // Returns NPS
  const npsRes = await post('/blackrock/challenge/v1/returns/nps', {
    age: 29,
    wage: 50000,
    inflation: 0.055,
    q,
    p,
    k,
    transactions: parseRes.json.transactions,
  });
  assert(npsRes.status === 200, 'POST /returns/nps 200');
  assert(Array.isArray(npsRes.json?.savingsByDates), 'NPS savingsByDates array');
  assert(typeof npsRes.json?.transactionsTotalAmount === 'number', 'NPS transactionsTotalAmount');

  // Returns Index
  const idxRes = await post('/blackrock/challenge/v1/returns/index', {
    age: 29,
    inflation: 0.055,
    q,
    p,
    k,
    transactions: parseRes.json.transactions,
  });
  assert(idxRes.status === 200, 'POST /returns/index 200');
  assert(Array.isArray(idxRes.json?.savingsByDates), 'Index savingsByDates array');

  // Performance
  const perfRes = await get('/blackrock/challenge/v1/performance');
  assert(perfRes.status === 200, 'GET /performance 200');
  assert(typeof perfRes.json?.time === 'string', 'performance time string');
  assert(typeof perfRes.json?.memory === 'string', 'performance memory string');
  assert(perfRes.json?.threads === 1, 'performance threads 1');

  // Bad request (400)
  const badParse = await post('/blackrock/challenge/v1/transactions/parse', {});
  assert(badParse.status === 200, 'parse with empty expenses still 200 (valid)');
  const badValidator = await post('/blackrock/challenge/v1/transactions/validator', { wage: -1, transactions: [] });
  assert(badValidator.status === 400, 'validator invalid wage returns 400');
  assert(badValidator.json?.error, 'validator 400 has error message');
}

async function main() {
  try {
    const ping = await get('/health');
    if (ping.status !== 200) {
      console.log('Server not reachable at', BASE_URL, '- skipping API tests (exit 0).');
      process.exit(0);
    }
  } catch (err) {
    const code = err.cause?.code ?? err.code;
    if (code === 'ECONNREFUSED' || code === 'EPERM' || code === 'ENOTFOUND') {
      console.log('Server not reachable at', BASE_URL, '- skipping API tests (exit 0).');
      process.exit(0);
    }
    throw err;
  }

  await run();

  if (failed > 0) {
    console.error('API tests failed:', failed);
    process.exit(1);
  }
  console.log('All API tests passed.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
