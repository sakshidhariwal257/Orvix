const express = require('express');
const router = express.Router();
const {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  archiveWorkspace,
  unarchiveWorkspace,
  deleteWorkspace,
  inviteMember,
  updateMemberRole,
  removeMember,
  leaveWorkspace,
  createTeamInWorkspace,
  getWorkspaceTeams,
} = require('../controllers/workspaceController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createWorkspace);
router.get('/', protect, getWorkspaces);
router.get('/:id', protect, getWorkspaceById);
router.put('/:id', protect, updateWorkspace);
router.patch('/:id/archive', protect, archiveWorkspace);
router.patch('/:id/unarchive', protect, unarchiveWorkspace);
router.delete('/:id', protect, deleteWorkspace);

router.post('/:id/members', protect, inviteMember);
router.patch('/:id/members/:userId/role', protect, updateMemberRole);
router.delete('/:id/members/:userId', protect, removeMember);
router.post('/:id/leave', protect, leaveWorkspace);

router.post('/:id/teams', protect, createTeamInWorkspace);
router.get('/:id/teams', protect, getWorkspaceTeams);

module.exports = router;
