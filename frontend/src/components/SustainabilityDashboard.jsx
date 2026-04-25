import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNexus } from '../context/NexusContext';

function MetricCard({ label, value, unit, color, icon }) {
    return (
        <div style={{
            background: '#111827',
            border: `1px solid ${color}33`,
            borderRadius: 10,
            padding: '12px 14px',
            flex: 1
        }}>
            <div style={{ fontSize: 10, color: '#64748b', letterSpacing: 1, marginBottom: 6 }}>
                {label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color }}>
                {value}
                <span style={{ fontSize: 12, fontWeight: 400, color: '#64748b', marginLeft: 4 }}>
                    {unit}
                </span>
            </div>
            <div style={{ fontSize: 18, marginTop: 4 }}>{icon}</div>
        </div>
    );
}

function SDGBadge({ number, title, color }) {
    return (
        <div style={{
            background: `${color}22`,
            border: `1px solid ${color}44`,
            borderRadius: 8,
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 8
        }}>
            <div style={{
                background: color,
                borderRadius: 4,
                width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0
            }}>
                {number}
            </div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{title}</span>
        </div>
    );
}

export default function SustainabilityDashboard({ onClose }) {
    const { shipments } = useNexus();
    const [auctions, setAuctions] = useState([]);
    const [allAuctions, setAllAuctions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get('/api/auctions/all');
                setAllAuctions(res.data);
                setAuctions(res.data.filter(a => a.status === 'active'));
            } catch {
                // fallback to active only
                const res = await axios.get('/api/auctions');
                setAllAuctions(res.data);
                setAuctions(res.data);
            }
            setLoading(false);
        };
        load();
    }, []);

    // Aggregate metrics across all auctions
    const totalCarbonSaved = allAuctions.reduce((sum, a) =>
        sum + (a.sustainabilityMetrics?.carbonSavedKg || 0), 0);

    const totalWastePrevented = allAuctions.reduce((sum, a) =>
        sum + (a.sustainabilityMetrics?.wastePreventedKg || 0), 0);

    const totalValueSaved = allAuctions.reduce((sum, a) =>
        sum + (a.sustainabilityMetrics?.estimatedValueSavedUSD || 0), 0);

    const totalBids = allAuctions.reduce((sum, a) =>
        sum + (a.bids?.length || 0), 0);

    const perishableAtRisk = shipments.filter(
        s => s.status === 'at_risk' && s.cargo?.isPerishable
    ).length;

    const diverted = shipments.filter(s => s.status === 'diverted').length;

    // Carbon equivalent calculations
    const treesEquivalent = Math.round(totalCarbonSaved / 21);
    const carKmEquivalent = Math.round(totalCarbonSaved * 4.6);

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.7)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                background: '#0d1321',
                border: '1px solid #1e2d4a',
                borderRadius: 16,
                width: 680,
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: 24
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 20
                }}>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>
                            Sustainability Impact
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                            Real-time waste prevention and carbon metrics
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none', border: 'none',
                            color: '#64748b', cursor: 'pointer', fontSize: 22
                        }}
                    >
                        ×
                    </button>
                </div>

                {loading ? (
                    <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>
                        Loading metrics...
                    </div>
                ) : (
                    <>
                        {/* Primary metrics */}
                        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                            <MetricCard
                                label="CARBON SAVED"
                                value={totalCarbonSaved.toLocaleString()}
                                unit="kg CO₂"
                                color="#34d399"
                                icon="🌱"
                            />
                            <MetricCard
                                label="WASTE PREVENTED"
                                value={totalWastePrevented.toLocaleString()}
                                unit="kg"
                                color="#38bdf8"
                                icon="♻️"
                            />
                            <MetricCard
                                label="VALUE RESCUED"
                                value={`$${totalValueSaved.toLocaleString()}`}
                                unit=""
                                color="#a78bfa"
                                icon="💰"
                            />
                        </div>

                        {/* Secondary metrics */}
                        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                            <MetricCard
                                label="ACTIVE AUCTIONS"
                                value={auctions.length}
                                unit="live"
                                color="#f59e0b"
                                icon="⚡"
                            />
                            <MetricCard
                                label="TOTAL BIDS"
                                value={totalBids}
                                unit="placed"
                                color="#f59e0b"
                                icon="🏷️"
                            />
                            <MetricCard
                                label="SHIPMENTS DIVERTED"
                                value={diverted}
                                unit="saved"
                                color="#34d399"
                                icon="🚚"
                            />
                        </div>

                        {/* Carbon equivalents */}
                        <div style={{
                            background: '#111827',
                            border: '1px solid #1e3a2f',
                            borderRadius: 10,
                            padding: 14,
                            marginBottom: 20
                        }}>
                            <div style={{
                                fontSize: 10, color: '#34d399',
                                letterSpacing: 1, marginBottom: 12
                            }}>
                                CARBON SAVINGS EQUIVALENT TO
                            </div>
                            <div style={{ display: 'flex', gap: 20 }}>
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ fontSize: 28, marginBottom: 4 }}>🌳</div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: '#34d399' }}>
                                        {treesEquivalent}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>trees planted</div>
                                </div>
                                <div style={{
                                    width: 1, background: '#1e2d4a', alignSelf: 'stretch'
                                }} />
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ fontSize: 28, marginBottom: 4 }}>🚗</div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: '#34d399' }}>
                                        {carKmEquivalent.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>car km avoided</div>
                                </div>
                                <div style={{
                                    width: 1, background: '#1e2d4a', alignSelf: 'stretch'
                                }} />
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ fontSize: 28, marginBottom: 4 }}>🏭</div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: '#34d399' }}>
                                        {perishableAtRisk}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>perishable loads at risk</div>
                                </div>
                            </div>
                        </div>

                        {/* Per-auction breakdown */}
                        {allAuctions.length > 0 && (
                            <div>
                                <div style={{
                                    fontSize: 10, color: '#64748b',
                                    letterSpacing: 1, marginBottom: 10
                                }}>
                                    AUCTION BREAKDOWN
                                </div>
                                {allAuctions.map(auction => (
                                    <div key={auction._id} style={{
                                        background: '#111827',
                                        border: '1px solid #1e2d4a',
                                        borderRadius: 8,
                                        padding: '10px 12px',
                                        marginBottom: 8,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                                                {auction.trackingId}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                                {auction.cargo?.type} · {auction.bids?.length || 0} bids
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 12, color: '#34d399' }}>
                                                {auction.sustainabilityMetrics?.carbonSavedKg || 0}kg CO₂ saved
                                            </div>
                                            <div style={{ fontSize: 11, color: '#64748b' }}>
                                                {auction.sustainabilityMetrics?.wastePreventedKg || 0}kg waste prevented
                                            </div>
                                        </div>
                                        <div style={{
                                            marginLeft: 12,
                                            background: auction.status === 'active' ? '#1a2d1a' : '#1a1a2d',
                                            border: `1px solid ${auction.status === 'active' ? '#34d399' : '#64748b'}`,
                                            borderRadius: 6,
                                            padding: '3px 8px',
                                            fontSize: 10,
                                            color: auction.status === 'active' ? '#34d399' : '#64748b',
                                            fontWeight: 600
                                        }}>
                                            {auction.status.toUpperCase()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* SDG alignment */}
                        <div style={{ marginTop: 20 }}>
                            <div style={{
                                fontSize: 10, color: '#64748b',
                                letterSpacing: 1, marginBottom: 10
                            }}>
                                UN SDG ALIGNMENT
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <SDGBadge
                                    number="SDG 12"
                                    title="Responsible Consumption — preventing food waste through real-time diversion"
                                    color="#bf8b2e"
                                />
                                <SDGBadge
                                    number="SDG 13"
                                    title="Climate Action — reducing carbon emissions via optimized routing"
                                    color="#3f7e44"
                                />
                                <SDGBadge
                                    number="SDG 9"
                                    title="Industry Innovation — AI-powered supply chain resilience"
                                    color="#fd6925"
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}