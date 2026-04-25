import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hub from './models/Hub.js';
import Route from './models/Route.js';
import Shipment from './models/Shipment.js';

dotenv.config();

const hubs = [
  // Ports
  { name: 'Mumbai Port', type: 'port', location: { lat: 18.9388, lng: 72.8354 }, capacity: 500 },
  { name: 'Chennai Port', type: 'port', location: { lat: 13.0827, lng: 80.2707 }, capacity: 450 },
  // Warehouses
  { name: 'Pune Warehouse', type: 'warehouse', location: { lat: 18.5204, lng: 73.8567 }, capacity: 300 },
  { name: 'Bangalore Warehouse', type: 'warehouse', location: { lat: 12.9716, lng: 77.5946 }, capacity: 280 },
  { name: 'Hyderabad Warehouse', type: 'warehouse', location: { lat: 17.3850, lng: 78.4867 }, capacity: 260 },
  // Distributors
  { name: 'Nashik Distributor', type: 'distributor', location: { lat: 19.9975, lng: 73.7898 }, capacity: 100 },
  { name: 'Aurangabad Distributor', type: 'distributor', location: { lat: 19.8762, lng: 75.3433 }, capacity: 100 },
  { name: 'Coimbatore Distributor', type: 'distributor', location: { lat: 11.0168, lng: 76.9558 }, capacity: 100 },
  { name: 'Madurai Distributor', type: 'distributor', location: { lat: 9.9252, lng: 78.1198 }, capacity: 100 },
  { name: 'Vijayawada Distributor', type: 'distributor', location: { lat: 16.5062, lng: 80.6480 }, capacity: 100 },
  { name: 'Visakhapatnam Distributor', type: 'distributor', location: { lat: 17.6868, lng: 83.2185 }, capacity: 100 },
  { name: 'Mysore Distributor', type: 'distributor', location: { lat: 12.2958, lng: 76.6394 }, capacity: 100 },
  { name: 'Salem Distributor', type: 'distributor', location: { lat: 11.6643, lng: 78.1460 }, capacity: 100 },
  { name: 'Solapur Distributor', type: 'distributor', location: { lat: 17.6868, lng: 75.9064 }, capacity: 100 },
  { name: 'Kolhapur Distributor', type: 'distributor', location: { lat: 16.7050, lng: 74.2433 }, capacity: 100 },
];

const cargos = [
  { type: 'Electronics', isPerishable: false, perishabilityIndex: 10 },
  { type: 'Pharmaceuticals', isPerishable: true, perishabilityIndex: 85 },
  { type: 'Fresh Produce', isPerishable: true, perishabilityIndex: 95 },
  { type: 'Textiles', isPerishable: false, perishabilityIndex: 5 },
  { type: 'Automobile Parts', isPerishable: false, perishabilityIndex: 8 },
  { type: 'Frozen Seafood', isPerishable: true, perishabilityIndex: 98 },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI, {
    retryWrites: true,
    w: 'majority',
    appName: 'Cluster0'
  });
  console.log('Connected to MongoDB');

  // Clear existing data
  await Hub.deleteMany({});
  await Route.deleteMany({});
  await Shipment.deleteMany({});
  console.log('Cleared existing data');

  // Insert hubs
  const insertedHubs = await Hub.insertMany(hubs);
  const hubMap = {};
  insertedHubs.forEach(h => { hubMap[h.name] = h._id; });
  console.log(`Seeded ${insertedHubs.length} hubs`);

  // Build routes: ports -> warehouses -> distributors
  const routes = [
    // Mumbai Port -> Pune, Hyderabad
    { originHub: hubMap['Mumbai Port'], destinationHub: hubMap['Pune Warehouse'], travelTimeHours: 4, distanceKm: 150, transportMode: 'road' },
    { originHub: hubMap['Mumbai Port'], destinationHub: hubMap['Hyderabad Warehouse'], travelTimeHours: 12, distanceKm: 710, transportMode: 'road' },
    // Chennai Port -> Bangalore, Hyderabad
    { originHub: hubMap['Chennai Port'], destinationHub: hubMap['Bangalore Warehouse'], travelTimeHours: 6, distanceKm: 346, transportMode: 'road' },
    { originHub: hubMap['Chennai Port'], destinationHub: hubMap['Hyderabad Warehouse'], travelTimeHours: 10, distanceKm: 630, transportMode: 'road' },
    // Pune Warehouse -> Nashik, Aurangabad, Solapur, Kolhapur
    { originHub: hubMap['Pune Warehouse'], destinationHub: hubMap['Nashik Distributor'], travelTimeHours: 3, distanceKm: 210, transportMode: 'road' },
    { originHub: hubMap['Pune Warehouse'], destinationHub: hubMap['Aurangabad Distributor'], travelTimeHours: 4, distanceKm: 235, transportMode: 'road' },
    { originHub: hubMap['Pune Warehouse'], destinationHub: hubMap['Solapur Distributor'], travelTimeHours: 4, distanceKm: 254, transportMode: 'road' },
    { originHub: hubMap['Pune Warehouse'], destinationHub: hubMap['Kolhapur Distributor'], travelTimeHours: 4, distanceKm: 228, transportMode: 'road' },
    // Bangalore Warehouse -> Mysore, Coimbatore, Salem
    { originHub: hubMap['Bangalore Warehouse'], destinationHub: hubMap['Mysore Distributor'], travelTimeHours: 2, distanceKm: 143, transportMode: 'road' },
    { originHub: hubMap['Bangalore Warehouse'], destinationHub: hubMap['Coimbatore Distributor'], travelTimeHours: 5, distanceKm: 360, transportMode: 'road' },
    { originHub: hubMap['Bangalore Warehouse'], destinationHub: hubMap['Salem Distributor'], travelTimeHours: 3, distanceKm: 340, transportMode: 'road' },
    // Hyderabad Warehouse -> Vijayawada, Visakhapatnam, Madurai
    { originHub: hubMap['Hyderabad Warehouse'], destinationHub: hubMap['Vijayawada Distributor'], travelTimeHours: 5, distanceKm: 275, transportMode: 'road' },
    { originHub: hubMap['Hyderabad Warehouse'], destinationHub: hubMap['Visakhapatnam Distributor'], travelTimeHours: 8, distanceKm: 624, transportMode: 'road' },
    { originHub: hubMap['Hyderabad Warehouse'], destinationHub: hubMap['Madurai Distributor'], travelTimeHours: 12, distanceKm: 890, transportMode: 'road' },
  ];

  const insertedRoutes = await Route.insertMany(routes);
  console.log(`Seeded ${insertedRoutes.length} routes`);

  // Build 20 shipments with realistic paths
  const paths = [
    ['Mumbai Port', 'Pune Warehouse', 'Nashik Distributor'],
    ['Mumbai Port', 'Pune Warehouse', 'Aurangabad Distributor'],
    ['Mumbai Port', 'Pune Warehouse', 'Solapur Distributor'],
    ['Mumbai Port', 'Pune Warehouse', 'Kolhapur Distributor'],
    ['Mumbai Port', 'Hyderabad Warehouse', 'Vijayawada Distributor'],
    ['Mumbai Port', 'Hyderabad Warehouse', 'Visakhapatnam Distributor'],
    ['Mumbai Port', 'Hyderabad Warehouse', 'Madurai Distributor'],
    ['Chennai Port', 'Bangalore Warehouse', 'Mysore Distributor'],
    ['Chennai Port', 'Bangalore Warehouse', 'Coimbatore Distributor'],
    ['Chennai Port', 'Bangalore Warehouse', 'Salem Distributor'],
    ['Chennai Port', 'Hyderabad Warehouse', 'Vijayawada Distributor'],
    ['Chennai Port', 'Hyderabad Warehouse', 'Visakhapatnam Distributor'],
    ['Mumbai Port', 'Pune Warehouse', 'Nashik Distributor'],
    ['Mumbai Port', 'Hyderabad Warehouse', 'Vijayawada Distributor'],
    ['Chennai Port', 'Bangalore Warehouse', 'Coimbatore Distributor'],
    ['Chennai Port', 'Bangalore Warehouse', 'Mysore Distributor'],
    ['Mumbai Port', 'Pune Warehouse', 'Solapur Distributor'],
    ['Mumbai Port', 'Pune Warehouse', 'Kolhapur Distributor'],
    ['Chennai Port', 'Hyderabad Warehouse', 'Madurai Distributor'],
    ['Mumbai Port', 'Hyderabad Warehouse', 'Visakhapatnam Distributor'],
  ];

  const shipments = paths.map((path, i) => {
    const cargo = cargos[i % cargos.length];
    const hubIds = path.map(name => hubMap[name]);
    return {
      trackingId: `NXS-${String(i + 1).padStart(4, '0')}`,
      cargo: { ...cargo, weightKg: 500 + Math.random() * 4500, valueUSD: 10000 + Math.random() * 90000 },
      activePath: hubIds,
      currentHubIndex: Math.floor(Math.random() * 2),
      origin: path[0],
      destination: path[path.length - 1],
      estimatedDelivery: new Date(Date.now() + (24 + Math.random() * 72) * 3600000),
      status: 'on_time'
    };
  });

  await Shipment.insertMany(shipments);
  console.log(`Seeded ${shipments.length} shipments`);

  console.log('\nSeed complete. Your graph network:');
  console.log('  2 Ports -> 3 Warehouses -> 10 Distributors');
  console.log('  20 Shipments moving across 14 routes');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });