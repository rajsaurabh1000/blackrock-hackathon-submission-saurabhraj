#!/usr/bin/env node
'use strict';

/**
 * Test type: Integration / API contract
 * Validation: Parse, filter (q/p/k), and returns match the PDF example (4 expenses, q/p/k rules, full-year amount 145, NPS/Index outputs).
 * Command: node test/run-all.js
 */

const { parseExpenses } = require('../src/lib/parse');
const { filterByPeriods, savingsByKPeriods } = require('../src/lib/filter');
const { computeNpsReturns, computeIndexReturns } = require('../src/lib/returns');

const expenses = [
  { date: '2023-10-12 20:15:00', amount: 250 },
  { date: '2023-02-28 15:49:00', amount: 375 },
  { date: '2023-07-01 21:59:00', amount: 620 },
  { date: '2023-12-17 08:09:00', amount: 480 },
];
const q = [{ fixed: 0, start: '2023-07-01 00:00:00', end: '2023-07-31 23:59:00' }];
const p = [{ extra: 25, start: '2023-10-01 08:00:00', end: '2023-12-31 19:59:00' }];
const k = [
  { start: '2023-03-01 00:00:00', end: '2023-11-30 23:59:00' },
  { start: '2023-01-01 00:00:00', end: '2023-12-31 23:59:00' },
];

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    failed++;
  } else {
    console.log('OK:', msg);
  }
}

const parsed = parseExpenses(expenses);
assert(parsed.transactions.length === 4, 'parse returns 4 transactions');
const noRules = parsed.transactions.reduce((s, t) => s + t.remanent, 0);
assert(noRules === 175, 'total remanent without q/p is 175');

const { valid } = filterByPeriods({ q, p, transactions: parsed.transactions });
assert(valid.length === 4, 'filter returns 4 valid');

const savings = savingsByKPeriods(valid, k);
assert(savings.length === 2, 'two k periods');
assert(savings[0].amount === 75, 'k1 (Mar–Nov) amount = 75');
assert(savings[1].amount === 145, 'k2 (full year) amount = 145');

const nps = computeNpsReturns({
  age: 29,
  wage: 50000,
  inflation: 0.055,
  q,
  p,
  k,
  transactions: parsed.transactions,
});
assert(nps.savingsByDates[1].amount === 145, 'NPS full-year amount 145');
assert(Math.abs(nps.savingsByDates[1].profits - 86.88) < 1, 'NPS profits ~86.88');

const idx = computeIndexReturns({
  age: 29,
  inflation: 0.055,
  q,
  p,
  k,
  transactions: parsed.transactions,
});
assert(Math.abs(idx.savingsByDates[1].return - 1829.5) < 10, 'Index real return ~1829.5');

if (failed > 0) {
  process.exit(1);
}
console.log('All tests passed.');
process.exit(0);
