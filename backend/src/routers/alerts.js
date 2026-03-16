'use strict';

const { Router } = require('express');
const { alerts } = require('../mockStore');

const router = Router();

// GET /api/alerts?limit=50&offset=0&start_date=...&end_date=...
router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
  const startDate = req.query.start_date ? new Date(req.query.start_date) : null;
  const endDate = req.query.end_date ? new Date(req.query.end_date) : null;

  let items = [...alerts.values()].sort((a, b) => b.triggered_at.localeCompare(a.triggered_at));
  if (startDate) items = items.filter((a) => new Date(a.triggered_at) >= startDate);
  if (endDate) items = items.filter((a) => new Date(a.triggered_at) <= endDate);
  res.json(items.slice(offset, offset + limit));
});

// GET /api/alerts/:id
router.get('/:id', (req, res) => {
  const alert = alerts.get(req.params.id);
  if (!alert) return res.status(404).json({ detail: 'Alert not found' });
  res.json(alert);
});

module.exports = router;
