const express = require('express');
const { body } = require('express-validator');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
];

// Routes
router.get('/', protect, getProjects);
router.post('/', protect, adminOnly, projectValidation, createProject);
router.get('/:id', protect, getProjectById);
router.put('/:id', protect, adminOnly, updateProject);
router.delete('/:id', protect, adminOnly, deleteProject);

module.exports = router;
