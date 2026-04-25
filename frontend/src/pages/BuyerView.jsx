import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const BIDDER_TYPES = ['restaurant', 'retailer', 'food_bank', 'wholesaler'];

function TimeLeft({ expiresAt }) {
    const [timeLeft, setTimeLeft] = useState('');
    const [urgent, setUrgent] = useState(false);

    useEffect(() => {
        const tick = () => {
            const diff = new Date(expiresAt) - new Date();
            if (diff <= 0) { setTimeLeft('Expired'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setUrgent(diff < 30 * 60000);
            setTimeLeft(h > 0 ? `${h}h ${m}m left` : `${m}m ${s}s left`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [expiresAt]);

    return (
        <span style={{
            color: urgent ? '#ef4444' : '#f59e0b',
            fontWeight: urgent ? 700 : 400,
            fontSize: 12
        }}>
            ⏱ {timeLeft}
        </span>
    );
}

function BidHistory({ bids }) {
    if (!bids || bids.length === 0) return (
        <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', padding: '8px 0' }}>
            No bids yet — be the first!
        </div>
    );

    return (
        <div style={{ maxHeight: 120, overflowY: 'auto' }}>
            {[...bids].reverse().map((bid, i) => (
                <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '5px 0',
                    borderBottom: '1px solid #f3f4f6',
                    fontSize: 12
                }}>
                    <div>
                        <span style={{ fontWeight: 600, color: '#111827' }}>{bid.bidderName}</span>
                        <span style={{
                            marginLeft: 6,
                            background: '#f3f4f6',
                            borderRadius: 4,
                            padding: '1px 6px',
                            fontSize: 10,
                            color: '#6b7280'
                        }}>
                            {bid.bidderType}
                        </span>
                        <span style={{ marginLeft: 6, color: '#9ca3af', fontSize: 10 }}>
                            {bid.location}
                        </span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#059669', fontSize: 13 }}>
                        ${bid.amount.toLocaleString()}
                    </span>
                </div>
            ))}
        </div>
    );
}

function AuctionCard({ auction, onBidPlaced }) {
    const [showBid, setShowBid] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [form, setForm] = useState({
        bidderName: '', bidderType: 'restaurant', amount: '', location: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const spoilageColor = auction.spoilageRisk > 90 ? '#ef4444'
        : auction.spoilageRisk > 70 ? '#f59e0b' : '#10b981';

    const cargoEmoji = {
        'Fresh Produce': '🥦',
        'Frozen Seafood': '🐟',
        'Pharmaceuticals': '💊',
        'Electronics': '📦',
        'Textiles': '🧵',
        'Automobile Parts': '⚙️'
    }[auction.cargo?.type] || '📦';

    const handleBid = async () => {
        if (!form.bidderName || !form.amount || !form.location) {
            setError('Please fill in all fields');
            return;
        }
        const amount = Number(form.amount);
        if (amount < auction.startingPrice) {
            setError(`Minimum bid is $${auction.startingPrice.toLocaleString()}`);
            return;
        }
        if (amount <= auction.currentHighestBid) {
            setError(`Must exceed current highest bid of $${auction.currentHighestBid.toLocaleString()}`);
            return;
        }
        setLoading(true);
        setError('');
        try {
            await axios.post(`/api/auctions/${auction._id}/bid`, {
                ...form, amount
            });
            setSuccess(`Bid of $${amount.toLocaleString()} placed successfully!`);
            setShowBid(false);
            setForm({ bidderName: '', bidderType: 'restaurant', amount: '', location: '' });
            onBidPlaced();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Bid failed');
        }
        setLoading(false);
    };

    return (
        <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            transition: 'box-shadow 0.2s',
            marginBottom: 20
        }}>
            {/* Urgency banner */}
            <div style={{
                background: spoilageColor,
                padding: '6px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 1 }}>
                    {auction.spoilageRisk}% SPOILAGE RISK — ACT NOW
                </span>
                <TimeLeft expiresAt={auction.expiresAt} />
            </div>

            <div style={{ padding: 20 }}>
                {/* Header */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    <div style={{
                        width: 64, height: 64,
                        background: '#f9fafb',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 32,
                        flexShrink: 0
                    }}>
                        {cargoEmoji}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
                            {auction.cargo?.type}
                        </div>
                        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
                            {Math.round(auction.cargo?.weightKg).toLocaleString()}kg
                            · Diverted from <strong>{auction.divertedFrom}</strong>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{
                                background: '#fef3c7', color: '#92400e',
                                borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600
                            }}>
                                PERISHABLE
                            </span>
                            <span style={{
                                background: '#d1fae5', color: '#065f46',
                                borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600
                            }}>
                                WASTE-ZERO AUCTION
                            </span>
                            <span style={{
                                background: '#ede9fe', color: '#5b21b6',
                                borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600
                            }}>
                                SDG 12
                            </span>
                        </div>
                    </div>
                </div>

                {/* Pricing row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 10,
                    marginBottom: 16
                }}>
                    <div style={{
                        background: '#f9fafb', borderRadius: 10,
                        padding: '10px 12px', textAlign: 'center'
                    }}>
                        <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 3 }}>STARTING PRICE</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>
                            ${auction.startingPrice.toLocaleString()}
                        </div>
                    </div>
                    <div style={{
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                        borderRadius: 10, padding: '10px 12px', textAlign: 'center'
                    }}>
                        <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 3 }}>HIGHEST BID</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#059669' }}>
                            {auction.currentHighestBid > 0
                                ? `$${auction.currentHighestBid.toLocaleString()}`
                                : '—'}
                        </div>
                    </div>
                    <div style={{
                        background: '#f9fafb', borderRadius: 10,
                        padding: '10px 12px', textAlign: 'center'
                    }}>
                        <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 3 }}>TOTAL BIDS</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>
                            {auction.bids?.length || 0}
                        </div>
                    </div>
                </div>

                {/* Sustainability impact */}
                {auction.sustainabilityMetrics && (
                    <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: 10,
                        padding: '10px 14px',
                        marginBottom: 16,
                        display: 'flex',
                        gap: 16,
                        alignItems: 'center'
                    }}>
                        <span style={{ fontSize: 22 }}>🌱</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#065f46', marginBottom: 3 }}>
                                YOUR BID PREVENTS WASTE
                            </div>
                            <div style={{ fontSize: 12, color: '#047857' }}>
                                {auction.sustainabilityMetrics.wastePreventedKg?.toLocaleString()}kg food saved
                                · {auction.sustainabilityMetrics.carbonSavedKg}kg CO₂ avoided
                                · ${auction.sustainabilityMetrics.estimatedValueSavedUSD?.toLocaleString()} rescued
                            </div>
                        </div>
                    </div>
                )}

                {/* Bid history toggle */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    style={{
                        background: 'none', border: 'none',
                        color: '#6b7280', fontSize: 12,
                        cursor: 'pointer', marginBottom: 8,
                        display: 'flex', alignItems: 'center', gap: 4
                    }}
                >
                    {expanded ? '▲' : '▼'} {auction.bids?.length || 0} bid{auction.bids?.length !== 1 ? 's' : ''}
                </button>

                {expanded && (
                    <div style={{ marginBottom: 12 }}>
                        <BidHistory bids={auction.bids} />
                    </div>
                )}

                {/* Success message */}
                {success && (
                    <div style={{
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                        borderRadius: 8, padding: '8px 12px',
                        fontSize: 13, color: '#065f46', fontWeight: 600,
                        marginBottom: 12
                    }}>
                        ✓ {success}
                    </div>
                )}

                {/* Bid form */}
                {showBid ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                placeholder="Your name / business"
                                value={form.bidderName}
                                onChange={e => setForm(p => ({ ...p, bidderName: e.target.value }))}
                                style={{
                                    flex: 1, border: '1px solid #d1d5db', borderRadius: 8,
                                    padding: '9px 12px', fontSize: 13, outline: 'none',
                                    fontFamily: 'inherit'
                                }}
                            />
                            <select
                                value={form.bidderType}
                                onChange={e => setForm(p => ({ ...p, bidderType: e.target.value }))}
                                style={{
                                    border: '1px solid #d1d5db', borderRadius: 8,
                                    padding: '9px 12px', fontSize: 13, background: '#fff',
                                    fontFamily: 'inherit'
                                }}
                            >
                                {BIDDER_TYPES.map(t => (
                                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                placeholder="Your location / city"
                                value={form.location}
                                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                                style={{
                                    flex: 1, border: '1px solid #d1d5db', borderRadius: 8,
                                    padding: '9px 12px', fontSize: 13, outline: 'none',
                                    fontFamily: 'inherit'
                                }}
                            />
                            <input
                                type="number"
                                placeholder={`Min $${Math.max(auction.startingPrice, auction.currentHighestBid + 1).toLocaleString()}`}
                                value={form.amount}
                                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                                style={{
                                    flex: 1, border: '1px solid #d1d5db', borderRadius: 8,
                                    padding: '9px 12px', fontSize: 13, outline: 'none',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>
                        {error && (
                            <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 500 }}>
                                {error}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                onClick={handleBid}
                                disabled={loading}
                                style={{
                                    flex: 1, background: '#059669', border: 'none',
                                    borderRadius: 8, padding: '10px',
                                    color: '#fff', fontSize: 13, fontWeight: 700,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                {loading ? 'Placing bid...' : 'Confirm Bid'}
                            </button>
                            <button
                                onClick={() => { setShowBid(false); setError(''); }}
                                style={{
                                    background: '#f3f4f6', border: 'none',
                                    borderRadius: 8, padding: '10px 16px',
                                    color: '#6b7280', fontSize: 13,
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowBid(true)}
                        style={{
                            width: '100%',
                            background: '#059669',
                            border: 'none',
                            borderRadius: 10,
                            padding: '12px',
                            color: '#fff',
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: 'pointer',
                            letterSpacing: 0.3
                        }}
                    >
                        Place Bid
                    </button>
                )}
            </div>
        </div>
    );
}

export default function BuyerView() {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newAlert, setNewAlert] = useState(null);

    const loadAuctions = async () => {
        try {
            const res = await axios.get('/api/auctions');
            setAuctions(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadAuctions();

        const socket = io('http://localhost:5000');

        socket.on('auction:new', (data) => {
            setNewAlert(data.message);
            setTimeout(() => setNewAlert(null), 5000);
            loadAuctions();
        });

        socket.on('auction:bid', () => loadAuctions());
        socket.on('auction:closed', () => loadAuctions());

        return () => socket.disconnect();
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f9fafb',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            {/* Header */}
            <div style={{
                background: '#fff',
                borderBottom: '1px solid #e5e7eb',
                padding: '0 24px',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{
                    maxWidth: 800,
                    margin: '0 auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: 64
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            background: '#059669',
                            borderRadius: 8,
                            padding: '6px 10px',
                            fontSize: 16,
                            fontWeight: 800,
                            color: '#fff',
                            letterSpacing: 1
                        }}>
                            NEXUS
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                                Waste-Zero Marketplace
                            </div>
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>
                                Diverted goods · Live auctions · SDG 12
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: '#f0fdf4', border: '1px solid #bbf7d0',
                            borderRadius: 20, padding: '4px 12px'
                        }}>
                            <div style={{
                                width: 7, height: 7, borderRadius: '50%',
                                background: '#10b981',
                                boxShadow: '0 0 6px #10b981'
                            }} />
                            <span style={{ fontSize: 12, color: '#065f46', fontWeight: 600 }}>
                                {auctions.length} Live Auction{auctions.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        <a href="/"
                            style={{
                                fontSize: 12, color: '#6b7280',
                                textDecoration: 'none'
                            }}
                        >
                            ← Operator View
                        </a>
                    </div>
                </div>
            </div>

            {/* New auction alert banner */}
            {
                newAlert && (
                    <div style={{
                        background: '#059669',
                        color: '#fff',
                        padding: '10px 24px',
                        fontSize: 13,
                        fontWeight: 600,
                        textAlign: 'center',
                        animation: 'slideDown 0.3s ease-out'
                    }}>
                        ⚡ {newAlert}
                    </div>
                )
            }

            <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 24px' }}>
                {/* Hero */}
                <div style={{
                    background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
                    borderRadius: 16,
                    padding: '24px 28px',
                    marginBottom: 28,
                    color: '#fff'
                }}>
                    <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
                        Buy diverted goods. Prevent waste.
                    </div>
                    <div style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.6, marginBottom: 16 }}>
                        When supply chain disruptions divert perishable shipments, we auction them
                        to local businesses at reduced prices — saving food, reducing carbon, and
                        supporting communities.
                    </div>
                    <div style={{ display: 'flex', gap: 20 }}>
                        {[
                            { icon: '🌱', label: 'Zero Food Waste' },
                            { icon: '💰', label: 'Up to 60% off' },
                            { icon: '⚡', label: 'Real-time bidding' },
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 18 }}>{item.icon}</span>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Auctions */}
                {loading && (
                    <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
                        Loading available goods...
                    </div>
                )}

                {!loading && auctions.length === 0 && (
                    <div style={{
                        textAlign: 'center', padding: 60,
                        background: '#fff', borderRadius: 16,
                        border: '1px solid #e5e7eb'
                    }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🟢</div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                            No active auctions right now
                        </div>
                        <div style={{ fontSize: 13, color: '#9ca3af' }}>
                            New goods appear here when supply chain disruptions are detected.
                            Check back soon or refresh the page.
                        </div>
                    </div>
                )}

                {auctions.map(auction => (
                    <AuctionCard
                        key={auction._id}
                        auction={auction}
                        onBidPlaced={loadAuctions}
                    />
                ))}
            </div>
        </div >
    );
}