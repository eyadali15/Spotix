/**
 * Spotix — Socket.io Client Service
 * Real-time parking availability updates
 */

import { io } from 'socket.io-client';
import { Platform } from 'react-native';

let socket = null;

const getSocketURL = () => {
  return 'http://192.168.1.27:3001';
};

/**
 * Connect to Socket.io server
 */
export function connectSocket() {
  if (socket?.connected) return socket;

  socket = io(getSocketURL(), {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.log('🔌 Socket connection error:', error.message);
  });

  return socket;
}

/**
 * Get the current socket instance
 */
export function getSocket() {
  return socket;
}

/**
 * Subscribe to parking updates
 */
export function onParkingUpdate(callback) {
  if (socket) {
    socket.on('parking:updated', callback);
  }
}

/**
 * Unsubscribe from parking updates
 */
export function offParkingUpdate(callback) {
  if (socket) {
    socket.off('parking:updated', callback);
  }
}

/**
 * Subscribe to reservation updates
 */
export function onReservationUpdate(callback) {
  if (socket) {
    socket.on('reservation:updated', callback);
  }
}

/**
 * Join a parking lot room for targeted updates
 */
export function joinParkingRoom(lotId) {
  if (socket) {
    socket.emit('join:parking', lotId);
  }
}

/**
 * Leave a parking lot room
 */
export function leaveParkingRoom(lotId) {
  if (socket) {
    socket.emit('leave:parking', lotId);
  }
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
