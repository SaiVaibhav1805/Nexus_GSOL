import mongoose from 'mongoose';

const hubSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['port', 'warehouse', 'distributor'], required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  capacity: { type: Number, default: 100 },
  healthScore: { type: Number, default: 100, min: 0, max: 100 },
  status: { type: String, enum: ['active', 'disrupted', 'congested'], default: 'active' }
}, { timestamps: true });

export default mongoose.model('Hub', hubSchema);