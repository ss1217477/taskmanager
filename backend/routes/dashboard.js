const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let taskFilter = { isDeleted: false };
    if (req.user.role !== 'Admin') {
      const userProjects = await Project.find({ 'members.user': req.user._id }).select('_id');
      taskFilter.project = { $in: userProjects.map(p => p._id) };
    }

    const [total, completed, inProgress, todos, overdue, recentTasks, teamMembers, priorityStats] = await Promise.all([
      Task.countDocuments(taskFilter),
      Task.countDocuments({ ...taskFilter, status: 'Completed' }),
      Task.countDocuments({ ...taskFilter, status: 'In Progress' }),
      Task.countDocuments({ ...taskFilter, status: 'Todo' }),
      Task.countDocuments({ ...taskFilter, dueDate: { $lt: now }, status: { $ne: 'Completed' } }),
      Task.find(taskFilter)
        .populate('assignees', 'name avatar email')
        .populate('project', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
      User.find({ isActive: true }).select('name email title role createdAt avatar'),
      Task.aggregate([
        { $match: taskFilter },
        { $group: { _id: '$priority', total: { $sum: 1 } } }
      ])
    ]);

    res.json({
      stats: { total, completed, inProgress, todos, overdue },
      recentTasks,
      teamMembers,
      priorityStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    // Tasks assigned to current user, recent
    const tasks = await Task.find({
      assignees: req.user._id,
      isDeleted: false,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).populate('project', 'name').populate('createdBy', 'name').sort({ createdAt: -1 }).limit(10);

    const notifications = tasks.map(t => ({
      id: t._id,
      type: 'task_assigned',
      message: `New task assigned: ${t.title}`,
      project: t.project?.name,
      createdAt: t.createdAt
    }));

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
