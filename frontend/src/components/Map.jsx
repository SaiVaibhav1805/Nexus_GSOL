import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet';
import { useNexus } from '../context/NexusContext';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const HUB_COLORS = {
    port: '#38bdf8',
    warehouse: '#a78bfa',
    distributor: '#34d399',
};

const HUB_SIZES = {
    port: 14,
    warehouse: 10,
    distributor: 7,
};

function PulsingMarker({ hub }) {
    const map = useMap();
    const markerRef = useRef(null);

    useEffect(() => {
        if (!hub.status === 'disrupted') return;

        const pulseIcon = L.divIcon({
            className: '',
            html: `
        <div style="position:relative;width:40px;height:40px;transform:translate(-50%,-50%)">
          <div style="
            position:absolute;top:50%;left:50%;
            width:40px;height:40px;
            border-radius:50%;
            background:rgba(239,68,68,0.3);
            transform:translate(-50%,-50%);
            animation:pulse-ring 1.5s ease-out infinite;
          "></div>
          <div style="
            position:absolute;top:50%;left:50%;
            width:24px;height:24px;
            border-radius:50%;
            background:rgba(239,68,68,0.5);
            transform:translate(-50%,-50%);
            animation:pulse-ring 1.5s ease-out infinite 0.3s;
          "></div>
          <div style="
            position:absolute;top:50%;left:50%;
            width:14px;height:14px;
            border-radius:50%;
            background:#ef4444;
            border:2px solid #fff;
            transform:translate(-50%,-50%);
            box-shadow:0 0 10px #ef4444;
          "></div>
        </div>
      `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        const marker = L.marker([hub.location.lat, hub.location.lng], { icon: pulseIcon })
            .addTo(map);

        markerRef.current = marker;
        return () => marker.remove();
    }, [hub.status, map]);

    return null;
}

function HubMarkers() {
    const { hubs, setSelectedHub, selectedHub } = useNexus();

    return hubs.map(hub => {
        const isDisrupted = hub.status === 'disrupted';
        const color = isDisrupted ? '#ef4444' : HUB_COLORS[hub.type];
        const size = HUB_SIZES[hub.type];

        return (
            <div key={hub._id}>
                {isDisrupted && <PulsingMarker hub={hub} />}
                {!isDisrupted && (
                    <CircleMarker
                        center={[hub.location.lat, hub.location.lng]}
                        radius={size}
                        pathOptions={{
                            color,
                            fillColor: color,
                            fillOpacity: selectedHub?._id === hub._id ? 1 : 0.8,
                            weight: selectedHub?._id === hub._id ? 3 : 1.5
                        }}
                        eventHandlers={{ click: () => setSelectedHub(hub) }}
                    >
                        <Tooltip direction="top" offset={[0, -size]}>
                            <div style={{
                                background: '#1a2035',
                                border: '1px solid #3a4a6b',
                                padding: '6px 10px',
                                borderRadius: 6
                            }}>
                                <div style={{ color, fontWeight: 600, fontSize: 13 }}>{hub.name}</div>
                                <div style={{ color: '#94a3b8', fontSize: 11 }}>
                                    {hub.type} · health {hub.healthScore}%
                                </div>
                            </div>
                        </Tooltip>
                    </CircleMarker>
                )}
            </div>
        );
    });
}

function AnimatedShipmentPaths() {
    const { shipments, setSelectedShipment, selectedShipment } = useNexus();

    return shipments.map(shipment => {
        if (!shipment.activePath || shipment.activePath.length < 2) return null;

        const positions = shipment.activePath.map(h => [h.location.lat, h.location.lng]);
        const isAtRisk = shipment.status === 'at_risk';
        const isSelected = selectedShipment?._id === shipment._id;

        const color = isAtRisk ? '#ef4444' : isSelected ? '#f59e0b' : '#3b82f6';
        const weight = isSelected ? 4 : isAtRisk ? 2.5 : 1.5;
        const opacity = isSelected ? 1 : isAtRisk ? 0.9 : 0.35;
        const dashArray = isAtRisk ? '8 5' : isSelected ? null : '4 6';

        return (
            <Polyline
                key={shipment._id}
                positions={positions}
                pathOptions={{ color, weight, opacity, dashArray }}
                eventHandlers={{ click: () => setSelectedShipment(shipment) }}
            >
                <Tooltip sticky>
                    <div style={{
                        background: '#1a2035',
                        border: '1px solid #3a4a6b',
                        padding: '6px 10px',
                        borderRadius: 6
                    }}>
                        <div style={{
                            color: isAtRisk ? '#ef4444' : '#38bdf8',
                            fontWeight: 600,
                            fontSize: 13
                        }}>
                            {shipment.trackingId}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: 11 }}>{shipment.cargo?.type}</div>
                        {isAtRisk && (
                            <div style={{ color: '#ef4444', fontSize: 11 }}>
                                Risk score: {shipment.rippleScore}
                            </div>
                        )}
                    </div>
                </Tooltip>
            </Polyline>
        );
    });
}

export default function Map() {
    return (
        <MapContainer
            center={[15.5, 78.0]}
            zoom={6}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            <HubMarkers />
            <AnimatedShipmentPaths />
        </MapContainer>
    );
}