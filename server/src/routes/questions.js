const { Router } = require('express');
const mongoose = require('mongoose');
const Question = require('../models/Question');
const { requireAuth } = require('../middleware/auth');
const { ApiError, wrap } = require('../utils/http');
const cache = require('../services/cache');
const env = require('../config/env');
const { explainQuestion } = require('../services/ai');

const router = Router();
const HOURLY_LIMIT = 20; // new AI answers per user per hour (saved answers are free)

router.post('/:id/explain', requireAuth, wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, 'Question not found');
    const q = await Question.findById(req.params.id).select('+aiAnswer').populate('subject', 'name');
    if (!q || (!q.approved && req.user.role !== 'admin')) throw new ApiError(404, 'Question not found');

    const refresh = req.user.role === 'admin' && req.body && req.body.refresh === true;
    if (q.aiAnswer && !refresh) return res.json({ answer: q.aiAnswer, cached: true });

    if (!env.aiEnabled) throw new ApiError(503, 'AI is not set up on this server');
    const key = `explain-rate:${req.user.id}`;
    const used = (await cache.get(key)) || 0;
    if (used >= HOURLY_LIMIT) throw new ApiError(429, 'You asked for many new answers this hour. Try again later.');

    const answer = await explainQuestion({
        subjectName: q.subject ? q.subject.name : 'General',
        topic: q.topic,
        text: q.text,
        marks: q.marks,
    });
    if (!answer) throw new ApiError(503, 'AI is busy right now. Try again in a minute.');

    await cache.set(key, used + 1, 3600);
    await Question.updateOne({ _id: q._id }, { aiAnswer: answer, aiAnswerAt: new Date() });
    res.json({ answer, cached: false });
}));

module.exports = router;