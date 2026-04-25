import { useState } from 'react';
import { useNexus } from '../context/NexusContext';

export default function SignalControl() {
    const { hubs, fireSignal, refreshShipments } = useNexus();
    const [type, setType] = useState('port_congestion');
    const [severity, setSeverity] = useState(7);
    const [hubId, setHubId] = useState('');
    const [loading, setLoading] = useState(false);
    const [lastResult, setLastResult] = useState(null);

    const handleFire = async () => {
        if (!hubId) return;
        setLoading(true);
        try {
            const result = await fireSignal({ type, severity, affectedHubId: hubId });
            setLastResult(result.cascadeResult);
            await refreshShipments();
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0d1321',
            border: '1px solid #1e2d4a',
            borderRadius: 12,
            padding: '12px 16px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 600
        }}>
            <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', letterSpacing: 1 }}>
                FIRE SIGNAL
            </span>

            <select
                value={type}
                onChange={e => setType(e.target.value)}
                style={{ background: '#111827', border: '1px solid #1e2d4a', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 12 }}
            >
                <option value="port_congestion">Port Congestion</option>
                <option value="weather">Weather</option>
                <option value="strike">Strike</option>
                <option value="accident">Accident</option>
                <option value="customs_delay">Customs Delay</option>
            </select>

            <select
                value={hubId}
                onChange={e => setHubId(e.target.value)}
                style={{ background: '#111827', border: '1px solid #1e2d4a', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 12, flex: 1 }}
            >
                <option value="">Select hub...</option>
                {hubs.map(h => (
                    <option key={h._id} value={h._id}>{h.name}</option>
                ))}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>Severity</span>
                <input
                    type="range" min="1" max="10" value={severity}
                    onChange={e => setSeverity(Number(e.target.value))}
                    style={{ width: 80 }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: severity > 7 ? '#ef4444' : '#f59e0b', minWidth: 16 }}>
                    {severity}
                </span>
            </div>

            <button
                onClick={handleFire}
                disabled={!hubId || loading}
                style={{
                    background: loading ? '#1e2d4a' : '#ef4444',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 16px',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: hubId && !loading ? 'pointer' : 'not-allowed',
                    whiteSpace: 'nowrap'
                }}
            >
                {loading ? 'Analyzing...' : 'Fire'}
            </button>

            {lastResult && (
                <span style={{ fontSize: 12, color: '#ef4444', whiteSpace: 'nowrap' }}>
                    {lastResult.totalAffected} shipments at risk
                </span>
            )}
        </div>
    );
}