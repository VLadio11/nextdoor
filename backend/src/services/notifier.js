'use strict';

const nodemailer = require('nodemailer');
const { settings } = require('../config');
const { logger } = require('../logger');
const { renderAlertEmail } = require('./emailRenderer');

const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = [5000, 10000, 20000];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createTransport() {
  return nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: false,
    requireTLS: settings.smtpUseTls,
    auth: settings.smtpUser
      ? { user: settings.smtpUser, pass: settings.smtpPassword }
      : undefined,
  });
}

/**
 * Sends alert emails to all recipients.
 * db is optional — when provided it is used to persist NotificationLog records.
 */
async function notifyAlert({ alert, recipients, locationName, db }) {
  const post = alert.post;
  const { subject, html, plain } = renderAlertEmail({
    keyword: alert.matched_keyword,
    content: post.content,
    author_name: post.author_name,
    neighborhood: post.neighborhood,
    posted_at: post.posted_at,
    source_url: post.source_url,
    location_name: locationName,
  });

  const transport = createTransport();

  for (const recipient of recipients) {
    let lastError = null;
    let sent = false;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await transport.sendMail({
          from: settings.smtpFrom,
          to: recipient.email,
          subject,
          text: plain,
          html,
        });
        sent = true;
        logger.info('alert_sent', { recipient: recipient.email, keyword: alert.matched_keyword });
        break;
      } catch (err) {
        lastError = err.message;
        logger.warning('smtp_send_failed', { attempt, error: err.message });
        if (attempt < MAX_RETRIES) await sleep(RETRY_BACKOFF_MS[attempt - 1]);
      }
    }

    if (db) {
      const { v4: uuidv4 } = require('uuid');
      await db.query(
        `INSERT INTO notification_logs (id, alert_id, recipient_id, status, sent_at, error_message, attempt_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          uuidv4(),
          alert.id,
          recipient.id,
          sent ? 'sent' : 'failed',
          sent ? new Date().toISOString() : null,
          sent ? null : lastError,
          MAX_RETRIES,
        ]
      );
    }

    if (!sent) {
      logger.error('alert_failed', { recipient: recipient.email, keyword: alert.matched_keyword, error: lastError });
    }
  }
}

module.exports = { notifyAlert };
