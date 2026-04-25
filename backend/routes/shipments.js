import express from 'express';
import Shipment from '../models/Shipment.js';
const router = express.Router();

router.get('/', async (req, res) => {
  const shipments = await Shipment.find().populate('activePath');
  res.json(shipments);
});

router.get('/:id', async (req, res) => {
  const shipment = await Shipment.findById(req.params.id).populate('activePath');
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
  res.json(shipment);
});

export default router;