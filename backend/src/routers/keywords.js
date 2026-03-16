'use strict';

const { Router } = require('express');
const store = require('../store');

const router = Router();

router.get('/', async (_req, res, next) => {
  try { res.json(await store.listKeywords()); } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { phrase, is_active } = req.body;
    if (!phrase || !phrase.trim()) {
      return res.status(422).json({ detail: 'phrase is required' });
    }
    res.status(201).json(await store.createKeyword({ phrase, is_active }));
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const kw = await store.getKeyword(req.params.id);
    if (!kw) return res.status(404).json({ detail: 'Keyword not found' });
    res.json(kw);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const kw = await store.updateKeyword(req.params.id, req.body);
    if (!kw) return res.status(404).json({ detail: 'Keyword not found' });
    res.json(kw);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await store.deleteKeyword(req.params.id);
    if (!deleted) return res.status(404).json({ detail: 'Keyword not found' });
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
