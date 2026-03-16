'use strict';

/**
 * Unified CRUD store.
 * When DATABASE_URL is set and reachable, all reads/writes go to PostgreSQL.
 * Otherwise falls back to the in-memory mock store so local dev needs no DB.
 */

const { v4: uuidv4 } = require('uuid');
const { query, isDbAvailable } = require('./database');
const mock = require('./mockStore');

// ── helpers ───────────────────────────────────────────────────────────────────

/** Normalise a pg row: convert Date objects → ISO strings, keep nulls. */
function row(r) {
  if (!r) return null;
  const out = {};
  for (const [k, v] of Object.entries(r)) {
    out[k] = v instanceof Date ? v.toISOString() : v;
  }
  return out;
}

function rows(rs) { return rs.map(row); }

// ── Locations ─────────────────────────────────────────────────────────────────

async function listLocations() {
  if (await isDbAvailable()) {
    const { rows: rs } = await query('SELECT * FROM locations ORDER BY created_at DESC');
    return rows(rs);
  }
  return [...mock.locations.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

async function createLocation({ name, latitude, longitude, radius_km = 5.0, is_active = true }) {
  if (await isDbAvailable()) {
    const id = uuidv4();
    const { rows: rs } = await query(
      `INSERT INTO locations (id, name, latitude, longitude, radius_km, is_active)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [id, name, latitude, longitude, radius_km, is_active]
    );
    return row(rs[0]);
  }
  const loc = { id: uuidv4(), name, latitude, longitude, radius_km, is_active, created_at: new Date().toISOString() };
  mock.locations.set(loc.id, loc);
  return loc;
}

async function getLocation(id) {
  if (await isDbAvailable()) {
    const { rows: rs } = await query('SELECT * FROM locations WHERE id = $1', [id]);
    return row(rs[0]) || null;
  }
  return mock.locations.get(id) || null;
}

async function updateLocation(id, fields) {
  if (await isDbAvailable()) {
    const allowed = ['name', 'latitude', 'longitude', 'radius_km', 'is_active'];
    const updates = Object.entries(fields).filter(([k]) => allowed.includes(k));
    if (!updates.length) return getLocation(id);
    const setClauses = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = [id, ...updates.map(([, v]) => v)];
    const { rows: rs } = await query(
      `UPDATE locations SET ${setClauses} WHERE id = $1 RETURNING *`, values
    );
    return row(rs[0]) || null;
  }
  const loc = mock.locations.get(id);
  if (!loc) return null;
  Object.assign(loc, fields);
  return loc;
}

async function deleteLocation(id) {
  if (await isDbAvailable()) {
    const { rowCount } = await query('DELETE FROM locations WHERE id = $1', [id]);
    return rowCount > 0;
  }
  return mock.locations.delete(id);
}

// ── Keywords ──────────────────────────────────────────────────────────────────

async function listKeywords() {
  if (await isDbAvailable()) {
    const { rows: rs } = await query('SELECT * FROM keywords ORDER BY created_at DESC');
    return rows(rs);
  }
  return [...mock.keywords.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

async function createKeyword({ phrase, is_active = true }) {
  const normalized = phrase.trim().toLowerCase();
  if (await isDbAvailable()) {
    const id = uuidv4();
    const { rows: rs } = await query(
      `INSERT INTO keywords (id, phrase, is_active) VALUES ($1,$2,$3) RETURNING *`,
      [id, normalized, is_active]
    );
    return row(rs[0]);
  }
  const kw = { id: uuidv4(), phrase: normalized, is_active, created_at: new Date().toISOString() };
  mock.keywords.set(kw.id, kw);
  return kw;
}

async function getKeyword(id) {
  if (await isDbAvailable()) {
    const { rows: rs } = await query('SELECT * FROM keywords WHERE id = $1', [id]);
    return row(rs[0]) || null;
  }
  return mock.keywords.get(id) || null;
}

async function updateKeyword(id, fields) {
  if (await isDbAvailable()) {
    const allowed = ['phrase', 'is_active'];
    const updates = Object.entries(fields).filter(([k]) => allowed.includes(k));
    if (updates.find(([k]) => k === 'phrase')) {
      const entry = updates.find(([k]) => k === 'phrase');
      entry[1] = String(entry[1]).trim().toLowerCase();
    }
    if (!updates.length) return getKeyword(id);
    const setClauses = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const { rows: rs } = await query(
      `UPDATE keywords SET ${setClauses} WHERE id = $1 RETURNING *`,
      [id, ...updates.map(([, v]) => v)]
    );
    return row(rs[0]) || null;
  }
  const kw = mock.keywords.get(id);
  if (!kw) return null;
  if (fields.phrase !== undefined) kw.phrase = fields.phrase.trim().toLowerCase();
  if (fields.is_active !== undefined) kw.is_active = fields.is_active;
  return kw;
}

async function deleteKeyword(id) {
  if (await isDbAvailable()) {
    const { rowCount } = await query('DELETE FROM keywords WHERE id = $1', [id]);
    return rowCount > 0;
  }
  return mock.keywords.delete(id);
}

// ── Recipients ────────────────────────────────────────────────────────────────

async function listRecipients() {
  if (await isDbAvailable()) {
    const { rows: rs } = await query('SELECT * FROM recipients ORDER BY created_at DESC');
    return rows(rs);
  }
  return [...mock.recipients.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

async function createRecipient({ email, name = null, is_active = true }) {
  if (await isDbAvailable()) {
    const id = uuidv4();
    const { rows: rs } = await query(
      `INSERT INTO recipients (id, email, name, is_active) VALUES ($1,$2,$3,$4) RETURNING *`,
      [id, email, name, is_active]
    );
    return row(rs[0]);
  }
  const rec = { id: uuidv4(), email, name, is_active, created_at: new Date().toISOString() };
  mock.recipients.set(rec.id, rec);
  return rec;
}

async function getRecipient(id) {
  if (await isDbAvailable()) {
    const { rows: rs } = await query('SELECT * FROM recipients WHERE id = $1', [id]);
    return row(rs[0]) || null;
  }
  return mock.recipients.get(id) || null;
}

async function updateRecipient(id, fields) {
  if (await isDbAvailable()) {
    const allowed = ['email', 'name', 'is_active'];
    const updates = Object.entries(fields).filter(([k]) => allowed.includes(k));
    if (!updates.length) return getRecipient(id);
    const setClauses = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const { rows: rs } = await query(
      `UPDATE recipients SET ${setClauses} WHERE id = $1 RETURNING *`,
      [id, ...updates.map(([, v]) => v)]
    );
    return row(rs[0]) || null;
  }
  const rec = mock.recipients.get(id);
  if (!rec) return null;
  Object.assign(rec, fields);
  return rec;
}

async function deleteRecipient(id) {
  if (await isDbAvailable()) {
    const { rowCount } = await query('DELETE FROM recipients WHERE id = $1', [id]);
    return rowCount > 0;
  }
  return mock.recipients.delete(id);
}

// ── Posts ─────────────────────────────────────────────────────────────────────

async function listPosts({ limit = 50, offset = 0, location_id = null } = {}) {
  if (await isDbAvailable()) {
    if (location_id) {
      const { rows: rs } = await query(
        `SELECT * FROM discovered_posts WHERE location_id = $1
         ORDER BY first_seen_at DESC LIMIT $2 OFFSET $3`,
        [location_id, limit, offset]
      );
      return rows(rs);
    }
    const { rows: rs } = await query(
      `SELECT * FROM discovered_posts ORDER BY first_seen_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return rows(rs);
  }
  let items = [...mock.posts.values()].sort((a, b) => b.first_seen_at.localeCompare(a.first_seen_at));
  if (location_id) items = items.filter((p) => p.location_id === location_id);
  return items.slice(offset, offset + limit);
}

// ── Alerts ────────────────────────────────────────────────────────────────────

async function listAlerts({ limit = 50, offset = 0, start_date = null, end_date = null } = {}) {
  if (await isDbAvailable()) {
    const conditions = [];
    const params = [];
    if (start_date) { params.push(start_date); conditions.push(`a.triggered_at >= $${params.length}`); }
    if (end_date)   { params.push(end_date);   conditions.push(`a.triggered_at <= $${params.length}`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);
    const { rows: rs } = await query(
      `SELECT a.*, row_to_json(p.*) AS post
       FROM alerts a
       LEFT JOIN discovered_posts p ON p.id = a.post_id
       ${where}
       ORDER BY a.triggered_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return rows(rs).map((r) => ({ ...r, post: r.post || null }));
  }
  let items = [...mock.alerts.values()].sort((a, b) => b.triggered_at.localeCompare(a.triggered_at));
  if (start_date) items = items.filter((a) => a.triggered_at >= start_date);
  if (end_date)   items = items.filter((a) => a.triggered_at <= end_date);
  return items.slice(offset, offset + limit);
}

async function getAlert(id) {
  if (await isDbAvailable()) {
    const { rows: alertRows } = await query(
      `SELECT a.*, row_to_json(p.*) AS post
       FROM alerts a
       LEFT JOIN discovered_posts p ON p.id = a.post_id
       WHERE a.id = $1`,
      [id]
    );
    if (!alertRows.length) return null;
    const alert = row(alertRows[0]);
    const { rows: logRows } = await query(
      `SELECT * FROM notification_logs WHERE alert_id = $1 ORDER BY sent_at ASC`,
      [id]
    );
    alert.notification_logs = rows(logRows);
    return alert;
  }
  return mock.alerts.get(id) || null;
}

module.exports = {
  listLocations, createLocation, getLocation, updateLocation, deleteLocation,
  listKeywords,  createKeyword,  getKeyword,  updateKeyword,  deleteKeyword,
  listRecipients, createRecipient, getRecipient, updateRecipient, deleteRecipient,
  listPosts,
  listAlerts, getAlert,
};
