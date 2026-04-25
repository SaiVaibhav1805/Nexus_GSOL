import mongoose from 'mongoose';

const signalSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['weather', 'port_congestion', 'strike', 'accident', 'customs_delay'],
    required: true
  },
  severity: { type: Number, required: true, min: 1, max: 10 },
  affectedHubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hub' },
  affectedRouteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  description: String,
  source: { type: String, default: 'manual' },
  radiusKm: { type: Number, default: 50 },
  isActive: { type: Boolean, default: true },
  expiresAt: Date
}, { timestamps: true });

export default mongoose.model('Signal', signalSchema);