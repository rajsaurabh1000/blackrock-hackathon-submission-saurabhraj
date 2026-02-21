'use strict';

const express = require('express');
const { computeNpsReturns, computeIndexReturns } = require('../lib/returns');

const router = express.Router();

function parseReturnsBody(body) {
  const age = body.age !== undefined ? Number(body.age) : NaN;
  const wage = body.wage !== undefined ? Number(body.wage) : NaN;
  const inflation = body.inflation !== undefined ? Number(body.inflation) : undefined;
  const q = Array.isArray(body.q) ? body.q : [];
  const p = Array.isArray(body.p) ? body.p : [];
  const k = Array.isArray(body.k) ? body.k : [];
  const transactions = Array.isArray(body.transactions) ? body.transactions : [];
  return { age, wage, inflation, q, p, k, transactions };
}

/**
 * POST /blackrock/challenge/v1/returns:nps
 */
router.post('/nps', (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Request body must be an object' });
  }
  const { age, wage, inflation, q, p, k, transactions } = parseReturnsBody(body);
  if (!Number.isInteger(age) || age < 0) {
    return res.status(400).json({ error: 'Valid age (non-negative integer) is required' });
  }
  if (!Number.isFinite(wage) || wage < 0) {
    return res.status(400).json({ error: 'Valid wage is required' });
  }
  const result = computeNpsReturns({ age, wage, inflation, q, p, k, transactions });
  res.json(result);
});

/**
 * POST /blackrock/challenge/v1/returns:index
 */
router.post('/index', (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Request body must be an object' });
  }
  const { age, inflation, q, p, k, transactions } = parseReturnsBody(body);
  if (!Number.isInteger(age) || age < 0) {
    return res.status(400).json({ error: 'Valid age (non-negative integer) is required' });
  }
  const result = computeIndexReturns({ age, inflation, q, p, k, transactions });
  res.json(result);
});

module.exports = router;
