const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  addComment,
  reorderTasks,
  getTeamTasks,
  getTeamStats,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createTask);
router.get('/', protect, getTasks);
router.patch('/reorder', protect, reorderTasks);
router.get('/team/:teamId/stats', protect, getTeamStats);
router.get('/team/:teamId', protect, getTeamTasks);
router.get('/:id', protect, getTaskById);
router.put('/:id', protect, updateTask);
router.delete('/:id', protect, deleteTask);
router.post('/:id/comments', protect, addComment);

module.exports = router;
