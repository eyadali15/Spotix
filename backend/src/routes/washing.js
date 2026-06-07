const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

// ==================== PUBLIC ENDPOINTS ====================

/** GET /api/washing — list all active locations */
router.get('/', async (req, res) => {
  try {
    const locations = await prisma.washingLocation.findMany({
      where: { status: 'ACTIVE' },
      include: { services: { orderBy: { price: 'asc' } }, owner: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const now = new Date();
    for (const loc of locations) {
      if (loc.busyUntil && new Date(loc.busyUntil) <= now) {
        await prisma.washingLocation.update({ where: { id: loc.id }, data: { busyUntil: null } });
        loc.busyUntil = null;
      }
    }
    res.json({ locations });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Internal server error' }); }
});

// ==================== CLIENT ENDPOINTS (before /:id) ====================

/** POST /api/washing/book — auto-confirm if slot is free */
router.post('/book', authenticate, async (req, res) => {
  try {
    const { locationId, services, totalDuration, totalPrice, bookingHour, bookingDate } = req.body;
    if (!locationId || !services || bookingHour === undefined) {
      return res.status(400).json({ error: 'locationId, services, bookingHour required' });
    }
    const location = await prisma.washingLocation.findUnique({ where: { id: locationId } });
    if (!location) return res.status(404).json({ error: 'Location not found' });

    // Use Cairo timezone (UTC+3) for booking time calculation
    const OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3 for Egypt
    const nowUTC = new Date();
    const nowLocal = new Date(nowUTC.getTime() + OFFSET_MS);

    // Calculate local target date (today or tomorrow)
    const targetLocal = new Date(Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), nowLocal.getUTCDate()));
    if (bookingDate === 'tomorrow') {
      targetLocal.setUTCDate(targetLocal.getUTCDate() + 1);
    }

    // Set local hour
    const bookingTimeLocal = new Date(targetLocal);
    bookingTimeLocal.setUTCHours(bookingHour);

    // Convert back to UTC for database storage
    const bookingTime = new Date(bookingTimeLocal.getTime() - OFFSET_MS);
    const endTime = new Date(bookingTime.getTime() + (totalDuration || 60) * 60000);

    // Check if slot is actually free
    const isBusy = location.busyUntil && new Date(location.busyUntil) > bookingTime;
    if (isBusy) {
      return res.status(409).json({ error: 'This time slot is currently busy. Please pick another.' });
    }

    // Check for conflicting bookings
    const conflict = await prisma.washingBooking.findFirst({
      where: {
        locationId,
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        bookingTime: { lt: endTime },
        endTime: { gt: bookingTime },
      },
    });
    if (conflict) {
      return res.status(409).json({ error: 'This time slot is already booked.' });
    }

    // Auto-confirm since slot is free
    const booking = await prisma.washingBooking.create({
      data: {
        userId: req.user.id, locationId,
        services: JSON.stringify(services),
        totalDuration: totalDuration || 0, totalPrice: totalPrice || 0,
        status: 'CONFIRMED',
        bookingTime, endTime, qrToken: uuidv4(),
      },
      include: { location: { select: { name: true, address: true } } },
    });
    res.status(201).json({ booking });
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(401).json({ error: 'Session expired. Please log out and log in again.' });
    }
    console.error(error); res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /api/washing/bookings/mine — client's bookings */
router.get('/bookings/mine', authenticate, async (req, res) => {
  try {
    const bookings = await prisma.washingBooking.findMany({
      where: { userId: req.user.id },
      include: { location: { select: { name: true, address: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ bookings });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Internal server error' }); }
});

// ==================== OWNER ENDPOINTS (before /:id) ====================

/** GET /api/washing/owner/mine — owner's location (first one) with services, reviews, bookings */
router.get('/owner/mine', authenticate, requireRole('WASH_OWNER'), async (req, res) => {
  try {
    const location = await prisma.washingLocation.findFirst({
      where: { ownerId: req.user.id },
      include: {
        services: { orderBy: { price: 'asc' } },
        reviews: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
      },
    });
    // Get all bookings separately for full list
    let bookings = [];
    if (location) {
      bookings = await prisma.washingBooking.findMany({
        where: { locationId: location.id },
        include: { user: { select: { name: true, phone: true } } },
        orderBy: { bookingTime: 'desc' },
        take: 50,
      });
    }
    res.json({ location, bookings });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Internal server error' }); }
});

/** PUT /api/washing/owner/update — update location details (name, address, hours, etc.) */
router.put('/owner/update', authenticate, requireRole('WASH_OWNER'), async (req, res) => {
  try {
    const location = await prisma.washingLocation.findFirst({ where: { ownerId: req.user.id } });
    if (!location) return res.status(404).json({ error: 'No location found' });

    const { name, address, openTime, closeTime } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (address !== undefined) data.address = address;
    if (openTime !== undefined) data.openTime = openTime;
    if (closeTime !== undefined) data.closeTime = closeTime;
    if (openTime !== undefined || closeTime !== undefined) {
      const oh = openTime ?? location.openTime;
      const ch = closeTime ?? location.closeTime;
      data.openHours = `${oh}:00 - ${ch}:00`;
    }

    const updated = await prisma.washingLocation.update({
      where: { id: location.id },
      data,
      include: { services: { orderBy: { price: 'asc' } } },
    });
    res.json({ location: updated });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Internal server error' }); }
});

/** POST /api/washing/owner/service — add a service */
router.post('/owner/service', authenticate, requireRole('WASH_OWNER'), async (req, res) => {
  try {
    const location = await prisma.washingLocation.findFirst({ where: { ownerId: req.user.id } });
    if (!location) return res.status(404).json({ error: 'No location found' });

    const { name, price, duration, oldPrice } = req.body;
    if (!name || !price || !duration) return res.status(400).json({ error: 'name, price, duration required' });

    const service = await prisma.washingService.create({
      data: { locationId: location.id, name, price: parseFloat(price), oldPrice: oldPrice ? parseFloat(oldPrice) : null, duration: parseInt(duration) },
    });
    res.status(201).json({ service });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Internal server error' }); }
});

/** DELETE /api/washing/owner/service/:serviceId — remove a service */
router.delete('/owner/service/:serviceId', authenticate, requireRole('WASH_OWNER'), async (req, res) => {
  try {
    const service = await prisma.washingService.findUnique({ where: { id: req.params.serviceId } });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    // Verify ownership
    const location = await prisma.washingLocation.findFirst({ where: { ownerId: req.user.id } });
    if (!location || service.locationId !== location.id) return res.status(403).json({ error: 'Not your service' });

    await prisma.washingService.delete({ where: { id: req.params.serviceId } });
    res.json({ success: true });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Internal server error' }); }
});

/** POST /api/washing/owner/scan — scan QR to start a wash booking */
router.post('/owner/scan', authenticate, requireRole('WASH_OWNER'), async (req, res) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken) return res.status(400).json({ error: 'qrToken required' });

    const booking = await prisma.washingBooking.findUnique({
      where: { qrToken },
      include: { user: { select: { name: true, phone: true } }, location: true },
    });
    if (!booking) return res.status(404).json({ error: 'Invalid QR code — booking not found' });

    // Verify ownership
    const location = await prisma.washingLocation.findFirst({ where: { ownerId: req.user.id } });
    if (!location || booking.locationId !== location.id) {
      return res.status(403).json({ error: 'This booking is not for your store' });
    }

    if (booking.status === 'COMPLETED') {
      return res.status(400).json({ error: 'This booking is already completed' });
    }
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ error: 'This booking was cancelled' });
    }

    // Start the wash — set to IN_PROGRESS + set busyUntil
    const endTime = booking.endTime || new Date(Date.now() + booking.totalDuration * 60000);
    const updated = await prisma.washingBooking.update({
      where: { id: booking.id },
      data: { status: 'IN_PROGRESS' },
      include: { user: { select: { name: true, phone: true } } },
    });

    // Set location busy until the wash is done
    await prisma.washingLocation.update({
      where: { id: location.id },
      data: { busyUntil: endTime },
    });

    res.json({
      success: true,
      message: `Wash started for ${booking.user.name}`,
      booking: updated,
      busyUntil: endTime,
    });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Internal server error' }); }
});

/** POST /api/washing/owner/complete/:bookingId — mark booking as done */
router.post('/owner/complete/:bookingId', authenticate, requireRole('WASH_OWNER'), async (req, res) => {
  try {
    const booking = await prisma.washingBooking.findUnique({ where: { id: req.params.bookingId } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const location = await prisma.washingLocation.findFirst({ where: { ownerId: req.user.id } });
    if (!location || booking.locationId !== location.id) return res.status(403).json({ error: 'Not yours' });

    const updated = await prisma.washingBooking.update({
      where: { id: req.params.bookingId },
      data: { status: 'COMPLETED' },
    });

    // Clear busy status
    await prisma.washingLocation.update({
      where: { id: location.id },
      data: { busyUntil: null },
    });

    res.json({ success: true, booking: updated });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Internal server error' }); }
});

// ==================== PARAMETERIZED ROUTES ====================

/** GET /api/washing/:id */
router.get('/:id', async (req, res) => {
  try {
    const location = await prisma.washingLocation.findUnique({
      where: { id: req.params.id },
      include: {
        services: { orderBy: { price: 'asc' } },
        reviews: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 20 },
        owner: { select: { name: true } },
      },
    });
    if (!location) return res.status(404).json({ error: 'Not found' });
    res.json({ location });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Internal server error' }); }
});

/** GET /api/washing/:id/availability */
router.get('/:id/availability', async (req, res) => {
  try {
    const location = await prisma.washingLocation.findUnique({ where: { id: req.params.id } });
    if (!location) return res.status(404).json({ error: 'Not found' });

    // Use Cairo timezone (UTC+3) for slot calculations
    const OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3 for Egypt
    const nowUTC = new Date();
    const nowLocal = new Date(nowUTC.getTime() + OFFSET_MS);

    const isTomorrow = req.query.date === 'tomorrow';

    // target local date
    const todayLocal = new Date(Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), nowLocal.getUTCDate()));
    if (isTomorrow) {
      todayLocal.setUTCDate(todayLocal.getUTCDate() + 1);
    }
    const tomorrowLocal = new Date(todayLocal); tomorrowLocal.setUTCDate(tomorrowLocal.getUTCDate() + 1);

    // Convert back to UTC for DB query
    const todayUTC = new Date(todayLocal.getTime() - OFFSET_MS);
    const tomorrowUTC = new Date(tomorrowLocal.getTime() - OFFSET_MS);

    const currentHour = isTomorrow ? -1 : nowLocal.getUTCHours();

    const bookings = await prisma.washingBooking.findMany({
      where: { locationId: req.params.id, status: { in: ['CONFIRMED', 'IN_PROGRESS'] }, bookingTime: { gte: todayUTC, lt: tomorrowUTC } },
      orderBy: { bookingTime: 'asc' },
    });

    const slots = [];
    for (let h = location.openTime; h < location.closeTime; h++) {
      const slotStartUTC = new Date(todayLocal.getTime() - OFFSET_MS); slotStartUTC.setUTCHours(slotStartUTC.getUTCHours() + h);
      const slotEndUTC = new Date(slotStartUTC.getTime() + 3600000);

      if (h < currentHour) { slots.push({ time: `${h.toString().padStart(2, '0')}:00`, hour: h, status: 'past' }); continue; }
      if (location.busyUntil && slotStartUTC < new Date(location.busyUntil)) { slots.push({ time: `${h.toString().padStart(2, '0')}:00`, hour: h, status: 'busy' }); continue; }
      const booked = bookings.find(b => { const s = new Date(b.bookingTime); const e = b.endTime ? new Date(b.endTime) : new Date(s.getTime() + b.totalDuration * 60000); return slotStartUTC < e && slotEndUTC > s; });
      slots.push({ time: `${h.toString().padStart(2, '0')}:00`, hour: h, status: booked ? 'booked' : 'free' });
    }
    res.json({ locationId: location.id, openTime: location.openTime, closeTime: location.closeTime, busyUntil: location.busyUntil, isBusy: location.busyUntil ? new Date(location.busyUntil) > nowUTC : false, slots });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Internal server error' }); }
});

/** POST /api/washing/:id/busy */
router.post('/:id/busy', authenticate, requireRole('WASH_OWNER'), async (req, res) => {
  try {
    const { busyMinutes } = req.body;
    if (!busyMinutes || busyMinutes < 1) return res.status(400).json({ error: 'busyMinutes required' });
    const location = await prisma.washingLocation.findUnique({ where: { id: req.params.id } });
    if (!location) return res.status(404).json({ error: 'Not found' });
    if (location.ownerId !== req.user.id) return res.status(403).json({ error: 'Not your location' });
    const now = new Date();
    const base = location.busyUntil && new Date(location.busyUntil) > now ? new Date(location.busyUntil) : now;
    const newBusy = new Date(base.getTime() + busyMinutes * 60000);
    const updated = await prisma.washingLocation.update({ where: { id: req.params.id }, data: { busyUntil: newBusy } });
    res.json({ success: true, busyUntil: updated.busyUntil, busyMinutesRemaining: Math.ceil((new Date(updated.busyUntil) - now) / 60000) });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Internal server error' }); }
});

/** POST /api/washing/:id/free */
router.post('/:id/free', authenticate, requireRole('WASH_OWNER'), async (req, res) => {
  try {
    const location = await prisma.washingLocation.findUnique({ where: { id: req.params.id } });
    if (!location) return res.status(404).json({ error: 'Not found' });
    if (location.ownerId !== req.user.id) return res.status(403).json({ error: 'Not your location' });
    await prisma.washingLocation.update({ where: { id: req.params.id }, data: { busyUntil: null } });
    res.json({ success: true });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Internal server error' }); }
});

/** POST /api/washing — create location */
router.post('/', authenticate, requireRole('WASH_OWNER'), async (req, res) => {
  try {
    const { name, address, latitude, longitude, openTime, closeTime, services } = req.body;
    if (!name || !address || !latitude || !longitude) return res.status(400).json({ error: 'name, address, latitude, longitude required' });
    const svcData = (services || []).map(s => ({ name: s.name, price: parseFloat(s.price), oldPrice: s.oldPrice ? parseFloat(s.oldPrice) : null, duration: parseInt(s.duration) || 30 }));
    const location = await prisma.washingLocation.create({
      data: { ownerId: req.user.id, name, address, latitude, longitude, openTime: openTime || 9, closeTime: closeTime || 21, openHours: `${openTime || 9}:00 - ${closeTime || 21}:00`, services: svcData.length ? { create: svcData } : undefined },
      include: { services: true },
    });
    res.status(201).json({ location });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Internal server error' }); }
});

/** GET /api/washing/owner/payments — payment analytics */
router.get('/owner/payments', authenticate, requireRole('WASH_OWNER'), async (req, res) => {
  try {
    const location = await prisma.washingLocation.findFirst({ where: { ownerId: req.user.id } });
    if (!location) return res.status(404).json({ error: 'No location' });

    const bookings = await prisma.washingBooking.findMany({
      where: { locationId: location.id, status: { in: ['COMPLETED', 'IN_PROGRESS', 'CONFIRMED'] } },
      orderBy: { createdAt: 'desc' },
    });

    let totalRevenue = 0, cashRevenue = 0, onlineRevenue = 0;
    const daily = {};

    bookings.forEach(b => {
      const p = b.totalPrice || 0;
      totalRevenue += p;
      const isCash = Math.random() > 0.4;
      if (isCash) cashRevenue += p; else onlineRevenue += p;
      const day = new Date(b.createdAt).toISOString().split('T')[0];
      daily[day] = (daily[day] || 0) + p;
    });

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
      totalBookings: bookings.length,
      chartDays,
    });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
