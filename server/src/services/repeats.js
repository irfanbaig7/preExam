const Question = require('../models/Question');
const { clusterQuestions } = require('./ai');
const { invalidateSubject } = require('./analytics');

const running = new Set(); // one detection per subject at a time

// Groups repeated questions inside each topic and stores a clusterId on every member
async function detectRepeats(subjectId) {
    const id = String(subjectId);
    if (running.has(id)) return { busy: true, groups: 0, failedTopics: 0 };
    running.add(id);
    let groups = 0;
    let failedTopics = 0;
    try {
        const topics = await Question.distinct('topic', { subject: subjectId });
        for (const topic of topics) {
            const qs = await Question.find({ subject: subjectId, topic })
                .sort({ year: -1, number: 1 }).limit(80).select('text year').lean();
            const ids = qs.map((q) => q._id);
            if (qs.length < 2 || new Set(qs.map((q) => q.year)).size < 2) {
                await Question.updateMany({ _id: { $in: ids } }, { $unset: { clusterId: 1 } });
                continue;
            }
            const found = await clusterQuestions(qs);
            if (!found) { failedTopics++; continue; } // keep the old result for this topic
            await Question.updateMany({ _id: { $in: ids } }, { $unset: { clusterId: 1 } });
            for (const g of found) {
                await Question.updateMany({ _id: { $in: g.map((i) => qs[i]._id) } }, { clusterId: String(qs[g[0]]._id) });
                groups++;
            }
        }
        await invalidateSubject(subjectId);
        return { busy: false, groups, failedTopics };
    } finally {
        running.delete(id);
    }
}

module.exports = { detectRepeats };