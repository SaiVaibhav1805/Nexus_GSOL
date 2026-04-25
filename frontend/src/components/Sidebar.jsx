import { useNexus } from '../context/NexusContext';

const statusColor = { on_time: '#34d399', at_risk: '#ef4444', delayed: '#f59e0b', delivered: '#94a3b8' };

export default function Sidebar() {
    const { hubs, shipments, atRiskShipments, connected, setSelectedShipment, selectedShipment } = useNexus();

    const totalAtRisk = shipments.filter(s => s.status === 'at_risk').length;
    const totalDisrupted = hubs.filter(h => h.status === 'disrupted').length;

    return (
        <div style={{
            width: 300,
            height: '100vh',
            background: '#0d1321',
            borderRight: '1px solid #1e2d4a',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1e2d4a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: connected ? '#34d399' : '#ef4444',
                        boxShadow: connected ? '0 0 6px #34d399' : '0 0 6px #ef4444'
                    }} />
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                        {connected ? 'LIVE' : 'DISCONNECTED'}
                    </span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', letterSpacing: 2 }}>
                    NEXUS
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    Supply Chain Intelligence
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 12 }}>
                {[
                    { label: 'Total Hubs', value: hubs.length, color: '#38bdf8' },
                    { label: 'Shipments', value: shipments.length, color: '#a78bfa' },
                    { label: 'At Risk', value: totalAtRisk, color: '#ef4444' },
                    { label: 'Disrupted Hubs', value: totalDisrupted, color: '#f59e0b' },
                ].map(stat => (
                    <div key={stat.label} style={{
                        background: '#111827',
                        border: '1px solid #1e2d4a',
                        borderRadius: 8,
                        padding: '10px 12px'
                    }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* At Risk Shipments */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '8px 12px', fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 1 }}>
                    AT-RISK SHIPMENTS
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
                    {shipments
                        .filter(s => s.status === 'at_risk')
                        .sort((a, b) => (b.rippleScore || 0) - (a.rippleScore || 0))
                        .map(shipment => (
                            <div
                                key={shipment._id}
                                onClick={() => setSelectedShipment(shipment)}
                                style={{
                                    background: selectedShipment?._id === shipment._id ? '#1a2035' : '#111827',
                                    border: `1px solid ${selectedShipment?._id === shipment._id ? '#3b82f6' : '#1e2d4a'}`,
                                    borderRadius: 8,
                                    padding: '10px 12px',
                                    marginBottom: 6,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                                        {shipment.trackingId}
                                    </span>
                                    <span style={{
                                        fontSize: 12, fontWeight: 700,
                                        color: shipment.rippleScore > 80 ? '#ef4444' : '#f59e0b'
                                    }}>
                                        {shipment.rippleScore}
                                    </span>
                                </div>
                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                                    {shipment.cargo?.type} · {shipment.origin} → {shipment.destination}
                                </div>
                                <div style={{ marginTop: 6, height: 3, background: '#1e2d4a', borderRadius: 2 }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${shipment.rippleScore}%`,
                                        background: shipment.rippleScore > 80 ? '#ef4444' : '#f59e0b',
                                        borderRadius: 2,
                                        transition: 'width 0.5s'
                                    }} />
                                </div>
                            </div>
                        ))}
                    {shipments.filter(s => s.status === 'at_risk').length === 0 && (
                        <div style={{ color: '#64748b', fontSize: 12, textAlign: 'center', padding: 20 }}>
                            No active disruptions
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}