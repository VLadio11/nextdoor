'use strict';

const { Router } = require('express');
const store = require('../store');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
    const location_id = req.query.location_id || null;
    res.json(await store.listPosts({ limit, offset, location_id }));
  } catch (e) { next(e); }
});

module.exports = router;
