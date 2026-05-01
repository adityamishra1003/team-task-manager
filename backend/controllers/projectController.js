const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private/Admin
const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, description, members } = req.body;

    const project = await Project.create({
      name,
      description,
      members: members || [],
      createdBy: req.user._id,
    });

    await project.populate('members', 'name email role');
    await project.populate('createdBy', 'name email');

    res.status(201).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects (admin sees all, member sees assigned ones)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    let query;

    if (req.user.role === 'admin') {
      query = Project.find({});
    } else {
      // Members only see projects they are part of
      query = Project.find({ members: req.user._id });
    }

    const projects = await query
      .populate('members', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, projects });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members', 'name email role')
      .populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Members can only view projects they belong to
    if (
      req.user.role !== 'admin' &&
      !project.members.some((m) => m._id.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private/Admin
const updateProject = async (req, res, next) => {
  try {
    const { name, description, members } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.name = name || project.name;
    project.description = description !== undefined ? description : project.description;
    project.members = members !== undefined ? members : project.members;

    await project.save();
    await project.populate('members', 'name email role');
    await project.populate('createdBy', 'name email');

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a project (also deletes associated tasks)
// @route   DELETE /api/projects/:id
// @access  Private/Admin
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Delete all tasks associated with this project
    await Task.deleteMany({ projectId: req.params.id });

    await project.deleteOne();

    res.json({ success: true, message: 'Project and associated tasks deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
