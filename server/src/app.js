const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const errorHandler = require('./middleware/error');
const { ApiError } = require('./utils/http');

function createApp() {
  const app = express();

  if (env.isProd) app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: env.clientOrigins, credentials: true }));
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());
  app.use(mongoSanitize()); // strips $ and . operators from user input
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false }));
  app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false }));
  app.use('/api/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false }));

  app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/subjects', require('./routes/subjects'));
  app.use('/api/papers', require('./routes/papers'));
  app.use('/api/questions', require('./routes/questions'));
  app.use('/api/search', require('./routes/search'));
  app.use('/api/notifications', require('./routes/notifications'));
  app.use('/api/payments', require('./routes/payments'));
  app.use('/api/admin', require('./routes/admin'));

  app.use((req, res, next) => next(new ApiError(404, 'Route not found')));
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
