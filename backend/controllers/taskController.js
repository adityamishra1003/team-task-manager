const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Create a task under a project
// @route   POST /api/tasks
// @access  Private/Admin
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { title, description, status, priority, dueDate, assignedTo, projectId } = req.body;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const task = await Task.create({
      title,
      description,
      status: status || 'Todo',
      priority: priority || 'Medium',
      dueDate: dueDate || null,
      assignedTo: assignedTo || null,
      projectId,
      createdBy: req.user._id,
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('projectId', 'name');
    await task.populate('createdBy', 'name email');

    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks for a project OR all tasks (admin) OR my tasks (member)
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const { projectId, status, assignedTo } = req.query;
    let filter = {};

    if (projectId) filter.projectId = projectId;
    if (status) filter.status = status;

    if (req.user.role === 'member') {
      // Members see only tasks assigned to them
      filter.assignedTo = req.user._id;
    } else if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Members can only view their own tasks
    if (
      req.user.role === 'member' &&
      task.assignedTo?._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied to this task' });
    }

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task (Admin: all fields; Member: status only)
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Members can only update status of their own tasks
    if (req.user.role === 'member') {
      if (task.assignedTo?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied. Not your task.' });
      }
      task.status = req.body.status || task.status;
    } else {
      // Admin can update all fields
      const { title, description, status, priority, dueDate, assignedTo } = req.body;
      task.title = title || task.title;
      task.description = description !== undefined ? description : task.description;
      task.status = status || task.status;
      task.priority = priority || task.priority;
      task.dueDate = dueDate !== undefined ? dueDate : task.dueDate;
      task.assignedTo = assignedTo !== undefined ? assignedTo : task.assignedTo;
    }

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('projectId', 'name');
    await task.populate('createdBy', 'name email');

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/tasks/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role === 'member') {
      filter.assignedTo = req.user._id;
    }

    const now = new Date();

    const [total, completed, inProgress, todo, overdue] = await Promise.all([
      Task.countDocuments(filter),
      Task.countDocuments({ ...filter, status: 'Done' }),
      Task.countDocuments({ ...filter, status: 'In Progress' }),
      Task.countDocuments({ ...filter, status: 'Todo' }),
      Task.countDocuments({
        ...filter,
        status: { $ne: 'Done' },
        dueDate: { $lt: now, $ne: null },
      }),
    ]);

    // Recent tasks
    const recentTasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: { total, completed, inProgress, todo, overdue },
      recentTasks,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getDashboardStats,
};
