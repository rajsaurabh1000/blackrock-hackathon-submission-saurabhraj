'use strict';

const express = require('express');
const transactionsRouter = require('./routes/transactions');
const returnsRouter = require('./routes/returns');
const performanceRouter = require('./routes/performance');

const PORT = Number(process.env.PORT) || 5477;
const app = express();

app.use(express.json({ limit: '10mb' }));

app.use('/blackrock/challenge/v1/transactions', transactionsRouter);
app.use('/blackrock/challenge/v1/returns', returnsRouter);
app.use('/blackrock/challenge/v1/performance', performanceRouter);

app.get('/', (req, res) => {
  res.json({
    name: 'Blackrock Challenge API',
    basePath: '/blackrock/challenge/v1',
    health: '/health',
    endpoints: {
      'POST /blackrock/challenge/v1/transactions/parse': 'Parse expenses to transactions',
      'POST /blackrock/challenge/v1/transactions/validator': 'Validate transactions',
      'POST /blackrock/challenge/v1/transactions/filter': 'Filter by q/p/k periods',
      'POST /blackrock/challenge/v1/returns/nps': 'NPS returns',
      'POST /blackrock/challenge/v1/returns/index': 'Index fund returns',
      'GET /blackrock/challenge/v1/performance': 'Performance stats',
      'GET /health': 'Liveness check',
    },
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

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
