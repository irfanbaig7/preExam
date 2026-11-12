const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { ApiError } = require('../utils/http');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, 'Please log in'));
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new ApiError(401, 'Session expired, please log in again'));
  }
}

const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : next(new ApiError(403, 'You do not have access to this'));

async function requirePremium(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.hasPremium()) return next(new ApiError(402, 'This feature needs Premium'));
    next();
  } catch (e) {
    next(e);
  }
}

module.exports = { requireAuth, requireRole, requirePremium };
