const User = require('../models/User');
const Task = require('../models/Task');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/v1/users  (admin only)
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, search } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    User.countDocuments(filter),
  ]);

  return sendPaginated(res, users, total, page, limit);
});

// GET /api/v1/users/:id  (admin only)
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 'User not found', 404);
  return sendSuccess(res, { user }, 'User fetched');
});

// PATCH /api/v1/users/:id  (admin only)
const updateUser = asyncHandler(async (req, res) => {
  const { name, role, isActive } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { ...(name && { name }), ...(role && { role }), ...(isActive !== undefined && { isActive }) },
    { new: true, runValidators: true }
  );

  if (!user) return sendError(res, 'User not found', 404);

  return sendSuccess(res, { user }, 'User updated');
});

// DELETE /api/v1/users/:id  (admin only)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 'User not found', 404);

  if (user._id.toString() === req.user._id.toString()) {
    return sendError(res, 'You cannot delete your own account', 400);
  }

  await Task.deleteMany({ owner: user._id });
  await user.deleteOne();

  return sendSuccess(res, {}, 'User and associated tasks deleted');
});

module.exports = { getUsers, getUser, updateUser, deleteUser };