# Nexus — Living Graph Supply Chain Intelligence

> Real-time supply chain disruption prediction and response platform built for the Google Solution Challenge.

---

## The Problem

Modern supply chains are reactive. Companies find out about disruptions only after shipments are already delayed — a storm hits a port, a truck misses a connection, perishable cargo sits in the heat. By the time an alert reaches a logistics operator, the cascade has already happened. Millions of dollars of goods spoil every day not because disruptions are unavoidable, but because the warning came too late.

Traditional dashboards show you what has gone wrong. Nobody shows you what is about to go wrong.

---

## The Solution

Nexus models an entire supply chain as a **living graph** — ports, warehouses, and distributors as nodes, shipment routes as edges. When an early signal is detected (weather event, port congestion, strike, customs delay), a **Breadth-First Search cascade predictor** instantly traces every downstream shipment at risk and calculates a ripple impact score for each one.

**Gemini 2.0 Flash** analyzes the disruption in context and returns:
- A confidence score (0-100) of shipment failure
- A plain-English explanation of the cascade effect and timeline
- Three optimized reroute suggestions ranked by risk level

For perishable cargo at high spoilage risk (>80% confidence), Nexus automatically opens a **Flash Auction** — a live marketplace where local businesses (restaurants, food banks, retailers) bid on diverted goods at distressed prices. Every auction generates a sustainability report tracking carbon saved, waste prevented, and economic value rescued.

The result: supply chain failures become sustainability opportunities.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend runtime | Node.js + Express |
| Real-time events | Socket.io |
| Database | MongoDB Atlas + Mongoose |
| AI intelligence | Gemini 2.0 Flash |
| Frontend | React + Vite |
| Map | Leaflet + react-leaflet + CartoDB dark tiles |
| HTTP client | Axios |
| Routing | React Router DOM |

---

## UN SDG Alignment

- **SDG 12** — Responsible Consumption: Flash auctions prevent perishable food waste
- **SDG 13** — Climate Action: Optimized rerouting reduces carbon emissions
- **SDG 9** — Industry Innovation: AI-powered proactive supply chain resilience

---

## Project Structure

```
nexus/
├── backend/
│   ├── models/
│   │   ├── Hub.js
│   │   ├── Route.js
│   │   ├── Shipment.js
│   │   ├── Signal.js
│   │   └── Auction.js
│   ├── routes/
│   │   ├── hubs.js
│   │   ├── shipments.js
│   │   ├── signals.js
│   │   └── auctions.js
│   ├── services/
│   │   ├── cascadeService.js
│   │   ├── geminiService.js
│   │   └── auctionService.js
│   ├── server.js
│   ├── seed.js
│   └── .env
└── frontend/
    └── src/
        ├── context/
        │   └── NexusContext.jsx
        ├── components/
        │   ├── Map.jsx
        │   ├── Sidebar.jsx
        │   ├── ShipmentPanel.jsx
        │   ├── SignalControl.jsx
        │   ├── AuctionPanel.jsx
        │   ├── SustainabilityDashboard.jsx
        │   └── Toast.jsx
        ├── pages/
        │   └── BuyerView.jsx
        └── App.jsx
```

---

## Backend — File by File

### `server.js`
The entry point of the application. Creates the Express server and wraps it with an HTTP server instance to enable Socket.io. Registers all API route handlers, sets up CORS for the frontend origin, and connects to MongoDB Atlas. The `io` instance is exported so other modules can emit real-time events directly. On successful database connection, starts listening on the configured port.

---

### `seed.js`
A one-time script that populates MongoDB with the initial graph network. Seeds 15 hubs (2 ports, 3 warehouses, 10 distributors) across India with real geographic coordinates, 14 routes connecting them in a port → warehouse → distributor hierarchy, and 20 shipments each carrying one of six cargo types with realistic weights and values. Every shipment has an `activePath` — an ordered array of hub IDs — which is the foundation of the graph. Run once with `npm run seed`.

---

### `models/Hub.js`
Represents a graph node. Stores the hub name, type (port, warehouse, distributor), geographic coordinates, capacity, health score (0-100), and current status (active, disrupted, congested). Health score and status are updated in real time when a disruption signal hits the hub.

---

### `models/Route.js`
Represents a graph edge between two hubs. Stores origin hub, destination hub, travel time in hours, distance in kilometres, transport mode (road, sea, rail, air), and a current risk level. Used by the Dijkstra rerouting logic in Phase 5 to find optimal alternative paths.

---

### `models/Shipment.js`
The core graph object. Each shipment has a tracking ID, cargo details (type, perishability index, weight, value), and critically an `activePath` — an ordered array of Hub ObjectIDs representing the shipment's route through the graph. Also stores current hub index (how far along the path the shipment is), status, ripple score, and a `geminiAnalysis` subdocument that holds the AI confidence score, explanation, and reroute options once analyzed.

---

### `models/Signal.js`
Represents a disruption event. Stores the signal type (weather, port congestion, strike, accident, customs delay), severity (1-10), the affected hub or route ID, a description, source, radius in kilometres, active status, and expiry time. Created whenever an operator (or an automated feed) detects an early disruption.

---

### `models/Auction.js`
Represents a flash auction for diverted perishable cargo. Stores the linked shipment, cargo details, original destination, the hub it was diverted from, starting price, current highest bid, full bid history as a subdocument array, auction status (active, closed, diverted), expiry time, spoilage risk percentage, and a sustainability metrics subdocument containing carbon saved, waste prevented, and economic value rescued.

---

### `routes/hubs.js`
Exposes two endpoints. `GET /api/hubs` returns all 15 hubs — used by the frontend to render map markers. `GET /api/hubs/:id` returns a single hub by ID. Hub status and health scores update in real time as signals are processed.

---

### `routes/shipments.js`
Exposes two endpoints. `GET /api/shipments` returns all shipments with their `activePath` populated as full hub objects — this is what the frontend uses to draw polylines on the map and display route information. `GET /api/shipments/:id` returns a single shipment with full path data.

---

### `routes/signals.js`
The trigger point for the entire cascade system. `GET /api/signals` returns all active signals. `POST /api/signals` is the most important endpoint in the system — it creates a new signal document and immediately calls `runCascade()` from the cascade service, which performs BFS across all shipments, calculates ripple scores, calls Gemini for AI analysis, triggers flash auctions for high-risk perishable cargo, and broadcasts everything via Socket.io. `DELETE /api/signals/:id` resolves a signal by marking it inactive.

---

### `routes/auctions.js`
Manages the full auction lifecycle. `GET /api/auctions` returns all active auctions sorted by spoilage risk — this powers the buyer marketplace. `GET /api/auctions/all` returns all auctions including closed ones for the sustainability dashboard. `POST /api/auctions/:id/bid` validates and records a bid (must exceed starting price and current highest bid), updates the auction document, and broadcasts `auction:bid` via Socket.io so all connected clients update instantly. `POST /api/auctions/:id/close` accepts the winning bid, marks the auction closed, updates the shipment status to diverted, and broadcasts `auction:closed`.

---

### `services/cascadeService.js`
The intelligence core of Nexus. When called with a signal and the Socket.io instance, it performs a full graph traversal: queries all non-delivered shipments, checks each one's `activePath` for the disrupted hub ID, and for every match calculates a **Ripple Impact Score** using the formula: `(severity × 10) - (distance from disruption × 8) + (perishability index × 0.3)`, capped at 100. Shipments are sorted by score, the disrupted hub's health score is updated, and the top 3 highest-risk shipments are sent to the Gemini service for AI analysis. After analysis, the auction service is called for any perishable shipments above the 80% threshold. Finally, the full cascade result is broadcast to all frontend clients via `io.emit('cascade:update')`.

---

### `services/geminiService.js`
Handles all communication with the Gemini 2.0 Flash API. Builds a structured prompt containing the disruption details, affected shipment data (cargo type, perishability, current path, ripple score), and the full list of available hubs. Instructs Gemini to respond with valid JSON only, containing a confidence score, a 2-3 sentence natural language explanation of the cascade effect and timeline, and three reroute options each with a rank, description, alternate hubs, estimated delay saved, risk level, and reasoning. Strips markdown fences from the response before parsing. Includes a graceful fallback if the API is rate limited or unavailable, so the system never crashes.

---

### `services/auctionService.js`
Handles flash auction creation and sustainability metric calculation. `calculateSustainabilityMetrics()` computes carbon emissions for the original path vs the rerouted path using per-mode carbon factors (road: 0.062 kg CO₂/km/ton, sea: 0.008, rail: 0.022, air: 0.602), calculates waste prevented as 85% of perishable cargo weight, and estimates value rescued as cargo value multiplied by spoilage risk percentage. `createFlashAuction()` checks if the shipment is perishable and above the 80% spoilage threshold, prevents duplicate auctions, sets the starting price at 40% of cargo value (distressed sale pricing), creates the auction document with a 2-hour window, and broadcasts `auction:new` via Socket.io to alert both the operator panel and buyer marketplace simultaneously.

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Gemini API key from [aistudio.google.com](https://aistudio.google.com)

### Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://cluster0.xxxxx.mongodb.net/nexus
MONGODB_USER=your_username
MONGODB_PASS=your_password
GEMINI_API_KEY=your_gemini_key
```

Seed the database:
```bash
npm run seed
```

Start the server:
```bash
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` for the operator command center.
Open `http://localhost:5173/buyer` for the buyer marketplace.

---

## How To Demo

1. Open the operator view at `http://localhost:5173`
2. In the Signal Control bar, select **Mumbai Port**, type **Port Congestion**, severity **9**
3. Click **Fire** — watch the cascade: hub turns red, shipment paths turn red, toast notifications appear, sidebar populates with ripple scores
4. Click a shipment in the sidebar — Gemini analysis panel opens on the right with confidence score, explanation, and reroute options
5. Click **⚡ Flash Auctions** — see auto-generated auctions for perishable cargo
6. Open `http://localhost:5173/buyer` in a new tab — place a bid from the buyer side
7. Click **🌱 Impact** — view the sustainability dashboard with carbon saved, waste prevented, and SDG alignment

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/health | Server health check |
| GET | /api/hubs | All hubs |
| GET | /api/shipments | All shipments with populated paths |
| GET | /api/signals | All active signals |
| POST | /api/signals | Fire a signal — triggers cascade |
| DELETE | /api/signals/:id | Resolve a signal |
| GET | /api/auctions | All active auctions |
| GET | /api/auctions/all | All auctions including closed |
| POST | /api/auctions/:id/bid | Place a bid |
| POST | /api/auctions/:id/close | Close auction and accept winner |

---

## Socket.io Events

| Event | Direction | Payload |
|---|---|---|
| `cascade:update` | Server → Client | signal, atRiskShipments, totalAffected, timestamp |
| `auction:new` | Server → Client | auction, message |
| `auction:bid` | Server → Client | auctionId, trackingId, bid, currentHighestBid |
| `auction:closed` | Server → Client | auctionId, winner, sustainabilityMetrics |

---

Built for the Google Solution Challenge by Team Nexus.
