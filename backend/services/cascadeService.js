import Shipment from '../models/Shipment.js';
import Hub from '../models/Hub.js';
import Signal from '../models/Signal.js';
import { analyzeDisruption } from './geminiService.js';
import { createFlashAuction } from './AuctionService.js';

export async function runCascade(signal, io) {
    const affectedHubId = signal.affectedHubId._id
        ? signal.affectedHubId._id.toString()
        : signal.affectedHubId.toString();

    const allShipments = await Shipment.find({
        status: { $ne: 'delivered' }
    }).populate('activePath');

    const allHubs = await Hub.find();
    const atRiskShipments = [];

    for (const shipment of allShipments) {
        const pathIds = shipment.activePath.map(h => h._id.toString());
        const hubIndex = pathIds.indexOf(affectedHubId);
        if (hubIndex === -1) continue;

        const currentIndex = shipment.currentHubIndex;
        const distanceFromDisruption = hubIndex - currentIndex;
        if (distanceFromDisruption < 0) continue;

        const baseSeverity = signal.severity * 10;
        const distancePenalty = distanceFromDisruption * 8;
        const perishabilityBoost = shipment.cargo.isPerishable
            ? shipment.cargo.perishabilityIndex * 0.3
            : 0;

        const rippleScore = Math.min(
            100,
            Math.max(0, baseSeverity - distancePenalty + perishabilityBoost)
        );

        await Shipment.findByIdAndUpdate(shipment._id, {
            status: 'at_risk',
            rippleScore: Math.round(rippleScore)
        });

        atRiskShipments.push({
            shipmentId: shipment._id,
            trackingId: shipment.trackingId,
            cargo: shipment.cargo,
            origin: shipment.origin,
            destination: shipment.destination,
            activePath: shipment.activePath,
            currentHubIndex: shipment.currentHubIndex,
            rippleScore: Math.round(rippleScore),
            disruptedHub: affectedHubId,
            distanceFromDisruption
        });
    }

    atRiskShipments.sort((a, b) => b.rippleScore - a.rippleScore);

    await Hub.findByIdAndUpdate(affectedHubId, {
        status: 'disrupted',
        healthScore: Math.max(0, 100 - signal.severity * 10)
    });

    // Gemini analysis on top 3
    console.log('Running Gemini analysis on top at-risk shipments...');
    const top3 = atRiskShipments.slice(0, 3);

    for (const s of top3) {
        const geminiResult = await analyzeDisruption(signal, s, allHubs);

        await Shipment.findByIdAndUpdate(s.shipmentId, {
            geminiAnalysis: {
                confidenceScore: geminiResult.confidenceScore,
                explanation: geminiResult.explanation,
                rerouteOptions: geminiResult.rerouteOptions,
                analyzedAt: new Date()
            }
        });

        s.geminiAnalysis = geminiResult;

        // Auto-create flash auction if perishable + high risk
        await createFlashAuction(s, signal, io);
    }

    io.emit('cascade:update', {
        signal,
        atRiskShipments,
        totalAffected: atRiskShipments.length,
        timestamp: new Date()
    });

    console.log(`Cascade complete: ${atRiskShipments.length} shipments at risk`);
    return atRiskShipments;
}