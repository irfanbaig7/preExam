const Notification = require('../models/Notification');
const User = require('../models/User');
const socket = require('./socket');
const mailer = require('./mailer');

async function notify(userId, { title, body = '', link = '' }) {
  const n = await Notification.create({ user: userId, title, body, link });
  socket.emitToUser(userId, 'notification', n);
  return n;
}

async function notifySubscribers(subjectId, payload) {
  const users = await User.find({ subscribedSubjects: subjectId }).select('email');
  await Promise.all(
    users.map(async (u) => {
      await notify(u._id, payload);
      mailer.send(u.email, payload.title, payload.body).catch(() => {});
    })
  );
}

module.exports = { notify, notifySubscribers };
