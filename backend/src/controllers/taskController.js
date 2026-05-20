const Task = require('../models/Task');
const User = require('../models/User');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/v1/tasks
const getTasks = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    priority,
    sortBy = 'createdAt',
    order = 'desc',
    search,
  } = req.query;

  const filter = {};

  // Admins see all tasks; users only see their own
  if (req.user.role !== 'admin') {
    filter.owner = req.user._id;
  }

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const sortOrder = order === 'asc' ? 1 : -1;
  const skip = (page - 1) * limit;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('owner', 'name email')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Task.countDocuments(filter),
  ]);

  return sendPaginated(res, tasks, total, page, limit);
});

// GET /api/v1/tasks/:id
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('owner', 'name email');

  if (!task) return sendError(res, 'Task not found', 404);

  // Users can only view their own tasks
  if (req.user.role !== 'admin' && task.owner._id.toString() !== req.user._id.toString()) {
    return sendError(res, 'Access denied', 403);
  }

  return sendSuccess(res, { task }, 'Task fetched');
});

// POST /api/v1/tasks
const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate, tags } = req.body;

  const task = await Task.create({
    title,
    description,
    status,
    priority,
    dueDate,
    tags,
    owner: req.user._id,
  });

  await task.populate('owner', 'name email');

  return sendSuccess(res, { task }, 'Task created', 201);
});

// PATCH /api/v1/tasks/:id
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) return sendError(res, 'Task not found', 404);

  if (req.user.role !== 'admin' && task.owner.toString() !== req.user._id.toString()) {
    return sendError(res, 'Access denied', 403);
  }

  const allowed = ['title', 'description', 'status', 'priority', 'dueDate', 'tags'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  });

  await task.save();
  await task.populate('owner', 'name email');

  return sendSuccess(res, { task }, 'Task updated');
});

// DELETE /api/v1/tasks/:id
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) return sendError(res, 'Task not found', 404);

  if (req.user.role !== 'admin' && task.owner.toString() !== req.user._id.toString()) {
    return sendError(res, 'Access denied', 403);
  }

  await task.deleteOne();

  return sendSuccess(res, {}, 'Task deleted');
});

// GET /api/v1/tasks/stats  (admin only)
const getStats = asyncHandler(async (req, res) => {
  const stats = await Task.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const priorityStats = await Task.aggregate([
    { $group: { _id: '$priority', count: { $sum: 1 } } },
  ]);

  const totalTasks = await Task.countDocuments();
  const totalUsers = await User.countDocuments();

  return sendSuccess(res, {
    totalTasks,
    totalUsers,
    byStatus: stats,
    byPriority: priorityStats,
  }, 'Stats fetched');
});

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, getStats };