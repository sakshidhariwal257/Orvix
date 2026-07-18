const Task = require('../models/Task');
const { createNotification } = require('../controllers/notificationController');

// Finds tasks due tomorrow (not yet Done, not yet notified) and sends a
// "Due Tomorrow" notification to the assignee.
async function checkDueTomorrowTasks() {
  try {
    const now = new Date();
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);

    const tasks = await Task.find({
      dueDate: { $gte: tomorrowStart, $lt: tomorrowEnd },
      status: { $ne: 'Done' },
      dueSoonNotified: { $ne: true },
      assignee: { $ne: null },
    });

    for (const task of tasks) {
      await createNotification({
        userId: task.assignee,
        type: 'Due Tomorrow',
        message: `Task "${task.title}" is due tomorrow`,
        link: `/boards/${task.board}`,
      });
      task.dueSoonNotified = true;
      await task.save();
    }
  } catch (err) {
    console.error('Due date reminder job failed:', err.message);
  }
}

// Runs once shortly after server start, then every hour
function startDueDateReminderJob() {
  setTimeout(checkDueTomorrowTasks, 10 * 1000);
  setInterval(checkDueTomorrowTasks, 60 * 60 * 1000);
}

module.exports = { startDueDateReminderJob, checkDueTomorrowTasks };