const User = require('../models/User.js');
const { generateTokenPair, verifyRefreshToken, generateAccessToken } = require('../utils/jwt.js');
const { sendSuccess, sendError } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// POST /api/v1/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendError(res, 'Email already registered', 409);
  }

  // Prevent creating admin via public register (only admin can create admins)
  const safeRole = role === 'admin' && req.user?.role !== 'admin' ? 'user' : (role || 'user');

  const user = await User.create({ name, email, password, role: safeRole });

  const payload = { id: user._id, role: user.role };
  const { accessToken, refreshToken } = generateTokenPair(payload);

  // Store refresh token hash
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  logger.info(`New user registered: ${email} (${safeRole})`);

  return sendSuccess(
    res,
    { user, accessToken, refreshToken },
    'Registration successful',
    201
  );
});

// POST /api/v1/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user || !user.isActive) {
    return sendError(res, 'Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return sendError(res, 'Invalid email or password', 401);
  }

  const payload = { id: user._id, role: user.role };
  const { accessToken, refreshToken } = generateTokenPair(payload);

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  logger.info(`User logged in: ${email}`);

  // Don't send password back
  const userObj = user.toJSON();

  return sendSuccess(res, { user: userObj, accessToken, refreshToken }, 'Login successful');
});

// POST /api/v1/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    return sendError(res, 'Invalid or expired refresh token', 401);
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken || !user.isActive) {
    return sendError(res, 'Refresh token revoked or invalid', 401);
  }

  const newAccessToken = generateAccessToken({ id: user._id, role: user.role });

  return sendSuccess(res, { accessToken: newAccessToken }, 'Token refreshed');
});

// POST /api/v1/auth/logout
const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  logger.info(`User logged out: ${req.user.email}`);
  return sendSuccess(res, {}, 'Logged out successfully');
});

// GET /api/v1/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  return sendSuccess(res, { user }, 'Profile fetched');
});

// PATCH /api/v1/auth/me
const updateMe = asyncHandler(async (req, res) => {
  const allowed = ['name'];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  return sendSuccess(res, { user }, 'Profile updated');
});

module.exports = { register, login, refresh, logout, getMe, updateMe };