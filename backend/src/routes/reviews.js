const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

/**
 * GET /api/reviews/:locationType/:locationId
 * Get reviews for a parking lot or washing location
 */
router.get('/:locationType/:locationId', async (req, res) => {
  try {
    const { locationType, locationId } = req.params;
    const where = { locationType: locationType.toUpperCase() };
    if (locationType.toUpperCase() === 'PARKING') where.parkingLotId = locationId;
    else where.washingLocationId = locationId;

    const reviews = await prisma.review.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/reviews
 * Add a review
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { locationType, locationId, rating, comment } = req.body;
    if (!locationType || !locationId || !rating) {
      return res.status(400).json({ error: 'locationType, locationId, rating required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be 1-5' });
    }

    const data = {
      userId: req.user.id,
      locationType: locationType.toUpperCase(),
      rating,
      comment: comment || null,
    };
    if (locationType.toUpperCase() === 'PARKING') data.parkingLotId = locationId;
    else data.washingLocationId = locationId;

    const review = await prisma.review.create({
      data,
      include: { user: { select: { name: true } } },
    });

    // Update washing location rating if applicable
    if (locationType.toUpperCase() === 'WASHING') {
      const agg = await prisma.review.aggregate({
        where: { washingLocationId: locationId },
        _avg: { rating: true },
        _count: true,
      });
      await prisma.washingLocation.update({
        where: { id: locationId },
        data: {
          rating: Math.round((agg._avg.rating || 0) * 10) / 10,
          reviewCount: agg._count,
        },
      });
    }

    res.status(201).json({ review });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
