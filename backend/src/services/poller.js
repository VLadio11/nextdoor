'use strict';

/**
 * Poll orchestrator — the main polling loop.
 *
 * On each invocation:
 * 1. Load active locations and keywords from DB.
 * 2. For each location, fetch posts via the configured source.
 * 3. Deduplicate against previously seen posts.
 * 4. Store new posts and create Alert records for keyword matches.
 * 5. Dispatch email notifications for each new alert.
 */

const { v4: uuidv4 } = require('uuid');
const { query, isDbAvailable } = require('../database');
const { logger } = require('../logger');
const { fetchPosts } = require('./sources/nextdoor');
const { matchKeywords } = require('./matcher');
const { notifyAlert } = require('./notifier');

async function runPoll() {
  const summary = { locations_polled: 0, new_posts: 0, new_alerts: 0, errors: [] };

  if (!(await isDbAvailable())) {
    logger.info('poll_skipped', { reason: 'no database connection' });
    summary.last_run_result = { ...summary, mode: 'mock' };
    return summary;
  }

  const { rows: locations } = await query("SELECT * FROM locations WHERE is_active = true");
  const { rows: keywords } = await query("SELECT * FROM keywords WHERE is_active = true");
  const { rows: recipients } = await query("SELECT * FROM recipients WHERE is_active = true");

  if (!locations.length) { logger.info('poll_skipped', { reason: 'no active locations' }); return summary; }
  if (!keywords.length)  { logger.info('poll_skipped', { reason: 'no active keywords' });  return summary; }

  const keywordPhrases = keywords.map((k) => k.phrase);

  for (const location of locations) {
    summary.locations_polled++;
    try {
      const rawPosts = await fetchPosts({
        latitude: location.latitude,
        longitude: location.longitude,
        radius_km: location.radius_km,
        keywords: keywordPhrases,
      });
      logger.info('poll_fetched', { location: location.name, count: rawPosts.length });

      for (const raw of rawPosts) {
        // Deduplication check
        const { rows: existing } = await query(
          "SELECT id FROM discovered_posts WHERE source = $1 AND external_id = $2",
          [raw.source, raw.external_id]
        );
        if (existing.length) continue;

        const postId = uuidv4();
        await query(
          `INSERT INTO discovered_posts (id, source, external_id, location_id, content, author_name, posted_at, neighborhood, source_url, raw_payload, first_seen_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())`,
          [postId, raw.source, raw.external_id, location.id, raw.content, raw.author_name, raw.posted_at, raw.neighborhood, raw.source_url, raw.raw_payload ? JSON.stringify(raw.raw_payload) : null]
        );
        summary.new_posts++;

        const matched = matchKeywords(raw.content, keywordPhrases);
        for (const phrase of matched) {
          const alertId = uuidv4();
          const { rows: alertRows } = await query(
            `INSERT INTO alerts (id, post_id, matched_keyword, triggered_at)
             VALUES ($1,$2,$3,NOW())
             ON CONFLICT ON CONSTRAINT uq_alert_post_keyword DO NOTHING
             RETURNING id, matched_keyword, triggered_at`,
            [alertId, postId, phrase]
          );
          if (!alertRows.length) continue;
          summary.new_alerts++;

          const alert = { id: alertRows[0].id, post_id: postId, matched_keyword: phrase, post: { ...raw, id: postId } };
          await notifyAlert({ alert, recipients, locationName: location.name, db: { query } });
        }
      }
    } catch (err) {
      logger.exception('poll_location_error', { location: location.name, error: err.message });
      summary.errors.push(`${location.name}: ${err.message}`);
    }
  }

  logger.info('poll_complete', summary);
  return summary;
}

module.exports = { runPoll };
