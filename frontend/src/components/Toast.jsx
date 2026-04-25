import { useState, useEffect } from 'react';
import { useNexus } from '../context/NexusContext';

function ToastItem({ toast, onRemove }) {
    useEffect(() => {
        const timer = setTimeout(() => onRemove(toast.id), 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    const colors = {
        danger: { bg: '#1a0a0a', border: '#ef4444', accent: '#ef4444' },
        warning: { bg: '#1a140a', border: '#f59e0b', accent: '#f59e0b' },
        success: { bg: '#0a1a0e', border: '#34d399', accent: '#34d399' },
        info: { bg: '#0a1020', border: '#38bdf8', accent: '#38bdf8' },
    };

    const c = colors[toast.type] || colors.info;

    return (
        <div style={{
            background: c.bg,
            border: `1px solid ${c.border}`,
            borderLeft: `4px solid ${c.accent}`,
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 8,
            minWidth: 320,
            maxWidth: 400,
            animation: 'slideIn 0.3s ease-out',
            position: 'relative',
            cursor: 'pointer'
        }}
            onClick={() => onRemove(toast.id)}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: c.accent, marginBottom: 3 }}>
                    {toast.title}
                </div>
                <span style={{ color: '#64748b', fontSize: 16, marginLeft: 8 }}>×</span>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                {toast.message}
            </div>
            {/* Progress bar */}
            <div style={{
                position: 'absolute',
                bottom: 0, left: 0,
                height: 2,
                background: c.accent,
                borderRadius: '0 0 0 8px',
                animation: 'shrink 4s linear forwards'
            }} />
        </div>
    );
}

export default function Toast() {
    const { lastCascade } = useNexus();
    const [toasts, setToasts] = useState([]);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const addToast = (toast) => {
        const id = Date.now();
        setToasts(prev => [...prev, { ...toast, id }]);
    };

    useEffect(() => {
        if (!lastCascade) return;

        const { signal, atRiskShipments, totalAffected } = lastCascade;

        // Main cascade alert
        addToast({
            type: 'danger',
            title: `Cascade Detected — ${signal.affectedHubId?.name || 'Hub'}`,
            message: `${totalAffected} shipment${totalAffected !== 1 ? 's' : ''} at risk · Severity ${signal.severity}/10 · ${signal.type.replace('_', ' ')}`
        });

        // Perishable warning
        const perishable = atRiskShipments.filter(s => s.cargo?.isPerishable);
        if (perishable.length > 0) {
            setTimeout(() => {
                addToast({
                    type: 'warning',
                    title: `${perishable.length} Perishable Cargo at Risk`,
                    message: `Flash auction triggered for ${perishable[0].trackingId}${perishable.length > 1 ? ` and ${perishable.length - 1} more` : ''}`
                });
            }, 800);
        }

        // Gemini ready
        setTimeout(() => {
            addToast({
                type: 'info',
                title: 'AI Analysis Complete',
                message: `Gemini has analyzed top ${Math.min(3, totalAffected)} shipments — reroute options available`
            });
        }, 1600);

    }, [lastCascade]);

    if (toasts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column-reverse'
        }}>
            <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
    );
}