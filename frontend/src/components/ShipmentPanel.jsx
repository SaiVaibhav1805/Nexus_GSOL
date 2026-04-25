import { useNexus } from '../context/NexusContext';

export default function ShipmentPanel() {
    const { selectedShipment, setSelectedShipment } = useNexus();

    if (!selectedShipment) return null;

    const { geminiAnalysis } = selectedShipment;
    const riskColor = geminiAnalysis?.confidenceScore > 80 ? '#ef4444'
        : geminiAnalysis?.confidenceScore > 50 ? '#f59e0b' : '#34d399';

    return (
        <div style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 340,
            background: '#0d1321',
            border: '1px solid #1e2d4a',
            borderRadius: 12,
            padding: 16,
            zIndex: 1000,
            maxHeight: 'calc(100vh - 32px)',
            overflowY: 'auto'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>
                        {selectedShipment.trackingId}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        {selectedShipment.cargo?.type}
                        {selectedShipment.cargo?.isPerishable && (
                            <span style={{ color: '#f59e0b', marginLeft: 6 }}>PERISHABLE</span>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => setSelectedShipment(null)}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18 }}
                >
                    ×
                </button>
            </div>

            {/* Route */}
            <div style={{ background: '#111827', borderRadius: 8, padding: 10, marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6, letterSpacing: 1 }}>ROUTE</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {selectedShipment.activePath?.map((hub, i) => (
                        <div key={hub._id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                                fontSize: 11,
                                color: hub.status === 'disrupted' ? '#ef4444' : '#94a3b8',
                                fontWeight: hub.status === 'disrupted' ? 700 : 400
                            }}>
                                {hub.name}
                            </span>
                            {i < selectedShipment.activePath.length - 1 && (
                                <span style={{ color: '#3a4a6b' }}>→</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Risk Score */}
            <div style={{ background: '#111827', borderRadius: 8, padding: 10, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: '#64748b', letterSpacing: 1 }}>RIPPLE SCORE</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: riskColor }}>
                        {selectedShipment.rippleScore || 0}/100
                    </span>
                </div>
                <div style={{ height: 4, background: '#1e2d4a', borderRadius: 2 }}>
                    <div style={{
                        height: '100%',
                        width: `${selectedShipment.rippleScore || 0}%`,
                        background: riskColor,
                        borderRadius: 2
                    }} />
                </div>
            </div>

            {/* Gemini Analysis */}
            {geminiAnalysis && (
                <div>
                    <div style={{ fontSize: 10, color: '#64748b', letterSpacing: 1, marginBottom: 8 }}>
                        AI ANALYSIS
                    </div>

                    {/* Confidence Score */}
                    <div style={{
                        background: '#111827',
                        border: `1px solid ${riskColor}22`,
                        borderRadius: 8,
                        padding: 10,
                        marginBottom: 8
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>Failure confidence</span>
                            <span style={{ fontSize: 20, fontWeight: 700, color: riskColor }}>
                                {geminiAnalysis.confidenceScore}%
                            </span>
                        </div>
                    </div>

                    {/* Explanation */}
                    <div style={{
                        background: '#111827',
                        borderRadius: 8,
                        padding: 10,
                        marginBottom: 8,
                        fontSize: 12,
                        color: '#94a3b8',
                        lineHeight: 1.6
                    }}>
                        {geminiAnalysis.explanation}
                    </div>

                    {/* Reroute Options */}
                    {geminiAnalysis.rerouteOptions?.length > 0 && (
                        <div>
                            <div style={{ fontSize: 10, color: '#64748b', letterSpacing: 1, marginBottom: 6 }}>
                                REROUTE OPTIONS
                            </div>
                            {geminiAnalysis.rerouteOptions.map((opt, i) => (
                                <div key={i} style={{
                                    background: '#111827',
                                    border: '1px solid #1e2d4a',
                                    borderRadius: 8,
                                    padding: 10,
                                    marginBottom: 6
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>
                                            Option {opt.rank}
                                        </span>
                                        <span style={{
                                            fontSize: 10,
                                            color: opt.riskLevel === 'low' ? '#34d399' : opt.riskLevel === 'medium' ? '#f59e0b' : '#ef4444',
                                            fontWeight: 600
                                        }}>
                                            {opt.riskLevel?.toUpperCase()} RISK
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                                        {opt.description}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#34d399' }}>
                                        Saves: {opt.estimatedDelaySaved}
                                    </div>
                                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                                        {opt.reasoning}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}