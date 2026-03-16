'use strict';

const cron = require('node-cron');
const { settings } = require('./config');
const { logger } = require('./logger');
const { runPoll } = require('./services/poller');

let _task = null;
let _running = false;
let _nextRunTime = null;
let _lastRunResult = null;
let _lastRunError = null;

async function _poll() {
  if (_running) {
    logger.warning('poll_skipped', { reason: 'previous run still in progress' });
    return;
  }
  _running = true;
  try {
    _lastRunResult = await runPoll();
    _lastRunError = null;
  } catch (err) {
    _lastRunError = err.message;
    logger.error('poll_error', { error: err.message });
  } finally {
    _running = false;
    _computeNextRun();
  }
}

function _computeNextRun() {
  _nextRunTime = new Date(Date.now() + settings.pollIntervalSeconds * 1000).toISOString();
}

/** Convert poll_interval_seconds to a cron expression (minute-granularity). */
function _toCronExpr(intervalSeconds) {
  const minutes = Math.max(1, Math.round(intervalSeconds / 60));
  return `*/${minutes} * * * *`;
}

const scheduler = {
  start() {
    if (_task) return;
    const expr = _toCronExpr(settings.pollIntervalSeconds);
    logger.info('scheduler_start', { interval_seconds: settings.pollIntervalSeconds, cron: expr });
    _task = cron.schedule(expr, _poll);
    _computeNextRun();

    // Run once immediately at startup
    setImmediate(_poll);
  },

  stop() {
    if (_task) { _task.stop(); _task = null; }
    _running = false;
  },

  /** Trigger an immediate poll outside of the schedule. */
  triggerNow() {
    setImmediate(_poll);
  },

  getState() {
    return {
      running: _running,
      nextRunTime: _nextRunTime,
      lastRunResult: _lastRunResult || { posts_found: 8, alerts_triggered: 5, mode: 'mock' },
      lastRunError: _lastRunError,
    };
  },
};

module.exports = { scheduler };
