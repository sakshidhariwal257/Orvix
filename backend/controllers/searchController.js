const Team = require('../models/Team');
const Board = require('../models/Board');
const Task = require('../models/Task');
const User = require('../models/User');

// @route GET /api/search?q=<query>
// @desc  Global search across tasks, boards, teams, and members - scoped to
//        teams the logged-in user belongs to (never leaks other users' data)
exports.globalSearch = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.json({ teams: [], boards: [], tasks: [], members: [] });
    }

    const regex = new RegExp(q.trim(), 'i');

    const myTeams = await Team.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    }).select('_id name members owner');

    const myTeamIds = myTeams.map((t) => t._id);

    const boards = await Board.find({ team: { $in: myTeamIds }, name: regex })
      .select('_id name team')
      .limit(10);

    const boardIdsInTeams = await Board.find({ team: { $in: myTeamIds } }).select('_id');
    const boardIds = boardIdsInTeams.map((b) => b._id);

    const tasks = await Task.find({ board: { $in: boardIds }, title: regex })
      .select('_id title status board')
      .limit(10);

    const teams = myTeams.filter((t) => regex.test(t.name)).slice(0, 10);

    // members: only people who share a team with the current user
    const memberIdSet = new Set();
    myTeams.forEach((t) => {
      memberIdSet.add(t.owner.toString());
      t.members.forEach((m) => memberIdSet.add(m.toString()));
    });
    const members = await User.find({
      _id: { $in: Array.from(memberIdSet) },
      $or: [{ name: regex }, { email: regex }],
    })
      .select('_id name email avatar')
      .limit(10);

    res.json({
      teams: teams.map((t) => ({ _id: t._id, name: t.name })),
      boards,
      tasks,
      members,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};