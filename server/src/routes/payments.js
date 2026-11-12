const crypto = require('crypto');
const { Router } = require('express');
const { z } = require('zod');
const env = require('../config/env');
const User = require('../models/User');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { ApiError, wrap } = require('../utils/http');

const router = Router();
const THIRTY_DAYS = 30 * 24 * 3600 * 1000;

async function activate(userId) {
  const user = await User.findById(userId);
  const base = user.premiumUntil && user.premiumUntil > new Date() ? user.premiumUntil : new Date();
  user.isPremium = true;
  user.premiumUntil = new Date(base.getTime() + THIRTY_DAYS);
  await user.save();
  return user;
}

router.get('/config', (req, res) => {
  res.json({ razorpay: env.razorpayEnabled, keyId: env.razorpayEnabled ? env.RAZORPAY_KEY_ID : null, priceInr: env.PREMIUM_PRICE_INR });
});

router.post('/order', requireAuth, wrap(async (req, res) => {
  if (!env.razorpayEnabled) throw new ApiError(400, 'Razorpay is not configured on this server');
  const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const r = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: env.PREMIUM_PRICE_INR * 100, currency: 'INR', receipt: `prem_${Date.now()}` }),
  });
  if (!r.ok) throw new ApiError(502, 'Payment provider rejected the order');
  const order = await r.json();
  res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: env.RAZORPAY_KEY_ID });
}));

const verifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

// Razorpay signs "order_id|payment_id" with the key secret. Never trust the client without this check.
router.post('/verify', requireAuth, validate(verifySchema), wrap(async (req, res) => {
  if (!env.razorpayEnabled) throw new ApiError(400, 'Razorpay is not configured on this server');
  const { razorpay_order_id: o, razorpay_payment_id: p, razorpay_signature: sig } = req.body;
  const expected = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET).update(`${o}|${p}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new ApiError(400, 'Payment signature did not match');
  const user = await activate(req.user.id);
  res.json({ user: user.toPublic() });
}));

// Only available when Razorpay keys are NOT set, so the project can be demoed without a payment account
router.post('/demo-activate', requireAuth, wrap(async (req, res) => {
  if (env.razorpayEnabled || env.NODE_ENV === 'production') throw new ApiError(403, 'Demo activation is disabled');
  const user = await activate(req.user.id);
  res.json({ user: user.toPublic() });
}));

module.exports = router;
