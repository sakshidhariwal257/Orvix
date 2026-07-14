const Workspace = require('../models/Workspace');
const Team = require('../models/Team');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

const ROLE_RANK = { Owner: 4, Admin: 3, Manager: 2, Member: 1, Guest: 0 };

// helper: is the logged in user a member (at any role) of this workspace?
const isWorkspaceMember = (workspace, userId) => {
  const uid = userId.toString();
  return (
    workspace.owner.toString() === uid ||
    workspace.members.some((m) => m.user.toString() === uid)
  );
};

// helper: what role does this user hold in the workspace? (Owner if they're the owner)
const getWorkspaceRole = (workspace, userId) => {
  const uid = userId.toString();
  if (workspace.owner.toString() === uid) return 'Owner';
  const membership = workspace.members.find((m) => m.user.toString() === uid);
  return membership ? membership.role : null;
};

// helper: does this user's role meet or exceed the required role?
const hasWorkspaceRole = (workspace, userId, requiredRole) => {
  const role = getWorkspaceRole(workspace, userId);
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[requiredRole];
};

// @route POST /api/workspaces
// @desc  Create a new workspace (creator becomes Owner)
exports.createWorkspace = async (req, res) => {
  try {
    const { name, description, type, color } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Workspace name is required' });
    }
    if (type && !['Personal', 'Team', 'Organization'].includes(type)) {
      return res.status(400).json({ message: 'Invalid workspace type' });
    }

    const workspace = await Workspace.create({
      name,
      description: description || '',
      type: type || 'Team',
      color: color || '#7c5cff',
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'Owner' }],
    });

    const populated = await workspace.populate('members.user', 'name email avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/workspaces
// @desc  Get all workspaces the logged in user owns or belongs to
exports.getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
      archived: false,
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email avatar')
      .sort({ createdAt: -1 });

    const withCounts = await Promise.all(
      workspaces.map(async (ws) => {
        const teamCount = await Team.countDocuments({ workspace: ws._id });
        const obj = ws.toObject();
        obj.teamCount = teamCount;
        obj.myRole = getWorkspaceRole(ws, req.user._id);
        return obj;
      })
    );

    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/workspaces/:id
exports.getWorkspaceById = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email avatar');

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    if (!isWorkspaceMember(workspace, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this workspace' });
    }

    const obj = workspace.toObject();
    obj.myRole = getWorkspaceRole(workspace, req.user._id);
    res.json(obj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/workspaces/:id
// @desc  Update workspace settings (Admin or Owner only)
exports.updateWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    if (!hasWorkspaceRole(workspace, req.user._id, 'Admin')) {
      return res.status(403).json({ message: 'Only an Admin or Owner can update this workspace' });
    }

    const { name, description, color, settings } = req.body;

    if (name !== undefined) workspace.name = name;
    if (description !== undefined) workspace.description = description;
    if (color !== undefined) workspace.color = color;
    if (settings !== undefined) {
      workspace.settings = { ...workspace.settings.toObject(), ...settings };
    }

    await workspace.save();
    const populated = await workspace.populate('members.user', 'name email avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PATCH /api/workspaces/:id/archive
exports.archiveWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can archive this workspace' });
    }
    workspace.archived = true;
    await workspace.save();
    res.json({ message: 'Workspace archived' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PATCH /api/workspaces/:id/unarchive
exports.unarchiveWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can restore this workspace' });
    }
    workspace.archived = false;
    await workspace.save();
    res.json({ message: 'Workspace restored' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/workspaces/:id
// @desc  Permanently delete a workspace (owner only)
exports.deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can delete this workspace' });
    }
    await workspace.deleteOne();
    res.json({ message: 'Workspace deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/workspaces/:id/members
// @desc  Invite an existing user to the workspace by email
exports.inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    if (!hasWorkspaceRole(workspace, req.user._id, 'Manager')) {
      return res.status(403).json({ message: 'Not authorized to invite members to this workspace' });
    }

    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      return res.status(404).json({ message: "User doesn't exist" });
    }

    const alreadyMember = isWorkspaceMember(workspace, invitedUser._id);
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this workspace' });
    }

    const assignedRole = role && ['Admin', 'Manager', 'Member', 'Guest'].includes(role) ? role : 'Member';
    workspace.members.push({ user: invitedUser._id, role: assignedRole });
    await workspace.save();

    await createNotification({
      userId: invitedUser._id,
      type: 'Workspace Invite',
      message: `You were added to workspace "${workspace.name}"`,
      link: `/workspaces/${workspace._id}`,
    });

    const populated = await workspace.populate('members.user', 'name email avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PATCH /api/workspaces/:id/members/:userId/role
// @desc  Change a member's role (Admin or Owner only, cannot demote the Owner)
exports.updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['Admin', 'Manager', 'Member', 'Guest'];

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ message: `Role must be one of: ${validRoles.join(', ')}` });
    }

    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    if (!hasWorkspaceRole(workspace, req.user._id, 'Admin')) {
      return res.status(403).json({ message: 'Only an Admin or Owner can change member roles' });
    }
    if (workspace.owner.toString() === req.params.userId) {
      return res.status(400).json({ message: "The workspace owner's role cannot be changed" });
    }

    const membership = workspace.members.find((m) => m.user.toString() === req.params.userId);
    if (!membership) {
      return res.status(404).json({ message: 'Member not found in this workspace' });
    }

    membership.role = role;
    await workspace.save();

    await createNotification({
      userId: req.params.userId,
      type: 'Role Changed',
      message: `Your role in "${workspace.name}" was changed to ${role}`,
      link: `/workspaces/${workspace._id}`,
    });

    const populated = await workspace.populate('members.user', 'name email avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/workspaces/:id/members/:userId
// @desc  Remove a member (Admin or Owner only)
exports.removeMember = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    if (!hasWorkspaceRole(workspace, req.user._id, 'Admin')) {
      return res.status(403).json({ message: 'Only an Admin or Owner can remove members' });
    }
    if (workspace.owner.toString() === req.params.userId) {
      return res.status(400).json({ message: 'The workspace owner cannot be removed' });
    }

    workspace.members = workspace.members.filter((m) => m.user.toString() !== req.params.userId);
    await workspace.save();

    const populated = await workspace.populate('members.user', 'name email avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/workspaces/:id/leave
// @desc  The logged-in user leaves the workspace (owner cannot leave; must transfer or delete)
exports.leaveWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    if (workspace.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'The owner cannot leave - delete or transfer the workspace instead' });
    }

    workspace.members = workspace.members.filter(
      (m) => m.user.toString() !== req.user._id.toString()
    );
    await workspace.save();
    res.json({ message: 'You left the workspace' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/workspaces/:id/teams
// @desc  Create a Team inside this workspace. Uses the existing Team model
//        directly (teamController.js is left untouched) so the team gets its
//        new optional `workspace` field set at creation time.
exports.createTeamInWorkspace = async (req, res) => {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Team name is required' });
    }

    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    if (!isWorkspaceMember(workspace, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to create teams in this workspace' });
    }

    const team = await Team.create({
      name,
      description: description || '',
      color: color || workspace.color,
      owner: req.user._id,
      members: [req.user._id],
      workspace: workspace._id,
    });

    res.status(201).json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/workspaces/:id/teams
exports.getWorkspaceTeams = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    if (!isWorkspaceMember(workspace, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view teams in this workspace' });
    }

    const teams = await Team.find({ workspace: workspace._id })
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.isWorkspaceMember = isWorkspaceMember;
module.exports.getWorkspaceRole = getWorkspaceRole;
module.exports.hasWorkspaceRole = hasWorkspaceRole;
