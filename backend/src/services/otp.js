const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Generate a 4-digit OTP for a user
 * In production, this would send an SMS. For now, logs to console.
 */
async function generateOTP(userId) {
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const otp = await prisma.oTP.create({
    data: {
      userId,
      code,
      expiresAt
    }
  });

  // Mock SMS — log to console
  console.log(`\n📱 ========================================`);
  console.log(`   OTP for user ${userId}: ${code}`);
  console.log(`   Expires at: ${expiresAt.toISOString()}`);
  console.log(`========================================\n`);

  return otp;
}

/**
 * Verify an OTP code for a user
 */
async function verifyOTP(userId, code) {
  const otp = await prisma.oTP.findFirst({
    where: {
      userId,
      code,
      used: false,
      expiresAt: { gte: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!otp) {
    return { valid: false, error: 'Invalid or expired OTP' };
  }

  // Mark as used
  await prisma.oTP.update({
    where: { id: otp.id },
    data: { used: true }
  });

  // Mark user as verified
  await prisma.user.update({
    where: { id: userId },
    data: { verified: true }
  });

  return { valid: true };
}

module.exports = { generateOTP, verifyOTP };
