const { Router } = require('express');
const Notification = require('../models/Notification');
const { requireAuth } = require('../middleware/auth');
const { wrap } = require('../utils/http');

const router = Router();

router.get('/', requireAuth, wrap(async (req, res) => {
  const [items, unread] = await Promise.all([
    Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(30).lean(),
    Notification.countDocuments({ user: req.user.id, read: false }),
  ]);
  res.json({ notifications: items, unread });
}));

router.patch('/read-all', requireAuth, wrap(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
  res.json({ ok: true });
}));

module.exports = router;
