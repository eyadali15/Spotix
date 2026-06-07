let io = null;

/**
 * Initialize Socket.io with the HTTP server
 */
function initSocket(server) {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Client can join a specific parking lot room for targeted updates
    socket.on('join:parking', (lotId) => {
      socket.join(`parking:${lotId}`);
      console.log(`📍 Socket ${socket.id} joined parking:${lotId}`);
    });

    socket.on('leave:parking', (lotId) => {
      socket.leave(`parking:${lotId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Emit a parking availability update to all connected clients
 */
function emitParkingUpdate(lot) {
  if (io) {
    // Broadcast to everyone
    io.emit('parking:updated', {
      lotId: lot.id,
      availableSpots: lot.availableSpots,
      totalSpots: lot.totalSpots,
      status: lot.status
    });

    // Also emit to the specific lot room
    io.to(`parking:${lot.id}`).emit('parking:spotChanged', {
      lotId: lot.id,
      availableSpots: lot.availableSpots,
      totalSpots: lot.totalSpots
    });
  }
}

/**
 * Emit reservation status update
 */
function emitReservationUpdate(reservation) {
  if (io) {
    io.emit('reservation:updated', {
      id: reservation.id,
      status: reservation.status,
      lotId: reservation.lotId
    });
  }
}

function getIO() {
  return io;
}

module.exports = { initSocket, emitParkingUpdate, emitReservationUpdate, getIO };
