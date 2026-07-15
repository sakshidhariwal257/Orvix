const Board = require('../models/Board');
const Team = require('../models/Team');
const { isTeamMember } = require('./teamController');

// @route POST /api/boards
// @desc  Create a new board under a team
exports.createBoard = async (req, res) => {
  try {
    const { name, description, teamId } = req.body;

    if (!name || !teamId) {
      return res.status(400).json({ message: 'Board name and teamId are required' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (!isTeamMember(team, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to add boards to this team' });
    }

    const board = await Board.create({
      name,
      description: description || '',
      team: teamId,
      createdBy: req.user._id,
    });

    const populatedBoard = await board.populate('createdBy', 'name email');

    res.status(201).json(populatedBoard);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/boards?teamId=<id>
// @desc  Get all boards for a given team
exports.getBoards = async (req, res) => {
  try {
    const { teamId } = req.query;

    if (!teamId) {
      return res.status(400).json({ message: 'teamId query param is required' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (!isTeamMember(team, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view boards for this team' });
    }

    const boards = await Board.find({ team: teamId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(boards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/boards/:id
exports.getBoardById = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id).populate('createdBy', 'name email');

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const team = await Team.findById(board.team);
    if (!team || !isTeamMember(team, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this board' });
    }

    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/boards/:id
// @desc  Delete a board (creator or team owner only)
exports.deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const team = await Team.findById(board.team);
    const uid = req.user._id.toString();
    const canDelete =
      board.createdBy.toString() === uid || (team && team.owner.toString() === uid);

    if (!canDelete) {
      return res.status(403).json({ message: 'Not authorized to delete this board' });
    }

    await board.deleteOne();
    res.json({ message: 'Board deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/boards/:id
// @desc  Update a board's name or description
exports.updateBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const team = await Team.findById(board.team);
    if (!team || !isTeamMember(team, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this board' });
    }

    const { name, description } = req.body;

    if (name !== undefined) board.name = name;
    if (description !== undefined) board.description = description;

    await board.save();

    const populatedBoard = await board.populate('createdBy', 'name email');
    res.json(populatedBoard);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
