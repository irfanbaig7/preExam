const { Router } = require('express');
const { z } = require('zod');
const User = require('../models/User');
const Paper = require('../models/Paper');
const Question = require('../models/Question');
const Subject = require('../models/Subject');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ApiError, wrap } = require('../utils/http');
const queue = require('../services/queue');
const { invalidateSubject } = require('../services/analytics');
const { notify, notifySubscribers } = require('../services/notify');

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/stats', wrap(async (req, res) => {
  const [users, subjects, questions, pending, approved, failed] = await Promise.all([
    User.countDocuments(),
    Subject.countDocuments(),
    Question.countDocuments({ approved: true }),
    Paper.countDocuments({ moderation: 'pending' }),
    Paper.countDocuments({ moderation: 'approved' }),
    Paper.countDocuments({ status: 'failed' }),
  ]);
  res.json({ users, subjects, questions, papers: { pending, approved, failed }, queue: queue.stats() });
}));

router.get('/papers', wrap(async (req, res) => {
  const filter = req.query.status === 'failed' ? { status: 'failed' } : { moderation: req.query.moderation || 'pending' };
  const papers = await Paper.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('subject', 'name code')
    .populate('uploadedBy', 'name email')
    .lean();
  res.json({ papers });
}));

const moderateSchema = z.object({ action: z.enum(['approve', 'reject']) });

router.patch('/papers/:id/moderate', validate(moderateSchema), wrap(async (req, res) => {
  const paper = await Paper.findById(req.params.id).populate('subject', 'name');
  if (!paper) throw new ApiError(404, 'Paper not found');
  const approve = req.body.action === 'approve';
  paper.moderation = approve ? 'approved' : 'rejected';
  await paper.save();
  await Question.updateMany({ paper: paper._id }, { approved: approve });
  await invalidateSubject(paper.subject._id);

  const label = `${paper.subject.name} ${paper.year}`;
  await notify(paper.uploadedBy, {
    title: approve ? `${label} was approved` : `${label} was rejected`,
    body: approve ? 'It is now visible to everyone.' : 'An admin did not accept this upload.',
    link: `/subjects/${paper.subject._id}`,
  });
  if (approve && paper.status === 'ready') {
    await notifySubscribers(paper.subject._id, {
      title: `New paper: ${label}`,
      body: `${paper.questionCount} questions were added.`,
      link: `/subjects/${paper.subject._id}`,
    });
  }
  res.json({ paper });
}));

router.post('/papers/:id/reprocess', wrap(async (req, res) => {
  const paper = await Paper.findByIdAndUpdate(req.params.id, { status: 'queued', failReason: undefined }, { new: true });
  if (!paper) throw new ApiError(404, 'Paper not found');
  queue.enqueue('process-paper', { paperId: paper.id });
  res.json({ ok: true });
}));

router.get('/users', wrap(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).limit(100).select('name email role isPremium premiumUntil createdAt').lean();
  res.json({ users });
}));

const roleSchema = z.object({ role: z.enum(['student', 'contributor', 'admin']) });

router.patch('/users/:id/role', validate(roleSchema), wrap(async (req, res) => {
  if (req.params.id === req.user.id) throw new ApiError(400, 'You cannot change your own role');
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ user: user.toPublic() });
}));

module.exports = router;
