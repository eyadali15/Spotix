const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

/**
 * GET /api/parking
 * List all active parking lots (public, for map markers)
 */
router.get('/', async (req, res) => {
  try {
    const lots = await prisma.parkingLot.findMany({
      where: { status: 'ACTIVE' },
      include: {
        owner: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ lots });
  } catch (error) {
    console.error('List parking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/parking/owner/mine
 * Get parking lots owned by the current user
 */
router.get('/owner/mine', authenticate, requireRole('PARKING_OWNER'), async (req, res) => {
  try {
    const lots = await prisma.parkingLot.findMany({
      where: { ownerId: req.user.id },
      include: {
        reservations: {
          where: { status: 'ACTIVE' },
          select: { id: true, status: true, startTime: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ lots });
  } catch (error) {
    console.error('Owner lots error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/parking/:id
 * Get a single parking lot with details
 */
router.get('/:id', async (req, res) => {
  try {
    const lot = await prisma.parkingLot.findUnique({
      where: { id: req.params.id },
      include: {
        owner: {
          select: { id: true, name: true }
        }
      }
    });

    if (!lot) {
      return res.status(404).json({ error: 'Parking lot not found' });
    }

    res.json({ lot });
  } catch (error) {
    console.error('Get parking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/parking
 * Create a new parking lot (Owner only)
 */
router.post('/', authenticate, requireRole('PARKING_OWNER'), async (req, res) => {
  try {
    const { name, address, latitude, longitude, totalSpots, pricePerHour, oldPrice, parkingType, openTime, closeTime } = req.body;

    if (!name || !address || latitude == null || longitude == null || !totalSpots || !pricePerHour) {
      return res.status(400).json({ error: 'All fields are required: name, address, latitude, longitude, totalSpots, pricePerHour' });
    }

    const lot = await prisma.parkingLot.create({
      data: {
        ownerId: req.user.id,
        name,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        totalSpots: parseInt(totalSpots),
        availableSpots: parseInt(totalSpots),
        pricePerHour: parseFloat(pricePerHour),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        parkingType: parkingType || 'UNCOVERED',
        openTime: openTime != null ? parseInt(openTime) : 0,
        closeTime: closeTime != null ? parseInt(closeTime) : 24,
      }
    });

    // Emit real-time update
    const { emitParkingUpdate } = require('../services/socket');
    emitParkingUpdate(lot);

    res.status(201).json({ message: 'Parking lot created', lot });
  } catch (error) {
    console.error('Create parking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/parking/:id
 * Update a parking lot (Owner only, must be own lot)
 */
router.put('/:id', authenticate, requireRole('PARKING_OWNER'), async (req, res) => {
  try {
    // Check ownership
    const existing = await prisma.parkingLot.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Parking lot not found' });
    }
    if (existing.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own parking lots' });
    }

    const { name, address, latitude, longitude, totalSpots, availableSpots: reqAvail, pricePerHour, oldPrice, parkingType, openTime, closeTime, status } = req.body;

    let finalAvail = existing.availableSpots;
    if (reqAvail !== undefined) {
      finalAvail = Math.max(0, Math.min(parseInt(reqAvail), parseInt(totalSpots || existing.totalSpots)));
    } else if (totalSpots && parseInt(totalSpots) !== existing.totalSpots) {
      const diff = parseInt(totalSpots) - existing.totalSpots;
      finalAvail = Math.max(0, existing.availableSpots + diff);
    }

    const lot = await prisma.parkingLot.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(address && { address }),
        ...(latitude != null && { latitude: parseFloat(latitude) }),
        ...(longitude != null && { longitude: parseFloat(longitude) }),
        ...(totalSpots && { totalSpots: parseInt(totalSpots) }),
        availableSpots: finalAvail,
        ...(pricePerHour && { pricePerHour: parseFloat(pricePerHour) }),
        ...(oldPrice !== undefined && { oldPrice: oldPrice ? parseFloat(oldPrice) : null }),
        ...(parkingType && { parkingType }),
        ...(openTime != null && { openTime: parseInt(openTime) }),
        ...(closeTime != null && { closeTime: parseInt(closeTime) }),
        ...(status && { status })
      }
    });

    const { emitParkingUpdate } = require('../services/socket');
    emitParkingUpdate(lot);

    res.json({ message: 'Parking lot updated', lot });
  } catch (error) {
    console.error('Update parking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/parking/:id
 * Delete a parking lot (Owner only, must be own lot)
 */
router.delete('/:id', authenticate, requireRole('PARKING_OWNER'), async (req, res) => {
  try {
    const existing = await prisma.parkingLot.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Parking lot not found' });
    }
    if (existing.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own parking lots' });
    }

    // Check for active reservations
    const activeReservations = await prisma.reservation.count({
      where: { lotId: req.params.id, status: 'ACTIVE' }
    });
    if (activeReservations > 0) {
      return res.status(400).json({ error: `Cannot delete: ${activeReservations} active reservations` });
    }

    await prisma.parkingLot.delete({ where: { id: req.params.id } });
    res.json({ message: 'Parking lot deleted' });
  } catch (error) {
    console.error('Delete parking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/parking/:id/stats
 * Get stats for a parking lot (Owner only)
 */
router.get('/:id/stats', authenticate, requireRole('PARKING_OWNER'), async (req, res) => {
  try {
    const lot = await prisma.parkingLot.findUnique({ where: { id: req.params.id } });
    if (!lot || lot.ownerId !== req.user.id) {
      return res.status(404).json({ error: 'Parking lot not found' });
    }

    const totalReservations = await prisma.reservation.count({ where: { lotId: lot.id } });
    const activeReservations = await prisma.reservation.count({ where: { lotId: lot.id, status: 'ACTIVE' } });
    const usedReservations = await prisma.reservation.count({ where: { lotId: lot.id, status: 'USED' } });

    res.json({
      stats: {
        totalSpots: lot.totalSpots,
        availableSpots: lot.availableSpots,
        occupiedSpots: lot.totalSpots - lot.availableSpots,
        totalReservations,
        activeReservations,
        usedReservations
      }
    });
  } catch (error) {
    console.error('Parking stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /api/parking/:id/payments — payment analytics for owner dashboard */
router.get('/:id/payments', authenticate, requireRole('PARKING_OWNER'), async (req, res) => {
  try {
    const lot = await prisma.parkingLot.findUnique({ where: { id: req.params.id } });
    if (!lot || lot.ownerId !== req.user.id) return res.status(403).json({ error: 'Not your lot' });

    const reservations = await prisma.reservation.findMany({
      where: { lotId: lot.id, status: { in: ['USED', 'ACTIVE'] } },
      orderBy: { createdAt: 'desc' },
    });

    let totalRevenue = 0, cashRevenue = 0, onlineRevenue = 0;
    const daily = {};
    const monthly = {};

    reservations.forEach(r => {
      const p = r.price || 0;
      totalRevenue += p;
      // Simulate: ~60% cash, 40% online (paymob)
      const isCash = Math.random() > 0.4;
      if (isCash) cashRevenue += p; else onlineRevenue += p;

      const day = new Date(r.createdAt).toISOString().split('T')[0];
      daily[day] = (daily[day] || 0) + p;

      const month = day.substring(0, 7);
      monthly[month] = (monthly[month] || 0) + p;
    });

    // Last 7 days chart data
    const chartDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      chartDays.push({ date: key, label: d.toLocaleDateString('en', { weekday: 'short' }), amount: daily[key] || 0 });
    }

    res.json({
      totalRevenue: Math.round(totalRevenue),
      cashRevenue: Math.round(cashRevenue),
      onlineRevenue: Math.round(onlineRevenue),
      totalBookings: reservations.length,
      chartDays,
      monthlyBreakdown: Object.entries(monthly).map(([m, a]) => ({ month: m, amount: Math.round(a) })).slice(-6),
    });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
