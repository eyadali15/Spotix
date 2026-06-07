const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { authenticate, requireRole } = require('../middleware/auth');
const { emitParkingUpdate, emitReservationUpdate } = require('../services/socket');

const prisma = new PrismaClient();

/**
 * POST /api/reservation
 * Create a new reservation (Client only)
 * Uses Prisma transaction to atomically check+decrement spots
 */
router.post('/', authenticate, requireRole('CLIENT'), async (req, res) => {
  try {
    const { lotId, startTime, endTime } = req.body;

    if (!lotId) {
      return res.status(400).json({ error: 'lotId is required' });
    }

    // Atomic transaction: check availability → decrement → create reservation
    const result = await prisma.$transaction(async (tx) => {
      // Lock and check the parking lot
      const lot = await tx.parkingLot.findUnique({
        where: { id: lotId }
      });

      if (!lot) {
        throw new Error('PARKING_NOT_FOUND');
      }

      if (lot.status !== 'ACTIVE') {
        throw new Error('PARKING_INACTIVE');
      }

      if (lot.availableSpots <= 0) {
        throw new Error('NO_SPOTS_AVAILABLE');
      }

      // Check if user already has an active reservation for this lot
      const existingReservation = await tx.reservation.findFirst({
        where: {
          userId: req.user.id,
          lotId,
          status: 'ACTIVE'
        }
      });

      if (existingReservation) {
        throw new Error('ALREADY_RESERVED');
      }

      // Generate unique QR token
      const qrToken = uuidv4();

      // Decrement available spots
      const updatedLot = await tx.parkingLot.update({
        where: { id: lotId },
        data: { availableSpots: { decrement: 1 } }
      });

      // Create reservation
      const reservation = await tx.reservation.create({
        data: {
          userId: req.user.id,
          lotId,
          qrToken,
          status: 'ACTIVE',
          startTime: startTime ? new Date(startTime) : new Date(),
          endTime: endTime ? new Date(endTime) : null
        },
        include: {
          lot: {
            select: { id: true, name: true, address: true, pricePerHour: true }
          }
        }
      });

      return { reservation, updatedLot };
    });

    // Emit real-time update outside transaction
    emitParkingUpdate(result.updatedLot);

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(result.reservation.qrToken, {
      width: 300,
      margin: 2,
      color: { dark: '#1E3A8A', light: '#FFFFFF' }
    });

    // Calculate price
    let price = 0;
    const rStart = result.reservation.startTime;
    const rEnd = result.reservation.endTime;
    if (rStart && rEnd) {
      const hours = (new Date(rEnd) - new Date(rStart)) / (1000 * 60 * 60);
      price = Math.round(hours * result.reservation.lot.pricePerHour);
    }

    res.status(201).json({
      message: 'Reservation created successfully',
      reservation: {
        id: result.reservation.id,
        lotId: result.reservation.lotId,
        lotName: result.reservation.lot.name,
        lotAddress: result.reservation.lot.address,
        pricePerHour: result.reservation.lot.pricePerHour,
        status: result.reservation.status,
        qrToken: result.reservation.qrToken,
        qrCode: qrDataUrl,
        startTime: result.reservation.startTime,
        endTime: result.reservation.endTime,
        price
      }
    });
  } catch (error) {
    // Handle known business logic errors
    const errorMap = {
      'PARKING_NOT_FOUND': { status: 404, message: 'Parking lot not found' },
      'PARKING_INACTIVE': { status: 400, message: 'Parking lot is not active' },
      'NO_SPOTS_AVAILABLE': { status: 409, message: 'No spots available' },
      'ALREADY_RESERVED': { status: 409, message: 'You already have an active reservation at this lot' }
    };

    const known = errorMap[error.message];
    if (known) {
      return res.status(known.status).json({ error: known.message });
    }

    // Prisma foreign key error (stale session after DB reset)
    if (error.code === 'P2003') {
      return res.status(401).json({ error: 'Session expired. Please log out and log in again.' });
    }

    console.error('Create reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/reservation/mine
 * Get current user's reservations
 */
router.get('/mine', authenticate, async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { userId: req.user.id },
      include: {
        lot: {
          select: { id: true, name: true, address: true, pricePerHour: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Generate QR codes for active reservations
    const reservationsWithQR = await Promise.all(
      reservations.map(async (r) => {
        let qrCode = null;
        if (r.status === 'ACTIVE') {
          qrCode = await QRCode.toDataURL(r.qrToken, {
            width: 300,
            margin: 2,
            color: { dark: '#1E3A8A', light: '#FFFFFF' }
          });
        }
        // Calculate price from duration
        let price = 0;
        if (r.startTime && r.endTime) {
          const hours = (new Date(r.endTime) - new Date(r.startTime)) / (1000 * 60 * 60);
          price = Math.round(hours * (r.lot.pricePerHour || 0));
        } else if (r.startTime && r.status === 'ACTIVE') {
          const hours = (new Date() - new Date(r.startTime)) / (1000 * 60 * 60);
          price = Math.round(hours * (r.lot.pricePerHour || 0));
        }
        return {
          id: r.id,
          lotId: r.lotId,
          lotName: r.lot.name,
          lotAddress: r.lot.address,
          pricePerHour: r.lot.pricePerHour,
          status: r.status,
          qrToken: r.qrToken,
          qrCode,
          startTime: r.startTime,
          endTime: r.endTime,
          price,
          createdAt: r.createdAt
        };
      })
    );

    res.json({ reservations: reservationsWithQR });
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/reservation/:id
 * Get a single reservation
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: req.params.id },
      include: {
        lot: {
          select: { id: true, name: true, address: true, pricePerHour: true, latitude: true, longitude: true }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Only allow owner of reservation or lot owner to view
    if (reservation.userId !== req.user.id && reservation.lot.ownerId !== req.user.id) {
      // Check if current user is the lot owner
      const lot = await prisma.parkingLot.findUnique({ where: { id: reservation.lotId } });
      if (!lot || lot.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    let qrCode = null;
    if (reservation.status === 'ACTIVE') {
      qrCode = await QRCode.toDataURL(reservation.qrToken, {
        width: 300,
        margin: 2,
        color: { dark: '#1E3A8A', light: '#FFFFFF' }
      });
    }

    res.json({
      reservation: {
        id: reservation.id,
        lotId: reservation.lotId,
        lotName: reservation.lot.name,
        lotAddress: reservation.lot.address,
        pricePerHour: reservation.lot.pricePerHour,
        latitude: reservation.lot.latitude,
        longitude: reservation.lot.longitude,
        userName: reservation.user.name,
        status: reservation.status,
        qrToken: reservation.qrToken,
        qrCode,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        createdAt: reservation.createdAt
      }
    });
  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/reservation/validate
 * Validate a QR token (Owner scans client ticket)
 */
router.post('/validate', authenticate, requireRole('PARKING_OWNER', 'WASH_OWNER'), async (req, res) => {
  try {
    const { qrToken } = req.body;

    if (!qrToken) {
      return res.status(400).json({ error: 'qrToken is required' });
    }

    // Find reservation by QR token
    const reservation = await prisma.reservation.findUnique({
      where: { qrToken },
      include: {
        lot: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!reservation) {
      return res.status(404).json({
        valid: false,
        error: 'Invalid ticket — reservation not found'
      });
    }

    // Check that this owner owns the parking lot
    if (reservation.lot.ownerId !== req.user.id) {
      return res.status(403).json({
        valid: false,
        error: 'This ticket is not for your parking lot'
      });
    }

    // Check reservation status
    if (reservation.status === 'USED') {
      return res.status(400).json({
        valid: false,
        error: 'Ticket already used'
      });
    }

    if (reservation.status === 'CANCELLED') {
      return res.status(400).json({
        valid: false,
        error: 'Ticket was cancelled'
      });
    }

    // Mark as used and increment available spots
    const result = await prisma.$transaction(async (tx) => {
      const updatedReservation = await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: 'USED',
          endTime: new Date()
        }
      });

      const updatedLot = await tx.parkingLot.update({
        where: { id: reservation.lotId },
        data: { availableSpots: { increment: 1 } }
      });

      return { updatedReservation, updatedLot };
    });

    // Emit real-time updates
    emitParkingUpdate(result.updatedLot);
    emitReservationUpdate(result.updatedReservation);

    res.json({
      valid: true,
      message: 'Ticket validated successfully',
      reservation: {
        id: reservation.id,
        userName: reservation.user.name,
        lotName: reservation.lot.name,
        startTime: reservation.startTime,
        endTime: result.updatedReservation.endTime,
        status: 'USED'
      }
    });
  } catch (error) {
    console.error('Validate reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/reservation/:id/cancel
 * Cancel a reservation (Client only, must be own)
 */
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: req.params.id }
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (reservation.userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only cancel your own reservations' });
    }

    if (reservation.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Can only cancel active reservations' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedReservation = await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: 'CANCELLED',
          endTime: new Date()
        }
      });

      const updatedLot = await tx.parkingLot.update({
        where: { id: reservation.lotId },
        data: { availableSpots: { increment: 1 } }
      });

      return { updatedReservation, updatedLot };
    });

    emitParkingUpdate(result.updatedLot);
    emitReservationUpdate(result.updatedReservation);

    res.json({ message: 'Reservation cancelled', reservation: result.updatedReservation });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/reservation/owner/all
 * Get all reservations for the owner's parking lots
 */
router.get('/owner/all', authenticate, requireRole('PARKING_OWNER', 'WASH_OWNER'), async (req, res) => {
  try {
    // Get all lots owned by this user
    const lots = await prisma.parkingLot.findMany({
      where: { ownerId: req.user.id },
      select: { id: true }
    });

    const lotIds = lots.map(l => l.id);

    const reservations = await prisma.reservation.findMany({
      where: { lotId: { in: lotIds } },
      include: {
        lot: {
          select: { id: true, name: true, address: true, pricePerHour: true }
        },
        user: {
          select: { id: true, name: true, email: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Enrich with calculated price
    const enriched = reservations.map(r => {
      let price = 0;
      if (r.startTime && r.endTime) {
        const hours = (new Date(r.endTime) - new Date(r.startTime)) / (1000 * 60 * 60);
        price = Math.round(hours * (r.lot.pricePerHour || 0));
      } else if (r.startTime && r.status === 'ACTIVE') {
        // For active reservations, estimate based on time elapsed so far
        const hours = (new Date() - new Date(r.startTime)) / (1000 * 60 * 60);
        price = Math.round(hours * (r.lot.pricePerHour || 0));
      }
      return { ...r, price };
    });

    res.json({ reservations: enriched });
  } catch (error) {
    console.error('Owner reservations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/reservation/:id/extend
 * Extend an active reservation's end time
 */
router.put('/:id/extend', authenticate, async (req, res) => {
  try {
    const { newEndTime } = req.body;
    if (!newEndTime) return res.status(400).json({ error: 'newEndTime is required' });

    const reservation = await prisma.reservation.findUnique({
      where: { id: req.params.id },
      include: { lot: { select: { pricePerHour: true } } },
    });

    if (!reservation) return res.status(404).json({ error: 'Booking not found' });
    if (reservation.userId !== req.user.id) return res.status(403).json({ error: 'Not your booking' });
    if (reservation.status !== 'ACTIVE') return res.status(400).json({ error: 'Can only extend active bookings' });

    const end = new Date(newEndTime);
    if (end <= new Date(reservation.endTime || reservation.startTime)) {
      return res.status(400).json({ error: 'New end time must be later than current end time' });
    }

    const hours = (end - new Date(reservation.startTime)) / (1000 * 60 * 60);
    const newPrice = Math.round(hours * reservation.lot.pricePerHour);

    const updated = await prisma.reservation.update({
      where: { id: req.params.id },
      data: { endTime: end, price: newPrice },
      include: { lot: { select: { name: true, address: true, pricePerHour: true } } },
    });

    emitReservationUpdate(updated);

    res.json({
      message: 'Booking extended',
      reservation: {
        id: updated.id, lotName: updated.lot.name, status: updated.status,
        startTime: updated.startTime, endTime: updated.endTime, price: newPrice,
      },
    });
  } catch (error) {
    console.error('Extend reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
