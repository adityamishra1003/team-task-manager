const express = require('express');
const { body } = require('express-validator');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getDashboardStats,
} = require('../controllers/taskController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

const taskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('projectId').notEmpty().withMessage('Project ID is required'),
];

// Routes
router.get('/stats', protect, getDashboardStats);        // Dashboard stats
router.get('/', protect, getTasks);                       // Get all/filtered tasks
router.post('/', protect, adminOnly, taskValidation, createTask);
router.get('/:id', protect, getTaskById);
router.put('/:id', protect, updateTask);                  // Admin: all fields; Member: status only
router.delete('/:id', protect, adminOnly, deleteTask);

module.exports = router;
