const fs = require('fs/promises');
const { Router } = require('express');
const { z } = require('zod');
const mongoose = require('mongoose');
const Paper = require('../models/Paper');
const Question = require('../models/Question');
const Subject = require('../models/Subject');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { ApiError, wrap } = require('../utils/http');
const queue = require('../services/queue');
const { invalidateSubject } = require('../services/analytics');

const router = Router();

const uploadSchema = z.object({
  subjectId: z.string().refine((v) => mongoose.isValidObjectId(v), 'Choose a subject'),
  year: z.coerce.number().int().min(1990).max(2100),
  examType: z.enum(['regular', 'backlog']).default('regular'),
  text: z.string().max(60000).optional(),
});

const canSee = (paper, user) =>
  user.role === 'admin' || paper.moderation === 'approved' || String(paper.uploadedBy._id || paper.uploadedBy) === user.id;

router.get('/', requireAuth, wrap(async (req, res) => {
  const filter = {};
  if (req.query.subject && mongoose.isValidObjectId(req.query.subject)) filter.subject = req.query.subject;
  if (req.query.mine === 'true') filter.uploadedBy = req.user.id;
  else if (req.user.role !== 'admin') filter.$or = [{ moderation: 'approved' }, { uploadedBy: req.user.id }];
  const papers = await Paper.find(filter).sort({ year: -1, createdAt: -1 }).limit(100).populate('subject', 'name code').lean();
  res.json({ papers });
}));

// Contributors and admins are trusted: their uploads skip moderation
router.post('/', requireAuth, upload.single('file'), validate(uploadSchema), wrap(async (req, res) => {
  const cleanup = () => (req.file ? fs.unlink(req.file.path).catch(() => {}) : null);
  const { subjectId, year, examType, text } = req.body;
  if (!req.file && !(text && text.trim())) { await cleanup(); throw new ApiError(400, 'Upload a PDF or paste the question text'); }
  if (!(await Subject.exists({ _id: subjectId }))) { await cleanup(); throw new ApiError(404, 'Subject not found'); }

  const trusted = ['admin', 'contributor'].includes(req.user.role);
  let paper;
  try {
    paper = await Paper.create({
      subject: subjectId,
      year,
      examType,
      rawText: req.file ? undefined : text,
      file: req.file ? { path: req.file.path, originalName: req.file.originalname, size: req.file.size } : undefined,
      uploadedBy: req.user.id,
      moderation: trusted ? 'approved' : 'pending',
    });
  } catch (e) {
    await cleanup();
    throw e;
  }
  queue.enqueue('process-paper', { paperId: paper.id });
  res.status(202).json({ paper: { _id: paper.id, status: paper.status, moderation: paper.moderation } });
}));

router.get('/:id', requireAuth, wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, 'Paper not found');
  const paper = await Paper.findById(req.params.id).populate('subject', 'name code').lean();
  if (!paper || !canSee(paper, req.user)) throw new ApiError(404, 'Paper not found');
  const questions = await Question.find({ paper: paper._id }).sort({ number: 1 }).lean();
  res.json({ paper, questions });
}));

router.get('/:id/file', requireAuth, wrap(async (req, res) => {
  const paper = await Paper.findById(req.params.id).lean();
  if (!paper || !canSee(paper, req.user) || !paper.file || !paper.file.path) throw new ApiError(404, 'File not found');
  res.download(paper.file.path, paper.file.originalName || 'paper.pdf');
}));

router.delete('/:id', requireAuth, wrap(async (req, res) => {
  const paper = await Paper.findById(req.params.id);
  if (!paper) throw new ApiError(404, 'Paper not found');
  if (req.user.role !== 'admin' && String(paper.uploadedBy) !== req.user.id) throw new ApiError(403, 'You can only delete your own uploads');
  await Question.deleteMany({ paper: paper._id });
  if (paper.file && paper.file.path) await fs.unlink(paper.file.path).catch(() => {});
  await paper.deleteOne();
  await invalidateSubject(paper.subject);
  res.json({ ok: true });
}));

module.exports = router;
