'use strict';

const express = require('express');

const router = express.Router();

/**
 * GET /blackrock/challenge/v1/performance
 * Reports time (duration), memory (MB), threads.
 */
router.get('/', (req, res) => {
  const mem = process.memoryUsage();
  const heapUsedMB = (mem.heapUsed / (1024 * 1024)).toFixed(2);
  const timeMs = process.uptime() * 1000;
  const hours = Math.floor(timeMs / 3600000);
  const mins = Math.floor((timeMs % 3600000) / 60000);
  const secs = ((timeMs % 60000) / 1000).toFixed(3);
  const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(6, '0')}`;
  res.json({
    time: timeStr,
    memory: `${heapUsedMB} MB`,
    threads: 1,
  });
});

module.exports = router;
