'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { recipients } = require('../mockStore');

const router = Router();

// GET /api/recipients
router.get('/', (_req, res) => {
  const items = [...recipients.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
  res.json(items);
});

// POST /api/recipients
router.post('/', (req, res) => {
  const { email, name = null, is_active = true } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(422).json({ detail: 'valid email is required' });
  }
  const rec = { id: uuidv4(), email, name, is_active, created_at: new Date().toISOString() };
  recipients.set(rec.id, rec);
  res.status(201).json(rec);
});

// GET /api/recipients/:id
router.get('/:id', (req, res) => {
  const rec = recipients.get(req.params.id);
  if (!rec) return res.status(404).json({ detail: 'Recipient not found' });
  res.json(rec);
});

// PUT /api/recipients/:id
router.put('/:id', (req, res) => {
  const rec = recipients.get(req.params.id);
  if (!rec) return res.status(404).json({ detail: 'Recipient not found' });
  const allowed = ['email', 'name', 'is_active'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) rec[key] = req.body[key];
  }
  res.json(rec);
});

// DELETE /api/recipients/:id
router.delete('/:id', (req, res) => {
  if (!recipients.has(req.params.id)) return res.status(404).json({ detail: 'Recipient not found' });
  recipients.delete(req.params.id);
  res.status(204).end();
});

module.exports = router;
