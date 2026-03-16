require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { settings } = require('./src/config');
const { logger } = require('./src/logger');
const { scheduler } = require('./src/scheduler');

const locationsRouter = require('./src/routers/locations');
const keywordsRouter = require('./src/routers/keywords');
const recipientsRouter = require('./src/routers/recipients');
const postsRouter = require('./src/routers/posts');
const alertsRouter = require('./src/routers/alerts');
const systemRouter = require('./src/routers/system');

const app = express();

app.use(cors({ origin: settings.corsOrigins, credentials: true }));
app.use(express.json());

const API = '/api';
app.use(`${API}/locations`, locationsRouter);
app.use(`${API}/keywords`, keywordsRouter);
app.use(`${API}/recipients`, recipientsRouter);
app.use(`${API}/posts`, postsRouter);
app.use(`${API}/alerts`, alertsRouter);
app.use(`${API}/system`, systemRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// 404
app.use((_req, res) => res.status(404).json({ detail: 'Not Found' }));

// Error handler
app.use((err, _req, res, _next) => {
  logger.error('unhandled_error', { error: err.message });
  res.status(err.status || 500).json({ detail: err.message || 'Internal Server Error' });
});

const PORT = parseInt(process.env.PORT || '8000', 10);
app.listen(PORT, () => {
  logger.info('server_started', { port: PORT, sim_mode: settings.simMode });
  scheduler.start();
});
