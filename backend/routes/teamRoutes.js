const express = require('express');
const router = express.Router();
const {
  createTeam,
  getTeams,
  getTeamById,
  deleteTeam,
  updateTeam,
  addMember,
  removeMember,
} = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createTeam);
router.get('/', protect, getTeams);
router.get('/:id', protect, getTeamById);
router.put('/:id', protect, updateTeam);
router.delete('/:id', protect, deleteTeam);
router.post('/:id/members', protect, addMember);
router.delete('/:id/members/:userId', protect, removeMember);

module.exports = router;
