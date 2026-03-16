'use strict';

const { settings } = require('./config');

const LEVELS = { DEBUG: 0, INFO: 1, WARNING: 2, ERROR: 3 };
const minLevel = LEVELS[(settings.logLevel || 'INFO').toUpperCase()] ?? 1;

function log(level, event, data = {}) {
  if ((LEVELS[level] ?? 0) < minLevel) return;
  if (settings.environment === 'production') {
    console.log(JSON.stringify({ time: new Date().toISOString(), level, event, ...data }));
  } else {
    const extra = Object.keys(data).length ? ' ' + JSON.stringify(data) : '';
    console.log(`[${level}] ${event}${extra}`);
  }
}

const logger = {
  debug: (event, data) => log('DEBUG', event, data),
  info: (event, data) => log('INFO', event, data),
  warning: (event, data) => log('WARNING', event, data),
  error: (event, data) => log('ERROR', event, data),
  exception: (event, data) => log('ERROR', event, data),
};

function getLogger() {
  return logger;
}

module.exports = { logger, getLogger };
