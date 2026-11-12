const { ApiError } = require('../utils/http');

const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(new ApiError(400, 'Please check the highlighted fields', result.error.flatten().fieldErrors));
  }
  req[source] = result.data;
  next();
};

module.exports = validate;
