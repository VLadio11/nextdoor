'use strict';

/**
 * Minimal migration runner.
 * Creates all tables (IF NOT EXISTS) and a schema_migrations tracking table.
 * Safe to run multiple times — idempotent.
 */

require('dotenv').config();

const { getPool } = require('./database');
const { logger } = require('./logger');

const MIGRATIONS = [
  {
    id: '0001_initial_schema',
    sql: `
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS locations (
        id          UUID PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        latitude    FLOAT        NOT NULL,
        longitude   FLOAT        NOT NULL,
        radius_km   FLOAT        NOT NULL DEFAULT 5.0,
        is_active   BOOLEAN      NOT NULL DEFAULT true,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS ix_locations_is_active ON locations (is_active);

      CREATE TABLE IF NOT EXISTS keywords (
        id          UUID PRIMARY KEY,
        phrase      VARCHAR(500) NOT NULL UNIQUE,
        is_active   BOOLEAN      NOT NULL DEFAULT true,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS ix_keywords_is_active ON keywords (is_active);

      CREATE TABLE IF NOT EXISTS recipients (
        id          UUID PRIMARY KEY,
        email       VARCHAR(255) NOT NULL UNIQUE,
        name        VARCHAR(255),
        is_active   BOOLEAN      NOT NULL DEFAULT true,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS discovered_posts (
        id           UUID PRIMARY KEY,
        source       VARCHAR(100) NOT NULL DEFAULT 'nextdoor',
        external_id  VARCHAR(500) NOT NULL,
        location_id  UUID REFERENCES locations (id) ON DELETE SET NULL,
        content      TEXT         NOT NULL,
        author_name  VARCHAR(255),
        posted_at    TIMESTAMPTZ,
        neighborhood VARCHAR(255),
        source_url   VARCHAR(2000),
        raw_payload  JSONB,
        first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_post_source_external_id UNIQUE (source, external_id)
      );
      CREATE INDEX IF NOT EXISTS ix_posts_source_external_id ON discovered_posts (source, external_id);
      CREATE INDEX IF NOT EXISTS ix_posts_first_seen_at      ON discovered_posts (first_seen_at);

      CREATE TABLE IF NOT EXISTS alerts (
        id              UUID PRIMARY KEY,
        post_id         UUID NOT NULL REFERENCES discovered_posts (id) ON DELETE CASCADE,
        matched_keyword VARCHAR(500) NOT NULL,
        triggered_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT uq_alert_post_keyword UNIQUE (post_id, matched_keyword)
      );
      CREATE INDEX IF NOT EXISTS ix_alerts_triggered_at ON alerts (triggered_at);

      CREATE TABLE IF NOT EXISTS notification_logs (
        id            UUID PRIMARY KEY,
        alert_id      UUID NOT NULL REFERENCES alerts (id) ON DELETE CASCADE,
        recipient_id  UUID NOT NULL REFERENCES recipients (id) ON DELETE CASCADE,
        sent_at       TIMESTAMPTZ,
        status        VARCHAR(50) NOT NULL DEFAULT 'pending',
        error_message TEXT,
        attempt_count INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS ix_notification_logs_alert_id ON notification_logs (alert_id);
    `,
  },
];

async function migrate() {
  const pool = getPool();
  if (!pool) {
    logger.warning('migrate_skipped', { reason: 'no DATABASE_URL configured' });
    return;
  }

  const client = await pool.connect();
  try {
    // Tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id         TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    for (const m of MIGRATIONS) {
      const { rows } = await client.query('SELECT id FROM schema_migrations WHERE id = $1', [m.id]);
      if (rows.length) {
        logger.debug('migration_already_applied', { id: m.id });
        continue;
      }
      logger.info('migration_applying', { id: m.id });
      await client.query('BEGIN');
      await client.query(m.sql);
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [m.id]);
      await client.query('COMMIT');
      logger.info('migration_applied', { id: m.id });
    }
    logger.info('migrate_done');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    logger.error('migrate_failed', { error: err.message });
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { migrate };

// Allow running directly: node src/migrate.js
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
