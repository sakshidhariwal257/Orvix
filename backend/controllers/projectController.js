const Project = require('../models/Project');
const Team = require('../models/Team');
const { isTeamMember } = require('./teamController');

// @route POST /api/projects
// @desc  Create a new project under a team
exports.createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      coverImage,
      status,
      priority,
      dueDate,
      labels,
      tags,
      visibility,
      teamId,
    } = req.body;

    if (!name || !teamId) {
      return res.status(400).json({ message: 'Project name and teamId are required' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    if (!isTeamMember(team, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to add projects to this team' });
    }

    const project = await Project.create({
      name,
      description: description || '',
      coverImage: coverImage || '',
      status: status || 'Planning',
      priority: priority || 'Medium',
      dueDate: dueDate || null,
      labels: labels || [],
      tags: tags || [],
      visibility: visibility || 'Team',
      owner: req.user._id,
      team: teamId,
      workspace: team.workspace || null,
    });

    const populated = await project.populate('owner', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/projects?teamId=<id>  or  ?workspaceId=<id>
exports.getProjects = async (req, res) => {
  try {
    const { teamId, workspaceId, includeArchived } = req.query;

    if (!teamId && !workspaceId) {
      return res.status(400).json({ message: 'teamId or workspaceId query param is required' });
    }

    const filter = {};
    if (teamId) {
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }
      if (!isTeamMember(team, req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to view projects for this team' });
      }
      filter.team = teamId;
    } else {
      filter.workspace = workspaceId;
    }

    if (includeArchived !== 'true') filter.archived = false;

    const projects = await Project.find(filter)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/projects/:id
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('owner', 'name email');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const team = await Team.findById(project.team);
    if (!team || !isTeamMember(team, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this project' });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const team = await Team.findById(project.team);
    if (!team || !isTeamMember(team, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    const {
      name,
      description,
      coverImage,
      status,
      priority,
      dueDate,
      labels,
      tags,
      visibility,
    } = req.body;

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (coverImage !== undefined) project.coverImage = coverImage;
    if (status !== undefined) project.status = status;
    if (priority !== undefined) project.priority = priority;
    if (dueDate !== undefined) project.dueDate = dueDate || null;
    if (labels !== undefined) project.labels = labels;
    if (tags !== undefined) project.tags = tags;
    if (visibility !== undefined) project.visibility = visibility;

    await project.save();
    const populated = await project.populate('owner', 'name email');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PATCH /api/projects/:id/archive
exports.archiveProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const team = await Team.findById(project.team);
    if (!team || !isTeamMember(team, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to archive this project' });
    }
    project.archived = true;
    await project.save();
    res.json({ message: 'Project archived' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PATCH /api/projects/:id/unarchive
exports.unarchiveProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const team = await Team.findById(project.team);
    if (!team || !isTeamMember(team, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to restore this project' });
    }
    project.archived = false;
    await project.save();
    res.json({ message: 'Project restored' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/projects/:id
// @desc  Permanently delete a project (owner or team owner only)
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const team = await Team.findById(project.team);
    const uid = req.user._id.toString();
    const canDelete = project.owner.toString() === uid || (team && team.owner.toString() === uid);
    if (!canDelete) {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }
    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/projects/:id/duplicate
// @desc  Duplicate a project's metadata (Boards/Tasks duplication lands with the Boards module)
exports.duplicateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const team = await Team.findById(project.team);
    if (!team || !isTeamMember(team, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to duplicate this project' });
    }

    const copy = await Project.create({
      name: `${project.name} (Copy)`,
      description: project.description,
      coverImage: project.coverImage,
      status: 'Planning',
      priority: project.priority,
      dueDate: null,
      labels: project.labels,
      tags: project.tags,
      visibility: project.visibility,
      owner: req.user._id,
      team: project.team,
      workspace: project.workspace,
    });

    const populated = await copy.populate('owner', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
