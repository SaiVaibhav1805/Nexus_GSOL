import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const NexusContext = createContext();

export function NexusProvider({ children }) {
    const [hubs, setHubs] = useState([]);
    const [shipments, setShipments] = useState([]);
    const [signals, setSignals] = useState([]);
    const [atRiskShipments, setAtRiskShipments] = useState([]);
    const [selectedShipment, setSelectedShipment] = useState(null);
    const [selectedHub, setSelectedHub] = useState(null);
    const [lastCascade, setLastCascade] = useState(null);
    const [connected, setConnected] = useState(false);
    const socketRef = useRef(null);

    // Load initial data
    useEffect(() => {
        axios.get('/api/hubs').then(r => setHubs(r.data));
        axios.get('/api/shipments').then(r => setShipments(r.data));
        axios.get('/api/signals').then(r => setSignals(r.data));
    }, []);

    // Socket.io connection
    useEffect(() => {
        socketRef.current = io('http://localhost:5000');

        socketRef.current.on('connect', () => {
            setConnected(true);
            console.log('Connected to Nexus server');
        });

        socketRef.current.on('disconnect', () => setConnected(false));

        socketRef.current.on('cascade:update', (data) => {
            console.log('Cascade update received:', data);
            setLastCascade(data);
            setAtRiskShipments(data.atRiskShipments);

            // Update shipments with new risk status
            setShipments(prev => prev.map(s => {
                const risk = data.atRiskShipments.find(
                    r => r.shipmentId === s._id
                );
                return risk ? { ...s, status: 'at_risk', rippleScore: risk.rippleScore, geminiAnalysis: risk.geminiAnalysis } : s;
            }));

            // Update hub health
            setHubs(prev => prev.map(h => {
                if (h._id === data.signal.affectedHubId._id) {
                    return { ...h, status: 'disrupted', healthScore: Math.max(0, 100 - data.signal.severity * 10) };
                }
                return h;
            }));
        });

        return () => socketRef.current.disconnect();
    }, []);

    const fireSignal = async (signalData) => {
        const res = await axios.post('/api/signals', signalData);
        setSignals(prev => [...prev, res.data.signal]);
        return res.data;
    };

    const refreshShipments = async () => {
        const res = await axios.get('/api/shipments');
        setShipments(res.data);
    };

    return (
        <NexusContext.Provider value={{
            hubs, shipments, signals, atRiskShipments,
            selectedShipment, setSelectedShipment,
            selectedHub, setSelectedHub,
            lastCascade, connected,
            fireSignal, refreshShipments
        }}>
            {children}
        </NexusContext.Provider>
    );
}

export const useNexus = () => useContext(NexusContext);