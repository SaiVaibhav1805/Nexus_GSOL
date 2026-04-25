import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
  originHub: { type: mongoose.Schema.Types.ObjectId, ref: 'Hub', required: true },
  destinationHub: { type: mongoose.Schema.Types.ObjectId, ref: 'Hub', required: true },
  travelTimeHours: { type: Number, required: true },
  distanceKm: { type: Number, required: true },
  transportMode: { type: String, enum: ['sea', 'road', 'rail', 'air'], default: 'road' },
  currentRiskLevel: { type: Number, default: 0, min: 0, max: 100 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Route', routeSchema);