const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

// Runs after express-validator chains and returns 400 if any errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return sendError(res, 'Validation failed', 400, formatted);
  }
  next();
};

module.exports = validate;