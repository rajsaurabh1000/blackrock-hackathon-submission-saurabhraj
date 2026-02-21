'use strict';

const express = require('express');
const { parseExpenses } = require('../lib/parse');
const { validateTransactions } = require('../lib/validator');
const { filterByPeriods } = require('../lib/filter');

const router = express.Router();

/**
 * POST /blackrock/challenge/v1/transactions:parse
 * Input: { expenses: [{ timestamp, amount }] } (timestamp or date)
 * Output: { transactions, totalInvested, totalRemanent, totalExpense }
 */
router.post('/parse', (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Request body must be an object' });
  }
  const expenses = Array.isArray(body.expenses) ? body.expenses : [];
  const result = parseExpenses(expenses);
  res.json(result);
});

/**
 * POST /blackrock/challenge/v1/transactions:validator
 * Input: { wage, maxAmountToInvest?, transactions: [{ date, amount, ceiling, remanent }] }
 * Output: { valid, invalid, duplicate }
 */
router.post('/validator', (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Request body must be an object' });
  }
  const wage = Number(body.wage);
  const maxAmountToInvest = body.maxAmountToInvest !== undefined ? Number(body.maxAmountToInvest) : undefined;
  const transactions = Array.isArray(body.transactions) ? body.transactions : [];
  if (!Number.isFinite(wage) || wage < 0) {
    return res.status(400).json({ error: 'Valid wage (number >= 0) is required' });
  }
  const result = validateTransactions(wage, maxAmountToInvest, transactions);
  res.json(result);
});

/**
 * POST /blackrock/challenge/v1/transactions:filter
 * Input: { q: [], p: [], k: [], transactions: [] }
 * Output: { valid, invalid }
 */
router.post('/filter', (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Request body must be an object' });
  }
  const result = filterByPeriods({
    q: Array.isArray(body.q) ? body.q : [],
    p: Array.isArray(body.p) ? body.p : [],
    k: Array.isArray(body.k) ? body.k : [],
    transactions: Array.isArray(body.transactions) ? body.transactions : [],
  });
  res.json(result);
});

module.exports = router;
