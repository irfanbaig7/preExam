const { Router } = require('express');
const { z } = require('zod');
const mongoose = require('mongoose');
const Question = require('../models/Question');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { wrap } = require('../utils/http');
const cache = require('../services/cache');

const router = Router();

const schema = z.object({
  q: z.string().trim().min(2).max(100),
  subject: z.string().optional(),
  page: z.coerce.number().int().min(1).max(50).default(1),
});

// MongoDB full-text search over approved questions, ranked by text score. Cached for 60s per query.
router.get('/', requireAuth, validate(schema, 'query'), wrap(async (req, res) => {
  const { q, subject, page } = req.query;
  const filter = { $text: { $search: q }, approved: true };
  if (subject && mongoose.isValidObjectId(subject)) filter.subject = subject;
  const limit = 15;

  const data = await cache.remember(`search:${q.toLowerCase()}:${subject || ''}:${page}`, 60, async () => {
    const [results, total] = await Promise.all([
      Question.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('subject', 'name code')
        .lean(),
      Question.countDocuments(filter),
    ]);
    return { results, total, page, pages: Math.ceil(total / limit) };
  });
  res.json(data);
}));

module.exports = router;
