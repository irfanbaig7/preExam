const cron = require('node-cron');
const User = require('../models/User');
const { getSubjectAnalytics } = require('./analytics');
const { notify } = require('./notify');
const mailer = require('./mailer');

// Every day at 08:00: remind students whose exam is within 7 days
async function sendExamReminders() {
  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const users = await User.find({
    examDate: { $gte: now, $lte: soon },
    subscribedSubjects: { $exists: true, $ne: [] },
    $or: [{ lastReminderAt: { $exists: false } }, { lastReminderAt: { $lt: startOfDay } }],
  }).populate('subscribedSubjects', 'name');

  for (const u of users) {
    const daysLeft = Math.ceil((u.examDate - now) / (24 * 3600 * 1000));
    for (const s of u.subscribedSubjects.slice(0, 3)) {
      const a = await getSubjectAnalytics(s._id.toString());
      const top = a.topics.slice(0, 3).map((t) => t.topic).join(', ');
      if (!top) continue;
      const title = `${daysLeft} day(s) to your exam: ${s.name}`;
      const body = `Most repeated topics: ${top}.`;
      await notify(u._id, { title, body, link: `/subjects/${s._id}` });
      mailer.send(u.email, title, body).catch(() => {});
    }
    u.lastReminderAt = now;
    await u.save();
  }
  return users.length;
}

function start() {
  cron.schedule('0 8 * * *', () => {
    sendExamReminders().then((n) => console.log(`[cron] reminders sent to ${n} user(s)`)).catch((e) => console.error('[cron]', e));
  });
}

module.exports = { start, sendExamReminders };
