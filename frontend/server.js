// TaskList web server
// Serves the static UI and forwards /api requests to the backend.
// Configuration comes from environment variables. See README.md.

const express = require('express');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const APP_VERSION = process.env.APP_VERSION || '0.0.0-dev';
const INSTANCE = process.env.INSTANCE_NAME || os.hostname();

const app = express();
app.use(express.json());

// Version of this tier, read by the page footer
app.get('/version', (req, res) => {
  res.json({ version: APP_VERSION, instance: INSTANCE });
});

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', instance: INSTANCE });
});

// Forward everything under /api to the backend.
// The browser never talks to the backend directly, so there is no CORS setup.
app.use('/api', async (req, res) => {
  const target = BACKEND_URL + req.originalUrl;
  try {
    const response = await fetch(target, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });
    const body = await response.text();
    res.status(response.status);
    if (body) res.type('application/json').send(body);
    else res.end();
  } catch (err) {
    console.warn(`backend unreachable at ${BACKEND_URL}: ${err.message}`);
    res.status(503).json({ error: 'Backend unreachable' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`tasklist-web ${APP_VERSION} listening on port ${PORT} as ${INSTANCE}`);
  console.log(`forwarding /api to ${BACKEND_URL}`);
});
