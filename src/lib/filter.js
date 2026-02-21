'use strict';

const { parseTimestamp, formatTimestamp, inRangeInclusive } = require('./dates');

/**
 * Apply q period: replace remanent with fixed when date in [start,end].
 * If multiple q match: use the one with latest start; if same start, first in list.
 * @param {Date} txDate
 * @param {Array<{ fixed: number, start: string, end: string }>} qPeriods
 * @returns {{ applied: boolean, fixed?: number }}
 */
function applyQ(txDate, qPeriods) {
  if (!Array.isArray(qPeriods) || qPeriods.length === 0) {
    return { applied: false };
  }
  const matching = [];
  for (let i = 0; i < qPeriods.length; i++) {
    const q = qPeriods[i];
    const startR = parseTimestamp(q.start);
    const endR = parseTimestamp(q.end);
    if (!startR.ok || !endR.ok) continue;
    if (inRangeInclusive(txDate, startR.date, endR.date)) {
      matching.push({ index: i, start: startR.date.getTime(), fixed: Number(q.fixed) });
    }
  }
  if (matching.length === 0) return { applied: false };
  matching.sort((a, b) => b.start - a.start);
  return { applied: true, fixed: matching[0].fixed };
}

/**
 * Apply p period: add extra to remanent when date in [start,end]. Sum all matching p.
 * @param {Date} txDate
 * @param {Array<{ extra: number, start: string, end: string }>} pPeriods
 * @returns {number} extra amount to add
 */
function applyP(txDate, pPeriods) {
  if (!Array.isArray(pPeriods) || pPeriods.length === 0) return 0;
  let extra = 0;
  for (let i = 0; i < pPeriods.length; i++) {
    const p = pPeriods[i];
    const startR = parseTimestamp(p.start);
    const endR = parseTimestamp(p.end);
    if (!startR.ok || !endR.ok) continue;
    if (inRangeInclusive(txDate, startR.date, endR.date)) {
      extra += Number(p.extra);
    }
  }
  return extra;
}

/**
 * Get effective remanent for one transaction after q and p.
 * @param {{ date: string, amount: number, ceiling: number, remanent: number }} tx
 * @param {Array} q
 * @param {Array} p
 * @returns {{ date: string, amount: number, ceiling: number, remanent: number }}
 */
function effectiveRemanent(tx, q, p) {
  const parsed = parseTimestamp(tx.date);
  if (!parsed.ok) {
    return { ...tx, remanent: 0 };
  }
  const txDate = parsed.date;
  const qResult = applyQ(txDate, q || []);
  let remanent = qResult.applied ? qResult.fixed : tx.remanent;
  remanent += applyP(txDate, p || []);
  return {
    date: tx.date,
    amount: tx.amount,
    ceiling: tx.ceiling,
    remanent,
  };
}

/**
 * Sum remanents for transactions in [start, end] (inclusive).
 * @param {Array<{ date: string, remanent: number }>} transactions - with effective remanent
 * @param {string} start
 * @param {string} end
 * @returns {number}
 */
function sumInRange(transactions, start, end) {
  const startR = parseTimestamp(start);
  const endR = parseTimestamp(end);
  if (!startR.ok || !endR.ok) return 0;
  let sum = 0;
  for (let i = 0; i < transactions.length; i++) {
    const r = parseTimestamp(transactions[i].date);
    if (!r.ok) continue;
    if (inRangeInclusive(r.date, startR.date, endR.date)) {
      sum += transactions[i].remanent;
    }
  }
  return sum;
}

/**
 * Filter: apply q and p, return valid (with updated remanent) and invalid (bad date).
 * @param {{ q: Array, p: Array, k: Array, transactions: Array }} input
 * @returns {{ valid: Array, invalid: Array<{ message: string }> }}
 */
function filterByPeriods(input) {
  const q = input.q || [];
  const p = input.p || [];
  const transactions = input.transactions || [];
  const valid = [];
  const invalid = [];

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const parsed = parseTimestamp(tx.date);
    if (!parsed.ok) {
      invalid.push({ ...tx, message: parsed.error || 'Invalid date' });
      continue;
    }
    valid.push(effectiveRemanent(tx, q, p));
  }

  return { valid, invalid };
}

/**
 * Compute savings by k periods (sum of effective remanent per k range).
 * @param {Array<{ date: string, remanent: number }>} transactionsWithRemanent
 * @param {Array<{ start: string, end: string }>} kPeriods
 * @returns {Array<{ start: string, end: string, amount: number }>}
 */
function savingsByKPeriods(transactionsWithRemanent, kPeriods) {
  if (!Array.isArray(kPeriods)) return [];
  return kPeriods.map((k) => ({
    start: k.start,
    end: k.end,
    amount: sumInRange(transactionsWithRemanent, k.start, k.end),
  }));
}

module.exports = {
  applyQ,
  applyP,
  effectiveRemanent,
  sumInRange,
  filterByPeriods,
  savingsByKPeriods,
};
