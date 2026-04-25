import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema({
  trackingId: { type: String, required: true, unique: true },
  cargo: {
    type: { type: String, required: true },
    isPerishable: { type: Boolean, default: false },
    perishabilityIndex: { type: Number, default: 0, min: 0, max: 100 },
    weightKg: Number,
    valueUSD: Number
  },
  // THIS is the key — the ordered list of hub IDs forming the graph path
  activePath: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hub' }],
  currentHubIndex: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['on_time', 'at_risk', 'delayed', 'delivered', 'diverted'],
    default: 'on_time'
  },
  rippleScore: { type: Number, default: 0 },
  estimatedDelivery: Date,
  origin: String,
  destination: String,
  geminiAnalysis: {
    confidenceScore: Number,
    explanation: String,
    rerouteOptions: [mongoose.Schema.Types.Mixed],
    analyzedAt: Date
  }
}, { timestamps: true });

export default mongoose.model('Shipment', shipmentSchema);