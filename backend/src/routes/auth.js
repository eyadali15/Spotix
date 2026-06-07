const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { generateOTP, verifyOTP } = require('../services/otp');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

/**
 * POST /api/auth/signup
 */
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password, role, language } = req.body;

    if (!name || !phone || !password || !role) {
      return res.status(400).json({ error: 'Name, phone, password, and role are required' });
    }
    if (!['CLIENT', 'PARKING_OWNER', 'WASH_OWNER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check phone uniqueness
    const existingPhone = await prisma.user.findFirst({ where: { phone } });
    if (existingPhone) return res.status(409).json({ error: 'Phone number already registered' });

    // Check email uniqueness (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) return res.status(409).json({ error: 'Email already registered' });
    }

    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email: email || null, phone, password: hashedPassword, role, language: language || 'en' },
    });

    await generateOTP(user.id);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User created. OTP sent for verification.',
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, verified: user.verified },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Login with email OR phone number + password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    const identifier = email || phone;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email or phone number and password are required' });
    }

    // Try finding by email first, then by phone
    let user = null;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    }
    if (!user && phone) {
      user = await prisma.user.findFirst({ where: { phone } });
    }
    // If identifier looks like a phone (starts with +), search by phone
    if (!user && identifier.startsWith('+')) {
      user = await prisma.user.findFirst({ where: { phone: identifier } });
    }
    // If identifier contains @, search by email
    if (!user && identifier.includes('@')) {
      user = await prisma.user.findUnique({ where: { email: identifier } });
    }
    // Last resort: try both
    if (!user) {
      user = await prisma.user.findFirst({
        where: { OR: [{ email: identifier }, { phone: identifier }] },
      });
    }

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, verified: user.verified, language: user.language },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Send OTP to email or phone for password reset
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body; // email or phone
    if (!identifier) return res.status(400).json({ error: 'Email or phone is required' });

    let user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
    });
    if (!user) return res.status(404).json({ error: 'No account found with this email or phone' });

    await generateOTP(user.id);
    res.json({ message: 'OTP sent successfully', userId: user.id });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/reset-password
 * Verify OTP and set new password
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { userId, code, newPassword } = req.body;
    if (!userId || !code || !newPassword) {
      return res.status(400).json({ error: 'userId, code, and newPassword are required' });
    }
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const result = await verifyOTP(userId, code);
    if (!result.valid) return res.status(400).json({ error: result.error || 'Invalid or expired OTP' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** POST /api/auth/verify-otp */
router.post('/verify-otp', authenticate, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'OTP code is required' });
    const result = await verifyOTP(req.user.id, code);
    if (!result.valid) return res.status(400).json({ error: result.error });
    res.json({ message: 'Verified successfully', verified: true });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Internal server error' }); }
});

/** POST /api/auth/resend-otp */
router.post('/resend-otp', authenticate, async (req, res) => {
  try { await generateOTP(req.user.id); res.json({ message: 'OTP resent' }); }
  catch (error) { console.error(error); res.status(500).json({ error: 'Internal server error' }); }
});

/** GET /api/auth/me */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, phone: true, role: true, language: true, verified: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Internal server error' }); }
});

/** PUT /api/auth/language */
router.put('/language', authenticate, async (req, res) => {
  try {
    const { language } = req.body;
    if (!['en', 'ar'].includes(language)) return res.status(400).json({ error: 'Language must be en or ar' });
    await prisma.user.update({ where: { id: req.user.id }, data: { language } });
    res.json({ message: 'Language updated', language });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
