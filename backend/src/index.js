require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { initSocket } = require('./services/socket');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Spotix API' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/parking', require('./routes/parking'));
app.use('/api/reservation', require('./routes/reservation'));
app.use('/api/washing', require('./routes/washing'));
app.use('/api/reviews', require('./routes/reviews'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚗 ========================================`);
  console.log(`   Spotix Backend running on port ${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Socket.io: ws://localhost:${PORT}`);
  console.log(`========================================\n`);
});
