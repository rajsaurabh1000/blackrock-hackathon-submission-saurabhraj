'use strict';

const { parseTimestamp, formatTimestamp } = require('./dates');

const MULTIPLE = 100;
const MAX_AMOUNT = 5e5;

/**
 * Round up to next multiple of 100.
 * @param {number} amount
 * @returns {number}
 */
function ceiling100(amount) {
  if (amount <= 0) return MULTIPLE;
  return Math.ceil(Number(amount) / MULTIPLE) * MULTIPLE;
}

/**
 * Parse expenses into transactions with ceiling and remanent.
 * Input: expenses with timestamp (or date), amount.
 * Output: date (formatted), amount, ceiling, remanent.
 * @param {Array<{ timestamp?: string, date?: string, amount: number }>} expenses
 * @returns {{ transactions: Array<{ date: string, amount: number, ceiling: number, remanent: number }>, totalInvested: number, totalRemanent: number, totalExpense: number }}
 */
function parseExpenses(expenses) {
  if (!Array.isArray(expenses)) {
    return { transactions: [], totalInvested: 0, totalRemanent: 0, totalExpense: 0 };
  }

  const transactions = [];
  let totalExpense = 0;
  let totalRemanent = 0;

  for (let i = 0; i < expenses.length; i++) {
    const raw = expenses[i];
    const ts = raw.timestamp !== undefined ? raw.timestamp : raw.date;
    const amount = Number(raw.amount);
    if (typeof ts !== 'string' || !Number.isFinite(amount) || amount < 0 || amount >= MAX_AMOUNT) {
      continue;
    }
    const parsed = parseTimestamp(ts);
    if (!parsed.ok) continue;

    const ceiling = ceiling100(amount);
    const remanent = ceiling - amount;

    transactions.push({
      date: formatTimestamp(parsed.date),
      amount,
      ceiling,
      remanent,
    });
    totalExpense += amount;
    totalRemanent += remanent;
  }

  return {
    transactions,
    totalInvested: totalRemanent,
    totalRemanent,
    totalExpense,
  };
}

module.exports = {
  ceiling100,
  parseExpenses,
  MULTIPLE,
  MAX_AMOUNT,
};
