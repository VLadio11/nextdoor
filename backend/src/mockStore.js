'use strict';

/**
 * In-memory mock store — replaces the database for local development.
 * All data lives in module-level Maps and is reset on server restart.
 */

// ── helpers ───────────────────────────────────────────────────────────────────

function dt(year, month, day, hour = 0, minute = 0) {
  return new Date(Date.UTC(year, month - 1, day, hour, minute)).toISOString();
}

// ── seed IDs ──────────────────────────────────────────────────────────────────

const LOC1 = '11111111-0000-0000-0000-000000000001';
const LOC2 = '11111111-0000-0000-0000-000000000002';
const LOC3 = '11111111-0000-0000-0000-000000000003';

const KW1 = '22222222-0000-0000-0000-000000000001';
const KW2 = '22222222-0000-0000-0000-000000000002';
const KW3 = '22222222-0000-0000-0000-000000000003';
const KW4 = '22222222-0000-0000-0000-000000000004';

const REC1 = '33333333-0000-0000-0000-000000000001';
const REC2 = '33333333-0000-0000-0000-000000000002';

const POST1 = '44444444-0000-0000-0000-000000000001';
const POST2 = '44444444-0000-0000-0000-000000000002';
const POST3 = '44444444-0000-0000-0000-000000000003';
const POST4 = '44444444-0000-0000-0000-000000000004';
const POST5 = '44444444-0000-0000-0000-000000000005';
const POST6 = '44444444-0000-0000-0000-000000000006';
const POST7 = '44444444-0000-0000-0000-000000000007';
const POST8 = '44444444-0000-0000-0000-000000000008';

const ALERT1 = '55555555-0000-0000-0000-000000000001';
const ALERT2 = '55555555-0000-0000-0000-000000000002';
const ALERT3 = '55555555-0000-0000-0000-000000000003';
const ALERT4 = '55555555-0000-0000-0000-000000000004';
const ALERT5 = '55555555-0000-0000-0000-000000000005';

const LOG1 = '66666666-0000-0000-0000-000000000001';
const LOG2 = '66666666-0000-0000-0000-000000000002';
const LOG3 = '66666666-0000-0000-0000-000000000003';
const LOG4 = '66666666-0000-0000-0000-000000000004';
const LOG5 = '66666666-0000-0000-0000-000000000005';
const LOG6 = '66666666-0000-0000-0000-000000000006';

// ── seed data ─────────────────────────────────────────────────────────────────

const locations = new Map([
  [LOC1, { id: LOC1, name: 'Downtown SF',       latitude: 37.7749, longitude: -122.4194, radius_km: 3.0, is_active: true,  created_at: dt(2026, 1, 10) }],
  [LOC2, { id: LOC2, name: 'Mission District',  latitude: 37.7599, longitude: -122.4148, radius_km: 2.5, is_active: true,  created_at: dt(2026, 1, 12) }],
  [LOC3, { id: LOC3, name: 'Castro',            latitude: 37.7609, longitude: -122.4350, radius_km: 2.0, is_active: false, created_at: dt(2026, 1, 15) }],
]);

const keywords = new Map([
  [KW1, { id: KW1, phrase: 'break-in',       is_active: true,  created_at: dt(2026, 1, 10) }],
  [KW2, { id: KW2, phrase: 'package theft',  is_active: true,  created_at: dt(2026, 1, 11) }],
  [KW3, { id: KW3, phrase: 'car vandalism',  is_active: true,  created_at: dt(2026, 1, 12) }],
  [KW4, { id: KW4, phrase: 'noise complaint',is_active: false, created_at: dt(2026, 1, 13) }],
]);

const recipients = new Map([
  [REC1, { id: REC1, email: 'alice@example.com', name: 'Alice', is_active: true, created_at: dt(2026, 1, 10) }],
  [REC2, { id: REC2, email: 'bob@example.com',   name: 'Bob',   is_active: true, created_at: dt(2026, 1, 14) }],
]);

const posts = new Map([
  [POST1, { id: POST1, source: 'nextdoor', external_id: 'nd-10001', location_id: LOC1, content: "Heads up neighbors — there was a break-in on Oak St last night. Stay safe!",         author_name: 'Jane D.',   neighborhood: 'Downtown SF',     source_url: 'https://nextdoor.com/p/10001', posted_at: dt(2026, 3, 14, 9,  15), first_seen_at: dt(2026, 3, 14, 9,  20) }],
  [POST2, { id: POST2, source: 'nextdoor', external_id: 'nd-10002', location_id: LOC2, content: 'My package was stolen off my porch this morning around 8am. Anyone else?',           author_name: 'Carlos M.', neighborhood: 'Mission District', source_url: 'https://nextdoor.com/p/10002', posted_at: dt(2026, 3, 14, 11, 0),  first_seen_at: dt(2026, 3, 14, 11, 5)  }],
  [POST3, { id: POST3, source: 'nextdoor', external_id: 'nd-10003', location_id: LOC1, content: 'Car vandalism near the park — windows smashed on three cars overnight.',             author_name: 'Sam T.',    neighborhood: 'Downtown SF',     source_url: 'https://nextdoor.com/p/10003', posted_at: dt(2026, 3, 14, 14, 30), first_seen_at: dt(2026, 3, 14, 14, 35) }],
  [POST4, { id: POST4, source: 'nextdoor', external_id: 'nd-10004', location_id: LOC2, content: 'Lost dog — brown lab named Max, last seen near Valencia St.',                       author_name: 'Priya K.',  neighborhood: 'Mission District', source_url: 'https://nextdoor.com/p/10004', posted_at: dt(2026, 3, 15, 8,  0),  first_seen_at: dt(2026, 3, 15, 8,  5)  }],
  [POST5, { id: POST5, source: 'nextdoor', external_id: 'nd-10005', location_id: LOC1, content: 'Another package theft reported on Market St — police case opened.',                  author_name: 'Tom H.',    neighborhood: 'Downtown SF',     source_url: 'https://nextdoor.com/p/10005', posted_at: dt(2026, 3, 15, 10, 45), first_seen_at: dt(2026, 3, 15, 10, 50) }],
  [POST6, { id: POST6, source: 'nextdoor', external_id: 'nd-10006', location_id: LOC3, content: 'Noise complaint filed against the venue on 18th — third time this month.',           author_name: 'Linda F.', neighborhood: 'Castro',           source_url: 'https://nextdoor.com/p/10006', posted_at: dt(2026, 3, 15, 20, 0),  first_seen_at: dt(2026, 3, 15, 20, 5)  }],
  [POST7, { id: POST7, source: 'nextdoor', external_id: 'nd-10007', location_id: LOC1, content: "Break-in at the corner store on 5th Ave — happened around 2am.",                    author_name: 'Wei Z.',    neighborhood: 'Downtown SF',     source_url: 'https://nextdoor.com/p/10007', posted_at: dt(2026, 3, 16, 7,  0),  first_seen_at: dt(2026, 3, 16, 7,  5)  }],
  [POST8, { id: POST8, source: 'nextdoor', external_id: 'nd-10008', location_id: LOC2, content: 'Community garden cleanup this Saturday — all welcome!',                              author_name: 'Rosa B.',   neighborhood: 'Mission District', source_url: 'https://nextdoor.com/p/10008', posted_at: dt(2026, 3, 16, 9,  30), first_seen_at: dt(2026, 3, 16, 9,  35) }],
]);

const notificationLogs = new Map([
  [LOG1, { id: LOG1, alert_id: ALERT1, recipient_id: REC1, sent_at: dt(2026, 3, 14, 9,  21), status: 'sent',   error_message: null,                      attempt_count: 1 }],
  [LOG2, { id: LOG2, alert_id: ALERT1, recipient_id: REC2, sent_at: dt(2026, 3, 14, 9,  21), status: 'sent',   error_message: null,                      attempt_count: 1 }],
  [LOG3, { id: LOG3, alert_id: ALERT2, recipient_id: REC1, sent_at: dt(2026, 3, 14, 11, 6),  status: 'sent',   error_message: null,                      attempt_count: 1 }],
  [LOG4, { id: LOG4, alert_id: ALERT3, recipient_id: REC1, sent_at: null,                     status: 'failed', error_message: 'SMTP connection timeout', attempt_count: 3 }],
  [LOG5, { id: LOG5, alert_id: ALERT4, recipient_id: REC1, sent_at: dt(2026, 3, 15, 10, 51), status: 'sent',   error_message: null,                      attempt_count: 1 }],
  [LOG6, { id: LOG6, alert_id: ALERT5, recipient_id: REC2, sent_at: dt(2026, 3, 16, 7,  6),  status: 'sent',   error_message: null,                      attempt_count: 1 }],
]);

const alerts = new Map([
  [ALERT1, { id: ALERT1, post_id: POST1, matched_keyword: 'break-in',      triggered_at: dt(2026, 3, 14, 9,  20), post: posts.get(POST1), notification_logs: [notificationLogs.get(LOG1), notificationLogs.get(LOG2)] }],
  [ALERT2, { id: ALERT2, post_id: POST2, matched_keyword: 'package theft', triggered_at: dt(2026, 3, 14, 11, 5),  post: posts.get(POST2), notification_logs: [notificationLogs.get(LOG3)] }],
  [ALERT3, { id: ALERT3, post_id: POST3, matched_keyword: 'car vandalism', triggered_at: dt(2026, 3, 14, 14, 35), post: posts.get(POST3), notification_logs: [notificationLogs.get(LOG4)] }],
  [ALERT4, { id: ALERT4, post_id: POST5, matched_keyword: 'package theft', triggered_at: dt(2026, 3, 15, 10, 50), post: posts.get(POST5), notification_logs: [notificationLogs.get(LOG5)] }],
  [ALERT5, { id: ALERT5, post_id: POST7, matched_keyword: 'break-in',      triggered_at: dt(2026, 3, 16, 7,  5),  post: posts.get(POST7), notification_logs: [notificationLogs.get(LOG6)] }],
]);

module.exports = { locations, keywords, recipients, posts, alerts, notificationLogs };
