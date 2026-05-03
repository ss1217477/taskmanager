const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/tasks?project=&status=&priority=&assignee=&page=&limit=
router.get('/', auth, async (req, res) => {
  try {
    const { project, status, priority, assignee, search, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };

    if (project) filter.project = project;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignees = assignee;
    if (search) filter.title = { $regex: search, $options: 'i' };

    // If not admin, only show tasks in projects user belongs to
    if (req.user.role !== 'Admin') {
      const Project = require('../models/Project');
      const userProjects = await Project.find({ 'members.user': req.user._id, isDeleted: false }).select('_id');
      const projectIds = userProjects.map(p => p._id);
      filter.project = filter.project ? filter.project : { $in: projectIds };
    }

    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ tasks, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/trash — trashed tasks
router.get('/trash', auth, async (req, res) => {
  try {
    const filter = { isDeleted: true };
    if (req.user.role !== 'Admin') {
      const Project = require('../models/Project');
      const userProjects = await Project.find({ 'members.user': req.user._id }).select('_id');
      filter.project = { $in: userProjects.map(p => p._id) };
    }
    const tasks = await Task.find(filter)
      .populate('assignees', 'name email avatar')
      .populate('project', 'name')
      .sort({ deletedAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks — create task
router.post('/', auth, [
  body('title').trim().notEmpty().withMessage('Task title required'),
  body('project').notEmpty().withMessage('Project required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, description, project, assignees, status, priority, dueDate, tags, subtasks } = req.body;
    const task = await Task.create({
      title, description, project, assignees, status, priority, dueDate, tags, subtasks,
      createdBy: req.user._id
    });
    await task.populate('assignees', 'name email avatar');
    await task.populate('createdBy', 'name email');
    await task.populate('project', 'name');
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'name email avatar title')
      .populate('createdBy', 'name email')
      .populate('project', 'name members')
      .populate('comments.user', 'name avatar');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id — update task
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignees', 'name email avatar')
      .populate('project', 'name');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id/status — update status only
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('assignees', 'name email avatar');
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/comment — add comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    task.comments.push({ user: req.user._id, text: req.body.text });
    await task.save();
    await task.populate('comments.user', 'name avatar');
    res.json(task.comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id — soft delete (move to trash)
router.delete('/:id', auth, async (req, res) => {
  try {
    await Task.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date() });
    res.json({ message: 'Task moved to trash' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id/restore — restore from trash
router.patch('/:id/restore', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, { isDeleted: false, deletedAt: null }, { new: true });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id/permanent — permanently delete
router.delete('/:id/permanent', auth, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task permanently deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/trash/all — delete all trash
router.delete('/trash/all', auth, async (req, res) => {
  try {
    await Task.deleteMany({ isDeleted: true });
    res.json({ message: 'Trash cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
