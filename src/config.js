'use strict';

/**
 * Application configuration. All env-based or tunable values in one place.
 * Rule: no hardcoded secrets; use environment variables for credentials.
 */
const DEFAULT_PORT = 5477;
const BODY_LIMIT = '10mb';

function getPort() {
  const port = Number(process.env.PORT);
  return Number.isFinite(port) && port > 0 ? port : DEFAULT_PORT;
}

module.exports = {
  DEFAULT_PORT,
  BODY_LIMIT,
  getPort,
};
