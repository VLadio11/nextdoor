'use strict';

const { Router } = require('express');
const store = require('../store');

const router = Router();

router.get('/', async (_req, res, next) => {
  try { res.json(await store.listLocations()); } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, latitude, longitude, radius_km, is_active } = req.body;
    if (!name || latitude == null || longitude == null) {
      return res.status(422).json({ detail: 'name, latitude, and longitude are required' });
    }
    res.status(201).json(await store.createLocation({ name, latitude, longitude, radius_km, is_active }));
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const loc = await store.getLocation(req.params.id);
    if (!loc) return res.status(404).json({ detail: 'Location not found' });
    res.json(loc);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const loc = await store.updateLocation(req.params.id, req.body);
    if (!loc) return res.status(404).json({ detail: 'Location not found' });
    res.json(loc);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await store.deleteLocation(req.params.id);
    if (!deleted) return res.status(404).json({ detail: 'Location not found' });
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
