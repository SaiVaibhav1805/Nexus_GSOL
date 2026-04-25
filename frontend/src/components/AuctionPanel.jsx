import { useState, useEffect } from 'react';
import { useNexus } from '../context/NexusContext';
import axios from 'axios';

const BIDDER_TYPES = ['restaurant', 'retailer', 'food_bank', 'wholesaler'];

function TimeLeft({ expiresAt }) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const tick = () => {
            const diff = new Date(expiresAt) - new Date();
            if (diff <= 0) { setTimeLeft('Expired'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${h}h ${m}m ${s}s`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [expiresAt]);

    return <span style={{ color: '#f59e0b', fontSize: 11 }}>{timeLeft}</span>;
}

function AuctionCard({ auction, onBid }) {
    const [showBid, setShowBid] = useState(false);
    const [bidForm, setBidForm] = useState({
        bidderName: '', bidderType: 'restaurant', amount: '', location: ''
    });
    const [bidding, setBidding] = useState(false);
    const [error, setError] = useState('');

    const handleBid = async () => {
        if (!bidForm.bidderName || !bidForm.amount || !bidForm.location) {
            setError('All fields required');
            return;
        }
        setBidding(true);
        setError('');
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auctions/${auction._id}/bid`, {
                ...bidForm,
                amount: Number(bidForm.amount)
            });
            setShowBid(false);
            onBid();
        } catch (err) {
            setError(err.response?.data?.error || 'Bid failed');
        }
        setBidding(false);
    };

    const riskColor = auction.spoilageRisk > 90 ? '#ef4444' : '#f59e0b';

    return (
        <div style={{
            background: '#111827',
            border: `1px solid ${riskColor}44`,
            borderRadius: 10,
            padding: 14,
            marginBottom: 10
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>
                        {auction.trackingId}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        {auction.cargo?.type} · {Math.round(auction.cargo?.weightKg)}kg
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: riskColor, fontWeight: 700 }}>
                        {auction.spoilageRisk}% SPOILAGE RISK
                    </div>
                    <TimeLeft expiresAt={auction.expiresAt} />
                </div>
            </div>

            {/* Route info */}
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                Diverted from: <span style={{ color: '#ef4444' }}>{auction.divertedFrom}</span>
                {' '}→ Originally: <span style={{ color: '#94a3b8' }}>{auction.originalDestination}</span>
            </div>

            {/* Pricing */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1, background: '#0d1321', borderRadius: 6, padding: '6px 10px' }}>
                    <div style={{ fontSize: 10, color: '#64748b' }}>Starting price</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#34d399' }}>
                        ${auction.startingPrice.toLocaleString()}
                    </div>
                </div>
                <div style={{ flex: 1, background: '#0d1321', borderRadius: 6, padding: '6px 10px' }}>
                    <div style={{ fontSize: 10, color: '#64748b' }}>Highest bid</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>
                        {auction.currentHighestBid > 0
                            ? `$${auction.currentHighestBid.toLocaleString()}`
                            : 'No bids yet'}
                    </div>
                </div>
                <div style={{ flex: 1, background: '#0d1321', borderRadius: 6, padding: '6px 10px' }}>
                    <div style={{ fontSize: 10, color: '#64748b' }}>Total bids</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>
                        {auction.bids?.length || 0}
                    </div>
                </div>
            </div>

            {/* Sustainability metrics */}
            {auction.sustainabilityMetrics && (
                <div style={{
                    background: '#0a1628',
                    border: '1px solid #1e3a2f',
                    borderRadius: 6,
                    padding: '8px 10px',
                    marginBottom: 10
                }}>
                    <div style={{ fontSize: 10, color: '#34d399', letterSpacing: 1, marginBottom: 6 }}>
                        SUSTAINABILITY IMPACT
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                            Carbon saved: <span style={{ color: '#34d399' }}>
                                {auction.sustainabilityMetrics.carbonSavedKg}kg CO₂
                            </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                            Waste prevented: <span style={{ color: '#34d399' }}>
                                {auction.sustainabilityMetrics.wastePreventedKg}kg
                            </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                            Value saved: <span style={{ color: '#34d399' }}>
                                ${auction.sustainabilityMetrics.estimatedValueSavedUSD?.toLocaleString()}
                            </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                            SDG 12: <span style={{ color: '#34d399' }}>Waste Zero</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Bid form */}
            {showBid ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input
                        placeholder="Your name / company"
                        value={bidForm.bidderName}
                        onChange={e => setBidForm(p => ({ ...p, bidderName: e.target.value }))}
                        style={{ background: '#0d1321', border: '1px solid #1e2d4a', borderRadius: 6, padding: '6px 8px', color: '#e2e8f0', fontSize: 12 }}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                        <select
                            value={bidForm.bidderType}
                            onChange={e => setBidForm(p => ({ ...p, bidderType: e.target.value }))}
                            style={{ flex: 1, background: '#0d1321', border: '1px solid #1e2d4a', borderRadius: 6, padding: '6px 8px', color: '#e2e8f0', fontSize: 12 }}
                        >
                            {BIDDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input
                            placeholder="Location"
                            value={bidForm.location}
                            onChange={e => setBidForm(p => ({ ...p, location: e.target.value }))}
                            style={{ flex: 1, background: '#0d1321', border: '1px solid #1e2d4a', borderRadius: 6, padding: '6px 8px', color: '#e2e8f0', fontSize: 12 }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <input
                            type="number"
                            placeholder={`Min $${auction.startingPrice}`}
                            value={bidForm.amount}
                            onChange={e => setBidForm(p => ({ ...p, amount: e.target.value }))}
                            style={{ flex: 1, background: '#0d1321', border: '1px solid #1e2d4a', borderRadius: 6, padding: '6px 8px', color: '#e2e8f0', fontSize: 12 }}
                        />
                        <button
                            onClick={handleBid}
                            disabled={bidding}
                            style={{ background: '#34d399', border: 'none', borderRadius: 6, padding: '6px 14px', color: '#0a1628', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        >
                            {bidding ? '...' : 'Place Bid'}
                        </button>
                        <button
                            onClick={() => setShowBid(false)}
                            style={{ background: '#1e2d4a', border: 'none', borderRadius: 6, padding: '6px 10px', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                    </div>
                    {error && <div style={{ fontSize: 11, color: '#ef4444' }}>{error}</div>}
                </div>
            ) : (
                <button
                    onClick={() => setShowBid(true)}
                    style={{
                        width: '100%', background: '#1a2d1a', border: '1px solid #34d399',
                        borderRadius: 6, padding: '7px', color: '#34d399',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer'
                    }}
                >
                    Place Bid
                </button>
            )}
        </div>
    );
}

export default function AuctionPanel({ onClose }) {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadAuctions = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auctions`);
            setAuctions(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => { loadAuctions(); }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0, right: 0,
            width: 400,
            height: '100vh',
            background: '#0d1321',
            border: '1px solid #1e2d4a',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px',
                borderBottom: '1px solid #1e2d4a',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>
                        Flash Auctions
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        Waste-Zero · SDG 12
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                        background: '#1a2d1a', border: '1px solid #34d399',
                        borderRadius: 12, padding: '2px 8px',
                        fontSize: 11, color: '#34d399', fontWeight: 600
                    }}>
                        {auctions.length} ACTIVE
                    </span>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* Auction list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
                {loading && (
                    <div style={{ color: '#64748b', fontSize: 12, textAlign: 'center', padding: 30 }}>
                        Loading auctions...
                    </div>
                )}
                {!loading && auctions.length === 0 && (
                    <div style={{ color: '#64748b', fontSize: 12, textAlign: 'center', padding: 30 }}>
                        No active auctions. Fire a signal on a hub carrying perishable cargo to trigger one.
                    </div>
                )}
                {auctions.map(auction => (
                    <AuctionCard key={auction._id} auction={auction} onBid={loadAuctions} />
                ))}
            </div>
        </div>
    );
}