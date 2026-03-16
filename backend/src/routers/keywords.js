'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { keywords } = require('../mockStore');

const router = Router();

// GET /api/keywords
router.get('/', (_req, res) => {
  const items = [...keywords.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
  res.json(items);
});

// POST /api/keywords
router.post('/', (req, res) => {
  const { phrase, is_active = true } = req.body;
  if (!phrase || !phrase.trim()) {
    return res.status(422).json({ detail: 'phrase is required' });
  }
  const kw = { id: uuidv4(), phrase: phrase.trim().toLowerCase(), is_active, created_at: new Date().toISOString() };
  keywords.set(kw.id, kw);
  res.status(201).json(kw);
});

// GET /api/keywords/:id
router.get('/:id', (req, res) => {
  const kw = keywords.get(req.params.id);
  if (!kw) return res.status(404).json({ detail: 'Keyword not found' });
  res.json(kw);
});

// PUT /api/keywords/:id
router.put('/:id', (req, res) => {
  const kw = keywords.get(req.params.id);
  if (!kw) return res.status(404).json({ detail: 'Keyword not found' });
  if (req.body.phrase !== undefined) kw.phrase = req.body.phrase.trim().toLowerCase();
  if (req.body.is_active !== undefined) kw.is_active = req.body.is_active;
  res.json(kw);
});

// DELETE /api/keywords/:id
router.delete('/:id', (req, res) => {
  if (!keywords.has(req.params.id)) return res.status(404).json({ detail: 'Keyword not found' });
  keywords.delete(req.params.id);
  res.status(204).end();
});

module.exports = router;
