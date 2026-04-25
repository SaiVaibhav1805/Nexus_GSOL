import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NexusProvider, useNexus } from './context/NexusContext';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import ShipmentPanel from './components/ShipmentPanel';
import SignalControl from './components/SignalControl';
import AuctionPanel from './components/AuctionPanel';
import SustainabilityDashboard from './components/SustainabilityDashboard';
import Toast from './components/Toast';
import BuyerView from './pages/BuyerView';
import { io } from 'socket.io-client';

function NexusApp() {
  const [showAuctions, setShowAuctions] = useState(false);
  const [showSustainability, setShowSustainability] = useState(false);
  const [auctionCount, setAuctionCount] = useState(0);
  const [newAuction, setNewAuction] = useState(false);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    socket.on('auction:new', () => {
      setAuctionCount(c => c + 1);
      setNewAuction(true);
      setTimeout(() => setNewAuction(false), 3000);
    });
    return () => socket.disconnect();
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, position: 'relative' }}>
        <Map />
        <ShipmentPanel />
        <SignalControl />

        {/* Top center buttons */}
        <div style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 8,
          zIndex: 1000
        }}>
          <button
            onClick={() => setShowAuctions(true)}
            style={{
              background: newAuction ? '#34d399' : '#111827',
              border: `1px solid ${newAuction ? '#34d399' : '#1e2d4a'}`,
              borderRadius: 8,
              padding: '8px 16px',
              color: newAuction ? '#0a1628' : '#e2e8f0',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            ⚡ Flash Auctions
            {auctionCount > 0 && (
              <span style={{
                background: '#ef4444',
                borderRadius: '50%',
                width: 18, height: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: '#fff'
              }}>
                {auctionCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowSustainability(true)}
            style={{
              background: '#111827',
              border: '1px solid #34d399',
              borderRadius: 8,
              padding: '8px 16px',
              color: '#34d399',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🌱 Impact
          </button>


          <a href="/buyer"
            target="_blank"
            style={{
              background: '#111827',
              border: '1px solid #f59e0b',
              borderRadius: 8,
              padding: '8px 16px',
              color: '#f59e0b',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            🏪 Buyer View
          </a>
        </div>

        {showAuctions && <AuctionPanel onClose={() => setShowAuctions(false)} />}
        {showSustainability && (
          <SustainabilityDashboard onClose={() => setShowSustainability(false)} />
        )}
        <Toast />
      </div>
    </div >
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <NexusProvider>
            <NexusApp />
          </NexusProvider>
        } />
        <Route path="/buyer" element={<BuyerView />} />
      </Routes>
    </BrowserRouter>
  );
}