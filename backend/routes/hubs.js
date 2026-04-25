import express from 'express';
import Hub from '../models/Hub.js';
const router = express.Router();

router.get('/', async (req, res) => {
  const hubs = await Hub.find();
  res.json(hubs);
});

router.get('/:id', async (req, res) => {
  const hub = await Hub.findById(req.params.id);
  if (!hub) return res.status(404).json({ error: 'Hub not found' });
  res.json(hub);
});

export default router;