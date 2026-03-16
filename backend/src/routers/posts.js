'use strict';

const { Router } = require('express');
const { posts } = require('../mockStore');

const router = Router();

// GET /api/posts?limit=50&offset=0&location_id=...
router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
  const locationId = req.query.location_id || null;

  let items = [...posts.values()].sort((a, b) => b.first_seen_at.localeCompare(a.first_seen_at));
  if (locationId) {
    items = items.filter((p) => p.location_id === locationId);
  }
  res.json(items.slice(offset, offset + limit));
});

module.exports = router;
