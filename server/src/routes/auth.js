const crypto = require('crypto');
const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const env = require('../config/env');
const User = require('../models/User');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { ApiError, wrap } = require('../utils/http');

const router = Router();
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

const cookieOpts = {
  httpOnly: true,
  // frontend (Vercel) and API (Render) are different sites, so production needs SameSite=None + Secure
  sameSite: env.isProd ? 'none' : 'lax',
  secure: env.isProd,
  path: '/api/auth',
  maxAge: 7 * 24 * 3600 * 1000,
};

async function issueTokens(user, res) {
  const access = jwt.sign({ sub: user.id, role: user.role }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  const refresh = jwt.sign({ sub: user.id }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  await User.updateOne({ _id: user._id }, { refreshHash: sha(refresh) });
  res.cookie('refresh_token', refresh, cookieOpts);
  return access;
}

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(100),
});
const loginSchema = z.object({ email: z.string().trim().email().toLowerCase(), password: z.string().min(1) });

router.post('/register', validate(registerSchema), wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists');
  const user = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: email === env.ADMIN_EMAIL ? 'admin' : 'student',
  });
  const token = await issueTokens(user, res);
  res.status(201).json({ token, user: user.toPublic() });
}));

router.post('/login', validate(loginSchema), wrap(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
  const ok = user && (await bcrypt.compare(req.body.password, user.passwordHash));
  if (!ok) throw new ApiError(401, 'Email or password is wrong');
  const token = await issueTokens(user, res);
  res.json({ token, user: user.toPublic() });
}));

// Refresh token rotation: every refresh issues a new refresh token and invalidates the old one
router.post('/refresh', wrap(async (req, res) => {
  const old = req.cookies && req.cookies.refresh_token;
  if (!old) throw new ApiError(401, 'Please log in');
  let payload;
  try { payload = jwt.verify(old, env.JWT_REFRESH_SECRET); } catch { throw new ApiError(401, 'Please log in'); }
  const user = await User.findById(payload.sub).select('+refreshHash');
  if (!user || user.refreshHash !== sha(old)) throw new ApiError(401, 'Please log in');
  const token = await issueTokens(user, res);
  res.json({ token });
}));

router.post('/logout', wrap(async (req, res) => {
  const old = req.cookies && req.cookies.refresh_token;
  if (old) {
    try {
      const p = jwt.verify(old, env.JWT_REFRESH_SECRET);
      await User.updateOne({ _id: p.sub }, { $unset: { refreshHash: 1 } });
    } catch { /* already invalid */ }
  }
  const { maxAge, ...clearOpts } = cookieOpts; // clearing needs the same attributes the cookie was set with
  res.clearCookie('refresh_token', clearOpts);
  res.json({ ok: true });
}));

router.get('/me', requireAuth, wrap(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(401, 'Please log in');
  res.json({ user: user.toPublic() });
}));

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  examDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullable().optional(),
});

router.patch('/me', requireAuth, validate(profileSchema), wrap(async (req, res) => {
  const update = {};
  if (req.body.name) update.name = req.body.name;
  if (req.body.examDate !== undefined) update.examDate = req.body.examDate ? new Date(req.body.examDate) : null;
  const user = await User.findByIdAndUpdate(req.user.id, update, { new: true });
  res.json({ user: user.toPublic() });
}));

module.exports = router;
