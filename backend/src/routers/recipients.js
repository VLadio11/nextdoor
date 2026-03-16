'use strict';

const { Router } = require('express');
const store = require('../store');

const router = Router();

router.get('/', async (_req, res, next) => {
  try { res.json(await store.listRecipients()); } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { email, name, is_active } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(422).json({ detail: 'valid email is required' });
    }
    res.status(201).json(await store.createRecipient({ email, name, is_active }));
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const rec = await store.getRecipient(req.params.id);
    if (!rec) return res.status(404).json({ detail: 'Recipient not found' });
    res.json(rec);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const rec = await store.updateRecipient(req.params.id, req.body);
    if (!rec) return res.status(404).json({ detail: 'Recipient not found' });
    res.json(rec);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await store.deleteRecipient(req.params.id);
    if (!deleted) return res.status(404).json({ detail: 'Recipient not found' });
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
