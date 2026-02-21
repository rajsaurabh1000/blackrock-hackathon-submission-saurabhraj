'use strict';

const { filterByPeriods, savingsByKPeriods } = require('./filter');

const NPS_RATE = 0.0711;
const INDEX_RATE = 0.1449;
const NPS_TAX_CAP = 200000;
const INFLATION_DEFAULT = 0.055;

/**
 * Simplified Indian tax (no regimes): 0% up to 7L, 10% 7-10L, 15% 10-12L, 20% 12-15L, 30% above 15L.
 * @param {number} income
 * @returns {number}
 */
function tax(income) {
  const i = Number(income);
  if (i <= 700000) return 0;
  if (i <= 1000000) return (i - 700000) * 0.1;
  if (i <= 1200000) return 30000 + (i - 1000000) * 0.15;
  if (i <= 1500000) return 60000 + (i - 1200000) * 0.2;
  return 120000 + (i - 1500000) * 0.3;
}

/**
 * NPS deduction: min(invested, 10% of annual income, 2L).
 * @param {number} invested
 * @param {number} annualIncome
 * @returns {number}
 */
function npsDeduction(invested, annualIncome) {
  const cap = Math.min(annualIncome * 0.1, NPS_TAX_CAP);
  return Math.min(invested, cap);
}

/**
 * Compound amount: A = P * (1+r)^t. n=1 (annual).
 * @param {number} P
 * @param {number} r
 * @param {number} t years
 * @returns {number}
 */
function compound(P, r, t) {
  return P * Math.pow(1 + r, t);
}

/**
 * Years to retirement: 60 - age, or 5 if age >= 60.
 * @param {number} age
 * @returns {number}
 */
function yearsToRetirement(age) {
  const a = Number(age);
  return a < 60 ? 60 - a : 5;
}

/**
 * Full pipeline: apply q,p to transactions, then savings by k, then NPS returns.
 * @param {{ age: number, wage: number, inflation?: number, q: Array, p: Array, k: Array, transactions: Array }} input
 * @returns {{ transactionsTotalAmount: number, transactionsTotalCeiling: number, savingsByDates: Array<{ start: string, end: string, amount: number, profits: number, taxBenefit: number }> }}
 */
function computeNpsReturns(input) {
  const { age, wage, inflation = INFLATION_DEFAULT, q = [], p = [], k = [], transactions = [] } = input;
  const { valid } = filterByPeriods({ q, p, transactions });
  const totalAmount = valid.reduce((s, t) => s + t.amount, 0);
  const totalCeiling = valid.reduce((s, t) => s + t.ceiling, 0);
  const savings = savingsByKPeriods(valid, k);
  const annualIncome = Number(wage) * 12;
  const t = yearsToRetirement(age);

  const savingsByDates = savings.map((sav) => {
    const amount = sav.amount;
    const future = compound(amount, NPS_RATE, t);
    const deduction = npsDeduction(amount, annualIncome);
    const taxBenefit = tax(annualIncome) - tax(annualIncome - deduction);
    const realValue = future / Math.pow(1 + inflation, t);
    const profits = Math.round((realValue - amount) * 100) / 100;
    return {
      start: sav.start,
      end: sav.end,
      amount,
      profits,
      taxBenefit,
    };
  });

  return {
    transactionsTotalAmount: totalAmount,
    transactionsTotalCeiling: totalCeiling,
    savingsByDates,
  };
}

/**
 * Index fund returns: compound at 14.49%, inflation adjust. No tax benefit.
 * @param {{ age: number, inflation?: number, q: Array, p: Array, k: Array, transactions: Array }} input
 * @returns {{ transactionsTotalAmount: number, transactionsTotalCeiling: number, savingsByDates: Array<{ start: string, end: string, amount: number, return: number }> }}
 */
function computeIndexReturns(input) {
  const { age, inflation = INFLATION_DEFAULT, q = [], p = [], k = [], transactions = [] } = input;
  const { valid } = filterByPeriods({ q, p, transactions });
  const totalAmount = valid.reduce((s, t) => s + t.amount, 0);
  const totalCeiling = valid.reduce((s, t) => s + t.ceiling, 0);
  const savings = savingsByKPeriods(valid, k);
  const t = yearsToRetirement(age);

  const savingsByDates = savings.map((sav) => {
    const amount = sav.amount;
    const future = compound(amount, INDEX_RATE, t);
    const realValue = future / Math.pow(1 + inflation, t);
    const ret = Math.round(realValue * 100) / 100;
    return {
      start: sav.start,
      end: sav.end,
      amount,
      return: ret,
    };
  });

  return {
    transactionsTotalAmount: totalAmount,
    transactionsTotalCeiling: totalCeiling,
    savingsByDates,
  };
}

module.exports = {
  tax,
  npsDeduction,
  compound,
  yearsToRetirement,
  computeNpsReturns,
  computeIndexReturns,
  NPS_RATE,
  INDEX_RATE,
};
