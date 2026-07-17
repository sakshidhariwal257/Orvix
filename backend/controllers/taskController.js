const Task = require('../models/Task');
const Board = require('../models/Board');
const Team = require('../models/Team');
const { isTeamMember } = require('./teamController');
const { createNotification } = require('./notificationController');
const { getIO } = require('../socket');

// safely emit a socket event - never let a missing/uninitialized socket break an API response
const emitToBoard = (boardId, event, payload) => {
  try {
    getIO().to(`board:${boardId}`).emit(event, payload);
  } catch (err) {
    // socket not initialized - safe to ignore
  }
};

// helper: verify the logged in user belongs to the team that owns this board
const getAuthorizedBoard = async (boardId, userId) => {
  const board = await Board.findById(boardId);
  if (!board) return { board: null, team: null, authorized: false };

  const team = await Team.findById(board.team);
  const authorized = team ? isTeamMember(team, userId) : false;

  return { board, team, authorized };
};

// @route POST /api/tasks
// @desc  Create a new task on a board
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assignee, boardId, labels, attachments } = req.body;

    if (!title || !boardId) {
      return res.status(400).json({ message: 'Task title and boardId are required' });
    }

    const { board, authorized } = await getAuthorizedBoard(boardId, req.user._id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    if (!authorized) {
      return res.status(403).json({ message: 'Not authorized to add tasks to this board' });
    }

    const existingCount = await Task.countDocuments({
      board: boardId,
      status: status || 'Todo',
    });

    const task = await Task.create({
      title,
      description: description || '',
      status: status || 'Todo',
      priority: priority || 'Medium',
      dueDate: dueDate || null,
      order: existingCount,
      labels: labels || [],
      attachments: attachments || [],
      assignee: assignee || null,
      board: boardId,
      createdBy: req.user._id,
    });

    const populatedTask = await task.populate([
      { path: 'assignee', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
      { path: 'comments.user', select: 'name email' },
    ]);

    emitToBoard(boardId, 'task:created', populatedTask);

    if (assignee && assignee !== req.user._id.toString()) {
      await createNotification({
        userId: assignee,
        type: 'Task Assigned',
        message: `You were assigned to task "${title}"`,
        link: `/boards/${boardId}`,
      });
    }

    res.status(201).json(populatedTask);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/tasks?boardId=<id>
// @desc  Get all tasks for a given board
exports.getTasks = async (req, res) => {
  try {
    const { boardId } = req.query;

    if (!boardId) {
      return res.status(400).json({ message: 'boardId query param is required' });
    }

    const { board, authorized } = await getAuthorizedBoard(boardId, req.user._id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    if (!authorized) {
      return res.status(403).json({ message: 'Not authorized to view tasks for this board' });
    }

    const tasks = await Task.find({ board: boardId })
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email')
      .sort({ order: 1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/tasks/:id
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { authorized } = await getAuthorizedBoard(task.board, req.user._id);
    if (!authorized) {
      return res.status(403).json({ message: 'Not authorized to view this task' });
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/tasks/:id
// @desc  Update a task (title, description, status, priority, dueDate, assignee)
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { authorized } = await getAuthorizedBoard(task.board, req.user._id);
    if (!authorized) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const { title, description, status, priority, dueDate, assignee, labels, attachments } = req.body;

    const previousStatus = task.status;
    const previousAssignee = task.assignee ? task.assignee.toString() : null;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) {
      task.dueDate = dueDate || null;
      task.dueSoonNotified = false; // reset reminder if the due date changed
    }
    if (assignee !== undefined) task.assignee = assignee || null;
    if (labels !== undefined) task.labels = labels;
    if (attachments !== undefined) task.attachments = attachments;

    await task.save();

    const populatedTask = await task.populate([
      { path: 'assignee', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
      { path: 'comments.user', select: 'name email' },
    ]);

    emitToBoard(task.board.toString(), 'task:updated', populatedTask);

    const actorId = req.user._id.toString();
    const newAssignee = task.assignee ? task.assignee.toString() : null;

    if (newAssignee && newAssignee !== previousAssignee && newAssignee !== actorId) {
      await createNotification({
        userId: newAssignee,
        type: 'Task Assigned',
        message: `You were assigned to task "${task.title}"`,
        link: `/boards/${task.board}`,
      });
    }

    if (status !== undefined && status === 'Done' && previousStatus !== 'Done') {
      const notifyTargets = new Set(
        [task.createdBy.toString(), newAssignee].filter((id) => id && id !== actorId)
      );
      for (const targetId of notifyTargets) {
        await createNotification({
          userId: targetId,
          type: 'Task Completed',
          message: `Task "${task.title}" was marked as done`,
          link: `/boards/${task.board}`,
        });
      }
    }

    res.json(populatedTask);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { authorized } = await getAuthorizedBoard(task.board, req.user._id);
    if (!authorized) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    const boardId = task.board.toString();
    await task.deleteOne();
    emitToBoard(boardId, 'task:deleted', { taskId: task._id, boardId });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/tasks/:id/comments
// @desc  Add a comment to a task
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { authorized } = await getAuthorizedBoard(task.board, req.user._id);
    if (!authorized) {
      return res.status(403).json({ message: 'Not authorized to comment on this task' });
    }

    task.comments.push({ user: req.user._id, text });
    await task.save();

    const populatedTask = await task.populate([
      { path: 'assignee', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
      { path: 'comments.user', select: 'name email' },
    ]);

    emitToBoard(task.board.toString(), 'task:updated', populatedTask);

    // @mentions: notify any team member whose name is @mentioned in the comment text
    try {
      const board = await Board.findById(task.board);
      const team = board ? await Team.findById(board.team).populate('members', 'name') : null;
      if (team) {
        const lowerText = text.toLowerCase();
        const actorId = req.user._id.toString();
        for (const member of team.members) {
          if (
            member._id.toString() !== actorId &&
            lowerText.includes(`@${member.name.toLowerCase()}`)
          ) {
            await createNotification({
              userId: member._id,
              type: 'Mentioned in Comment',
              message: `You were mentioned in a comment on "${task.title}"`,
              link: `/boards/${task.board}`,
            });
          }
        }
      }
    } catch (mentionErr) {
      // mention parsing is best-effort - never fail the comment itself
    }

    res.status(201).json(populatedTask);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PATCH /api/tasks/reorder
// @desc  Bulk update status + order for tasks after a drag-and-drop action
exports.reorderTasks = async (req, res) => {
  try {
    const { updates } = req.body; // [{ id, status, order }, ...]

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'updates array is required' });
    }

    const firstTask = await Task.findById(updates[0].id);
    if (!firstTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { authorized } = await getAuthorizedBoard(firstTask.board, req.user._id);
    if (!authorized) {
      return res.status(403).json({ message: 'Not authorized to reorder these tasks' });
    }

    const bulkOps = updates.map(({ id, status, order }) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { status, order } },
      },
    }));

    await Task.bulkWrite(bulkOps);

    const tasks = await Task.find({ _id: { $in: updates.map((u) => u.id) } })
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

    emitToBoard(firstTask.board.toString(), 'task:reordered', tasks);

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/tasks/team/:teamId
// @desc  Get every task with a due date across all boards in a team (for the calendar view)
exports.getTeamTasks = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    if (!isTeamMember(team, req.user._id)) {
      return res.status(403).json({ message: "Not authorized to view this team's tasks" });
    }

    const boards = await Board.find({ team: teamId }).select('_id name');
    const boardIds = boards.map((b) => b._id);
    const boardNameById = {};
    boards.forEach((b) => (boardNameById[b._id.toString()] = b.name));

    const tasks = await Task.find({ board: { $in: boardIds }, dueDate: { $ne: null } })
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1 });

    const tasksWithBoardName = tasks.map((t) => {
      const obj = t.toObject();
      obj.boardName = boardNameById[t.board.toString()] || 'Unknown Board';
      return obj;
    });

    res.json(tasksWithBoardName);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/tasks/team/:teamId/stats
// @desc  Task counts by status/priority across all boards in a team (for Analytics)
exports.getTeamStats = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    if (!isTeamMember(team, req.user._id)) {
      return res.status(403).json({ message: "Not authorized to view this team's analytics" });
    }

    const boards = await Board.find({ team: teamId }).select('_id');
    const boardIds = boards.map((b) => b._id);

    const tasks = await Task.find({ board: { $in: boardIds } })
      .populate('assignee', 'name')
      .select('status priority dueDate assignee updatedAt');

    const byStatus = { Todo: 0, 'In Progress': 0, Review: 0, Done: 0 };
    const byPriority = { Low: 0, Medium: 0, High: 0 };
    const memberCounts = {};
    const weekCounts = {};
    let overdue = 0;
    const now = new Date();

    tasks.forEach((t) => {
      if (byStatus[t.status] !== undefined) byStatus[t.status] += 1;
      if (byPriority[t.priority] !== undefined) byPriority[t.priority] += 1;
      if (t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done') overdue += 1;

      const memberName = t.assignee?.name || 'Unassigned';
      memberCounts[memberName] = (memberCounts[memberName] || 0) + 1;

      if (t.status === 'Done' && t.updatedAt) {
        const d = new Date(t.updatedAt);
        const weekStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
        const key = weekStart.toISOString().slice(0, 10);
        weekCounts[key] = (weekCounts[key] || 0) + 1;
      }
    });

    const totalTasks = tasks.length;
    const completed = byStatus.Done;
    const pending = totalTasks - completed;
    const productivity = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;

    const byMember = Object.entries(memberCounts).map(([name, count]) => ({ name, count }));

    const completedPerWeek = Object.entries(weekCounts)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-8)
      .map(([week, count]) => ({
        week: new Date(week).toLocaleDateString('default', { month: 'short', day: 'numeric' }),
        count,
      }));

    res.json({
      totalTasks,
      totalBoards: boards.length,
      completed,
      pending,
      overdue,
      productivity,
      byStatus,
      byPriority,
      byMember,
      completedPerWeek,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};