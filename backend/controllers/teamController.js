const Team = require('../models/Team');
const Board = require('../models/Board');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// helper: is the logged in user allowed to access this team?
const isTeamMember = (team, userId) => {
  const uid = userId.toString();
  return (
    team.owner.toString() === uid ||
    team.members.some((m) => m.toString() === uid)
  );
};

// @route POST /api/teams
// @desc  Create a new team (creator becomes owner + first member)
exports.createTeam = async (req, res) => {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Team name is required' });
    }

    const team = await Team.create({
      name,
      description: description || '',
      color: color || '#2563eb',
      owner: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/teams
// @desc  Get all teams the logged in user owns or belongs to
exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    })
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    const teamsWithCounts = await Promise.all(
      teams.map(async (team) => {
        const boardCount = await Board.countDocuments({ team: team._id });
        const obj = team.toObject();
        obj.boardCount = boardCount;
        return obj;
      })
    );

    res.json(teamsWithCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/teams/:id
// @desc  Get a single team by id
exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (!isTeamMember(team, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this team' });
    }

    res.json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/teams/:id
// @desc  Delete a team (owner only)
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can delete this team' });
    }

    await team.deleteOne();
    res.json({ message: 'Team deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.isTeamMember = isTeamMember;

// @route PUT /api/teams/:id
// @desc  Update a team's name, description, or color (owner or admin only)
exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const uid = req.user._id.toString();
    const isOwner = team.owner.toString() === uid;
    const isAdmin = team.admins.some((a) => a.toString() === uid);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Only the owner or an admin can update this team' });
    }

    const { name, description, color } = req.body;

    if (name !== undefined) team.name = name;
    if (description !== undefined) team.description = description;
    if (color !== undefined) team.color = color;

    await team.save();

    const populatedTeam = await team.populate([
      { path: 'owner', select: 'name email' },
      { path: 'members', select: 'name email' },
    ]);

    res.json(populatedTeam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/teams/:id/members
// @desc  Invite a member to the team by email (MVP: user must already exist)
exports.addMember = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (!isTeamMember(team, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to invite members to this team' });
    }

    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      return res.status(404).json({ message: "User doesn't exist" });
    }

    const alreadyMember =
      team.owner.toString() === invitedUser._id.toString() ||
      team.members.some((m) => m.toString() === invitedUser._id.toString());

    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this team' });
    }

    team.members.push(invitedUser._id);
    await team.save();

    await createNotification({
      userId: invitedUser._id,
      type: 'Added to Team',
      message: `You were added to team "${team.name}"`,
      link: '/dashboard',
    });

    const populatedTeam = await team.populate([
      { path: 'owner', select: 'name email' },
      { path: 'members', select: 'name email' },
    ]);

    res.status(201).json(populatedTeam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/teams/:id/members/:userId
// @desc  Remove a member from a team (owner only)
exports.removeMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can remove members' });
    }

    team.members = team.members.filter((m) => m.toString() !== req.params.userId);
    team.admins = team.admins.filter((a) => a.toString() !== req.params.userId);
    await team.save();

    const populatedTeam = await team.populate([
      { path: 'owner', select: 'name email' },
      { path: 'members', select: 'name email' },
    ]);

    res.json(populatedTeam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};