const env = require('../config/env');

module.exports = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let status = err.status || 500;
  let message = err.message;
  if (err.code === 11000) { status = 409; message = 'This already exists'; }
  if (err.name === 'CastError' || err.name === 'ValidationError') status = 400;
  if (err.name === 'MulterError') { status = 400; message = err.code === 'LIMIT_FILE_SIZE' ? 'PDF is larger than 10 MB' : err.message; }
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 && env.NODE_ENV === 'production' ? 'Something went wrong' : message,
    details: err.details,
  });
};
