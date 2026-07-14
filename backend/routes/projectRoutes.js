const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  archiveProject,
  unarchiveProject,
  deleteProject,
  duplicateProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createProject);
router.get('/', protect, getProjects);
router.get('/:id', protect, getProjectById);
router.put('/:id', protect, updateProject);
router.patch('/:id/archive', protect, archiveProject);
router.patch('/:id/unarchive', protect, unarchiveProject);
router.delete('/:id', protect, deleteProject);
router.post('/:id/duplicate', protect, duplicateProject);

module.exports = router;
