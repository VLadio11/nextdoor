'use strict';

const { Router } = require('express');
const store = require('../store');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
    const start_date = req.query.start_date || null;
    const end_date = req.query.end_date || null;
    res.json(await store.listAlerts({ limit, offset, start_date, end_date }));
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const alert = await store.getAlert(req.params.id);
    if (!alert) return res.status(404).json({ detail: 'Alert not found' });
    res.json(alert);
  } catch (e) { next(e); }
});

module.exports = router;
