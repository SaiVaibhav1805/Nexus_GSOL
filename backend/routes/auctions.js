import express from 'express';
import Auction from '../models/Auction.js';
import Shipment from '../models/Shipment.js';
import { io } from '../server.js';

const router = express.Router();

// GET all active auctions
router.get('/', async (req, res) => {
    try {
        const auctions = await Auction.find({ status: 'active' })
            .populate('shipmentId')
            .sort({ spoilageRisk: -1 });
        res.json(auctions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single auction
router.get('/:id', async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id).populate('shipmentId');
        if (!auction) return res.status(404).json({ error: 'Auction not found' });
        res.json(auction);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a bid on an auction
router.post('/:id/bid', async (req, res) => {
    try {
        const { bidderName, bidderType, amount, location } = req.body;
        const auction = await Auction.findById(req.params.id);

        if (!auction) return res.status(404).json({ error: 'Auction not found' });
        if (auction.status !== 'active') return res.status(400).json({ error: 'Auction is not active' });
        if (amount <= auction.currentHighestBid) {
            return res.status(400).json({ error: `Bid must be higher than current highest: $${auction.currentHighestBid}` });
        }
        if (amount < auction.startingPrice) {
            return res.status(400).json({ error: `Bid must be at least $${auction.startingPrice}` });
        }

        const bid = { bidderName, bidderType, amount, location };
        auction.bids.push(bid);
        auction.currentHighestBid = amount;
        await auction.save();

        // Broadcast bid update
        io.emit('auction:bid', {
            auctionId: auction._id,
            trackingId: auction.trackingId,
            bid,
            currentHighestBid: amount
        });

        res.json({ message: 'Bid placed successfully', auction });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST close an auction (accept highest bid)
router.post('/:id/close', async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);
        if (!auction) return res.status(404).json({ error: 'Auction not found' });

        auction.status = 'closed';
        await auction.save();

        // Update shipment status
        await Shipment.findByIdAndUpdate(auction.shipmentId, { status: 'diverted' });

        io.emit('auction:closed', {
            auctionId: auction._id,
            trackingId: auction.trackingId,
            winner: auction.bids[auction.bids.length - 1],
            sustainabilityMetrics: auction.sustainabilityMetrics
        });

        res.json({ message: 'Auction closed', auction });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/all', async (req, res) => {
    try {
        const auctions = await Auction.find().sort({ createdAt: -1 });
        res.json(auctions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


export default router;