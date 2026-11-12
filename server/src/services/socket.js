const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');

let io = null;
const history = new Map(); // subjectId -> last 50 chat messages (memory only)

function init(httpServer) {
  io = new Server(httpServer, { cors: { origin: env.CLIENT_URL, credentials: true } });

  io.use((socket, next) => {
    try {
      const payload = jwt.verify(socket.handshake.auth && socket.handshake.auth.token, env.JWT_ACCESS_SECRET);
      socket.user = { id: payload.sub };
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const dbUser = await User.findById(socket.user.id).select('name');
    socket.user.name = dbUser ? dbUser.name : 'Student';
    socket.join('user:' + socket.user.id); // personal room for notifications

    let currentRoom = null;
    const presence = async (room) => {
      const sockets = await io.in(room).fetchSockets();
      io.to(room).emit('room:presence', { count: sockets.length });
    };
    const leave = () => {
      if (!currentRoom) return;
      const old = currentRoom;
      socket.leave(old);
      currentRoom = null;
      setImmediate(() => presence(old));
    };

    socket.on('room:join', async ({ subjectId } = {}) => {
      if (!mongoose.isValidObjectId(subjectId)) return;
      leave();
      currentRoom = 'room:' + subjectId;
      socket.join(currentRoom);
      socket.emit('room:history', history.get(subjectId) || []);
      await presence(currentRoom);
    });

    let lastMsg = 0;
    socket.on('room:message', ({ text } = {}) => {
      if (!currentRoom || typeof text !== 'string') return;
      const clean = text.trim().slice(0, 500);
      if (!clean || Date.now() - lastMsg < 400) return; // basic flood control
      lastMsg = Date.now();
      const subjectId = currentRoom.slice(5);
      const msg = { from: socket.user.name, userId: socket.user.id, text: clean, at: Date.now() };
      const list = history.get(subjectId) || [];
      list.push(msg);
      if (list.length > 50) list.shift();
      history.set(subjectId, list);
      io.to(currentRoom).emit('room:message', msg);
    });

    socket.on('room:leave', leave);
    socket.on('disconnect', leave);
  });

  return io;
}

function emitToUser(userId, event, payload) {
  if (io) io.to('user:' + userId).emit(event, payload);
}

module.exports = { init, emitToUser };
