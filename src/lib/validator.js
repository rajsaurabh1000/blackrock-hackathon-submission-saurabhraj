'use strict';

const { parseTimestamp } = require('./dates');
const { ceiling100, MAX_AMOUNT } = require('./parse');

/**
 * Validate transactions by wage and max investment. Returns valid, invalid, duplicate.
 * Duplicate: same date (by string comparison).
 * Invalid: wrong ceiling/remanent, amount out of range, or invalid date.
 * @param {number} wage - monthly wage (used for NPS 10% annual cap)
 * @param {number} maxAmountToInvest - optional cap (e.g. 200000 for NPS)
 * @param {Array<{ date: string, amount: number, ceiling: number, remanent: number }>} transactions
 * @returns {{ valid: Array, invalid: Array<{ message: string }>, duplicate: Array }}
 */
function validateTransactions(wage, maxAmountToInvest, transactions) {
  const valid = [];
  const invalid = [];
  const duplicate = [];
  const seen = new Set();

  if (!Array.isArray(transactions)) {
    return { valid: [], invalid: [], duplicate: [] };
  }

  const annualIncome = Number(wage) * 12;
  const maxInvest = typeof maxAmountToInvest === 'number' && Number.isFinite(maxAmountToInvest)
    ? maxAmountToInvest
    : Math.min(annualIncome * 0.1, 200000);

  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    const dateStr = t.date;
    const amount = Number(t.amount);
    const ceiling = Number(t.ceiling);
    const remanent = Number(t.remanent);

    if (seen.has(dateStr)) {
      duplicate.push({ ...t, message: 'Duplicate date' });
      continue;
    }
    seen.add(dateStr);

    const parsed = parseTimestamp(dateStr);
    if (!parsed.ok) {
      invalid.push({ ...t, message: parsed.error || 'Invalid date' });
      continue;
    }

    const expectedCeiling = ceiling100(amount);
    const expectedRemanent = expectedCeiling - amount;
    if (ceiling !== expectedCeiling || remanent !== expectedRemanent) {
      invalid.push({
        ...t,
        message: `Ceiling/remanent mismatch: expected ceiling=${expectedCeiling}, remanent=${expectedRemanent}`,
      });
      continue;
    }
    if (!Number.isFinite(amount) || amount < 0 || amount >= MAX_AMOUNT) {
      invalid.push({ ...t, message: `Amount out of range [0, ${MAX_AMOUNT})` });
      continue;
    }

    valid.push(t);
  }

  const totalRemanent = valid.reduce((s, tx) => s + tx.remanent, 0);
  if (totalRemanent > maxInvest) {
    for (const t of valid) {
      invalid.push({
        ...t,
        message: `Total investment ${totalRemanent} exceeds max ${maxInvest}`,
      });
    }
    return { valid: [], invalid, duplicate };
  }

  return { valid, invalid, duplicate };
}

module.exports = { validateTransactions };
