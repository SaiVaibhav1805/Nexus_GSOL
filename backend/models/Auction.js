import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
    bidderName: { type: String, required: true },
    bidderType: { type: String, enum: ['restaurant', 'retailer', 'food_bank', 'wholesaler'], required: true },
    amount: { type: Number, required: true },
    location: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const auctionSchema = new mongoose.Schema({
    shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
    trackingId: { type: String, required: true },
    cargo: { type: mongoose.Schema.Types.Mixed, required: true },
    originalDestination: { type: String, required: true },
    divertedFrom: { type: String, required: true },
    startingPrice: { type: Number, required: true },
    currentHighestBid: { type: Number, default: 0 },
    bids: [bidSchema],
    status: { type: String, enum: ['active', 'closed', 'diverted'], default: 'active' },
    expiresAt: { type: Date, required: true },
    spoilageRisk: { type: Number, required: true },
    sustainabilityMetrics: {
        originalPathCarbonKg: Number,
        reroutedPathCarbonKg: Number,
        carbonSavedKg: Number,
        wastePreventedKg: Number,
        estimatedValueSavedUSD: Number
    }
}, { timestamps: true });

export default mongoose.model('Auction', auctionSchema);