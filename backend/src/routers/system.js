'use strict';

const { Router } = require('express');
const { settings } = require('../config');
const { scheduler } = require('../scheduler');

const router = Router();

// GET /api/system/status
router.get('/status', (_req, res) => {
  const state = scheduler.getState();
  res.json({
    running: state.running,
    sim_mode: settings.simMode,
    poll_interval_seconds: settings.pollIntervalSeconds,
    next_run_time: state.nextRunTime,
    last_run_result: state.lastRunResult,
    last_run_error: state.lastRunError,
  });
});

// POST /api/system/poll-now
router.post('/poll-now', (_req, res) => {
  scheduler.triggerNow();
  res.status(202).json({ message: 'Poll triggered', timestamp: new Date().toISOString() });
});

module.exports = router;
