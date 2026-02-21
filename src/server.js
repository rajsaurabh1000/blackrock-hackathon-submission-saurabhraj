'use strict';

const express = require('express');
const { getPort, BODY_LIMIT } = require('./config');
const transactionsRouter = require('./routes/transactions');
const returnsRouter = require('./routes/returns');
const performanceRouter = require('./routes/performance');

const PORT = getPort();
const app = express();

app.use(express.json({ limit: BODY_LIMIT }));

const API_OVERVIEW = {
  name: 'Blackrock Challenge API',
  basePath: '/blackrock/challenge/v1',
  health: '/blackrock/challenge/v1/health',
  endpoints: {
    'POST /blackrock/challenge/v1/transactions/parse': 'Parse expenses to transactions',
    'POST /blackrock/challenge/v1/transactions/validator': 'Validate transactions',
    'POST /blackrock/challenge/v1/transactions/filter': 'Filter by q/p/k periods',
    'POST /blackrock/challenge/v1/returns/nps': 'NPS returns',
    'POST /blackrock/challenge/v1/returns/index': 'Index fund returns',
    'GET /blackrock/challenge/v1/performance': 'Performance stats',
    'GET /blackrock/challenge/v1/health': 'Liveness check',
  },
};

app.get('/', (req, res) => res.json(API_OVERVIEW));
app.get('/blackrock/challenge/v1', (req, res) => res.json(API_OVERVIEW));
app.get('/blackrock/challenge/v1/', (req, res) => res.json(API_OVERVIEW));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/blackrock/challenge/v1/health', (req, res) => res.json({ status: 'ok' }));

app.use('/blackrock/challenge/v1/transactions', transactionsRouter);
app.use('/blackrock/challenge/v1/returns', returnsRouter);
app.use('/blackrock/challenge/v1/performance', performanceRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process or set PORT to a different value.`);
    process.exit(1);
  }
  throw err;
});

function shutdown(signal) {
  console.log(`${signal} received; closing server.`);
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
