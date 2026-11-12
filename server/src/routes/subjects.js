const { Router } = require('express');
const { z } = require('zod');
const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const User = require('../models/User');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { ApiError, wrap } = require('../utils/http');
const { getSubjectAnalytics, invalidateSubject } = require('../services/analytics');
const { studyPlan } = require('../services/ai');
const { requirePremium } = require('../middleware/auth');

const router = Router();

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(2).max(20),
  university: z.string().trim().min(2).max(120),
  semester: z.coerce.number().int().min(1).max(12).optional(),
});

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', requireAuth, wrap(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 60);
  const filter = q
    ? { $or: [{ name: new RegExp(escapeRegex(q), 'i') }, { code: new RegExp(escapeRegex(q), 'i') }, { university: new RegExp(escapeRegex(q), 'i') }] }
    : {};
  const subjects = await Subject.find(filter).sort({ updatedAt: -1 }).limit(50).lean();
  const me = await User.findById(req.user.id).select('subscribedSubjects');
  const subs = new Set((me ? me.subscribedSubjects : []).map(String));
  res.json({ subjects: subjects.map((s) => ({ ...s, subscribed: subs.has(String(s._id)) })) });
}));

router.post('/', requireAuth, validate(createSchema), wrap(async (req, res) => {
  const subject = await Subject.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json({ subject });
}));

router.get('/:id', requireAuth, wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, 'Subject not found');
  const subject = await Subject.findById(req.params.id).lean();
  if (!subject) throw new ApiError(404, 'Subject not found');
  const me = await User.findById(req.user.id).select('subscribedSubjects');
  const subscribed = !!me && me.subscribedSubjects.some((s) => String(s) === String(subject._id));
  const analytics = await getSubjectAnalytics(req.params.id);
  res.json({ subject: { ...subject, subscribed }, analytics });
}));

router.post('/:id/subscribe', requireAuth, wrap(async (req, res) => {
  const subject = await Subject.exists({ _id: req.params.id });
  if (!subject) throw new ApiError(404, 'Subject not found');
  const me = await User.findById(req.user.id);
  const has = me.subscribedSubjects.some((s) => String(s) === req.params.id);
  me.subscribedSubjects = has
    ? me.subscribedSubjects.filter((s) => String(s) !== req.params.id)
    : [...me.subscribedSubjects, req.params.id];
  await me.save();
  res.json({ subscribed: !has });
}));

const planSchema = z.object({ days: z.coerce.number().int().min(1).max(30).default(7) });

// Premium feature
router.post('/:id/plan', requireAuth, requirePremium, validate(planSchema), wrap(async (req, res) => {
  const subject = await Subject.findById(req.params.id).lean();
  if (!subject) throw new ApiError(404, 'Subject not found');
  const analytics = await getSubjectAnalytics(req.params.id);
  if (!analytics.topics.length) throw new ApiError(400, 'No approved papers for this subject yet');
  const plan = await studyPlan({ subjectName: subject.name, topics: analytics.topics, days: req.body.days });
  res.json(plan);
}));

module.exports = router;
