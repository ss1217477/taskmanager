const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/projects — list projects user is part of
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ],
      isDeleted: false
    }).populate('owner', 'name email').populate('members.user', 'name email avatar');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects — create project (Admin only)
router.post('/', auth, adminOnly, [
  body('name').trim().notEmpty().withMessage('Project name required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, description, dueDate, tags } = req.body;
    const project = await Project.create({
      name, description, dueDate, tags,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'Admin' }]
    });
    await project.populate('owner', 'name email');
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar title');
    if (!project || project.isDeleted) return res.status(404).json({ error: 'Project not found' });

    const isMember = project.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember && req.user.role !== 'Admin') return res.status(403).json({ error: 'Access denied' });

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isAdmin = project.members.find(m => m.user.toString() === req.user._id.toString() && m.role === 'Admin');
    if (!isAdmin && req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin access required' });

    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('members.user', 'name email avatar');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:id/members — add member
router.post('/:id/members', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { userId, role } = req.body;
    const alreadyMember = project.members.some(m => m.user.toString() === userId);
    if (alreadyMember) return res.status(400).json({ error: 'Already a member' });

    project.members.push({ user: userId, role: role || 'Member' });
    await project.save();
    await project.populate('members.user', 'name email avatar');
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id — soft delete
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Project.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
