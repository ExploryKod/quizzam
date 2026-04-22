/* eslint-disable */
import axios from 'axios';

/**
 * E2E base URL: HOST + PORT (default localhost:3000).
 * If the API already runs in Docker watch on 3002, do not start another process on 3002:
 * set PORT=3002 to hit that API, or run a separate `nx serve` on a free port (e.g. 3010) and set PORT to match.
 */
module.exports = async function() {
  // Configure axios for tests to use.
  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ?? '3000';
  axios.defaults.baseURL = `http://${host}:${port}`;
};
