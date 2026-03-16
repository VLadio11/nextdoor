'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { locations } = require('../mockStore');

const router = Router();

// GET /api/locations
router.get('/', (_req, res) => {
  const items = [...locations.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
  res.json(items);
});

// POST /api/locations
router.post('/', (req, res) => {
  const { name, latitude, longitude, radius_km = 5.0, is_active = true } = req.body;
  if (!name || latitude == null || longitude == null) {
    return res.status(422).json({ detail: 'name, latitude, and longitude are required' });
  }
  const loc = { id: uuidv4(), name, latitude, longitude, radius_km, is_active, created_at: new Date().toISOString() };
  locations.set(loc.id, loc);
  res.status(201).json(loc);
});

// GET /api/locations/:id
router.get('/:id', (req, res) => {
  const loc = locations.get(req.params.id);
  if (!loc) return res.status(404).json({ detail: 'Location not found' });
  res.json(loc);
});

// PUT /api/locations/:id
router.put('/:id', (req, res) => {
  const loc = locations.get(req.params.id);
  if (!loc) return res.status(404).json({ detail: 'Location not found' });
  const allowed = ['name', 'latitude', 'longitude', 'radius_km', 'is_active'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) loc[key] = req.body[key];
  }
  res.json(loc);
});

// DELETE /api/locations/:id
router.delete('/:id', (req, res) => {
  if (!locations.has(req.params.id)) return res.status(404).json({ detail: 'Location not found' });
  locations.delete(req.params.id);
  res.status(204).end();
});

module.exports = router;
