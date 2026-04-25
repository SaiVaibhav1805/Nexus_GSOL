import Auction from '../models/Auction.js';
import Shipment from '../models/Shipment.js';

// Carbon emission factors (kg CO2 per km per ton)
const CARBON_FACTORS = {
    road: 0.062,
    sea: 0.008,
    rail: 0.022,
    air: 0.602
};

export function calculateSustainabilityMetrics(shipment, originalPathKm, reroutedPathKm) {
    const weightTons = (shipment.cargo.weightKg || 1000) / 1000;
    const mode = 'road';

    const originalCarbon = originalPathKm * weightTons * CARBON_FACTORS[mode];
    const reroutedCarbon = reroutedPathKm * weightTons * CARBON_FACTORS[mode];
    const carbonSaved = Math.max(0, originalCarbon - reroutedCarbon);

    // Waste prevented = weight of perishable cargo saved from spoilage
    const wastePreventedKg = shipment.cargo.isPerishable ? shipment.cargo.weightKg * 0.85 : 0;

    // Value saved = cargo value * spoilage risk percentage
    const valueSaved = (shipment.cargo.valueUSD || 0) * (shipment.rippleScore / 100);

    return {
        originalPathCarbonKg: Math.round(originalCarbon),
        reroutedPathCarbonKg: Math.round(reroutedCarbon),
        carbonSavedKg: Math.round(carbonSaved),
        wastePreventedKg: Math.round(wastePreventedKg),
        estimatedValueSavedUSD: Math.round(valueSaved)
    };
}

export async function createFlashAuction(shipment, signal, io) {
    // Only create auction for perishable cargo with high spoilage risk
    const spoilageRisk = shipment.geminiAnalysis?.confidenceScore || shipment.rippleScore;

    if (!shipment.cargo.isPerishable || spoilageRisk < 80) return null;

    // Check if auction already exists for this shipment
    const existing = await Auction.findOne({
        shipmentId: shipment.shipmentId,
        status: 'active'
    });
    if (existing) return existing;

    // Calculate sustainability metrics
    // Approximate distances: original full path vs diverted shorter path
    const originalPathKm = 800;
    const reroutedPathKm = 300;
    const metrics = calculateSustainabilityMetrics(
        shipment, originalPathKm, reroutedPathKm
    );

    // Starting price = 40% of original cargo value (distressed sale)
    const startingPrice = Math.round((shipment.cargo.valueUSD || 10000) * 0.4);

    const auction = await Auction.create({
        shipmentId: shipment.shipmentId,
        trackingId: shipment.trackingId,
        cargo: shipment.cargo,
        originalDestination: shipment.destination,
        divertedFrom: signal.affectedHubId?.name || 'Disrupted Hub',
        startingPrice,
        currentHighestBid: 0,
        status: 'active',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hour auction
        spoilageRisk,
        sustainabilityMetrics: metrics
    });

    // Broadcast new auction to all clients
    io.emit('auction:new', {
        auction,
        message: `Flash auction opened for ${shipment.trackingId} — ${shipment.cargo.type} at risk of spoilage`
    });

    console.log(`Flash auction created for ${shipment.trackingId} — spoilage risk ${spoilageRisk}%`);
    return auction;
}