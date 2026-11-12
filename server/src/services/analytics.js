const mongoose = require('mongoose');
const Question = require('../models/Question');
const Paper = require('../models/Paper');
const cache = require('./cache');

const key = (id) => `analytics:${id}`;

async function compute(subjectId) {
  const subject = new mongoose.Types.ObjectId(subjectId);
  const [papers, grouped] = await Promise.all([
    Paper.find({ subject, moderation: 'approved', status: 'ready' }).select('year examType questionCount').sort({ year: -1 }).lean(),
    Question.aggregate([
      { $match: { subject, approved: true } },
      {
        $group: {
          _id: '$topic',
          count: { $sum: 1 },
          marks: { $sum: { $ifNull: ['$marks', 0] } },
          years: { $addToSet: '$year' },
          lastYear: { $max: '$year' },
        },
      },
      { $sort: { count: -1, lastYear: -1 } },
      { $limit: 30 },
    ]),
  ]);

  const allYears = new Set(papers.map((p) => p.year));
  const totalYears = allYears.size || 1;
  const topics = grouped.map((g) => ({
    topic: g._id,
    count: g.count,
    marks: g.marks,
    years: g.years.sort((a, b) => b - a),
    lastYear: g.lastYear,
    appearsInPercent: Math.round((g.years.length / totalYears) * 100),
  }));

  // most recent questions for the five most frequent topics
  // recent questions (up to 3) for every topic, in one query
  const names = topics.map((t) => t.topic);
  const recent = await Question.find({ subject, approved: true, topic: { $in: names } })
    .sort({ year: -1 })
    .select('text year marks topic')
    .lean();
  const byTopic = {};
  for (const q of recent) {
    const list = (byTopic[q.topic] = byTopic[q.topic] || []);
    if (list.length < 3) list.push(q);
  }
  const important = names.map((topic) => ({ topic, questions: byTopic[topic] || [] }));

  return { papers, totalYears, topics, important };
}

const getSubjectAnalytics = (subjectId) => cache.remember(key(subjectId), 300, () => compute(subjectId));
const invalidateSubject = (subjectId) => cache.delPrefix(key(subjectId));

module.exports = { getSubjectAnalytics, invalidateSubject };
