import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import auctionRoutes from './routes/auctions.js';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] }
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use('/api/auctions', auctionRoutes);
// Routes
import hubRoutes from './routes/hubs.js';
import shipmentRoutes from './routes/shipments.js';
import signalRoutes from './routes/signals.js';

app.use('/api/hubs', hubRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/signals', signalRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});




// Connect DB and start server
mongoose.connect(process.env.MONGODB_URI, {
  retryWrites: true,
  w: 'majority',
  appName: 'Cluster0'
})
  .then(() => {
    console.log('MongoDB connected');
    httpServer.listen(process.env.PORT || 5000, () => {
      console.log(`Nexus server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => {
    console.error('DB connection failed:', err);
    process.exit(1);
  });