const express = require('express');
const router = express.Router();
const {
  createBoard,
  getBoards,
  getBoardById,
  deleteBoard,
  updateBoard,
} = require('../controllers/boardController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createBoard);
router.get('/', protect, getBoards);
router.get('/:id', protect, getBoardById);
router.put('/:id', protect, updateBoard);
router.delete('/:id', protect, deleteBoard);

module.exports = router;
