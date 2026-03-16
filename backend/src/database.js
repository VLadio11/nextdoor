'use strict';

const { Pool } = require('pg');
const { settings } = require('./config');
const { logger } = require('./logger');

let pool = null;

function getPool() {
  if (!pool && settings.databaseUrl) {
    // Convert asyncpg URL format to plain postgres URL if needed
    const url = settings.databaseUrl.replace('postgresql+asyncpg://', 'postgresql://');
    pool = new Pool({ connectionString: url, max: 10 });
    pool.on('error', (err) => logger.error('pg_pool_error', { error: err.message }));
    logger.info('db_pool_created', { url: url.replace(/:\/\/[^@]+@/, '://***@') });
  }
  return pool;
}

async function query(text, params) {
  const p = getPool();
  if (!p) throw new Error('No DATABASE_URL configured');
  return p.query(text, params);
}

/** Returns true if we can reach the database. */
async function isDbAvailable() {
  try {
    const p = getPool();
    if (!p) return false;
    await p.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

module.exports = { getPool, query, isDbAvailable };
