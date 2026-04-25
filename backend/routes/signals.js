import express from 'express';
import Signal from '../models/Signal.js';
import { runCascade } from '../services/cascadeService.js';
import { io } from '../server.js';

const router = express.Router();

// GET all active signals
router.get('/', async (req, res) => {
  try {
    const signals = await Signal.find({ isActive: true }).populate('affectedHubId');
    res.json(signals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new signal — this triggers the cascade
router.post('/', async (req, res) => {
  try {
    const { type, severity, affectedHubId, description, radiusKm } = req.body;

    // Validate required fields
    if (!type || !severity || !affectedHubId) {
      return res.status(400).json({
        error: 'type, severity, and affectedHubId are required'
      });
    }

    // Create the signal
    const signal = await Signal.create({
      type,
      severity,
      affectedHubId,
      description: description || `${type} detected`,
      radiusKm: radiusKm || 50,
      expiresAt: new Date(Date.now() + 24 * 3600000)
    });

    const populatedSignal = await signal.populate('affectedHubId');

    // Run cascade predictor immediately
    const atRiskShipments = await runCascade(populatedSignal, io);

    res.status(201).json({
      signal: populatedSignal,
      cascadeResult: {
        totalAffected: atRiskShipments.length,
        atRiskShipments
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE — resolve a signal
router.delete('/:id', async (req, res) => {
  try {
    await Signal.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Signal resolved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;