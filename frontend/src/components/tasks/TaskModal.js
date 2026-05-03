import React, { useState, useEffect } from 'react';
import { tasksAPI, projectsAPI, teamAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const TaskModal = ({ task, onClose, onSave, defaultStatus }) => {
  const [form, setForm] = useState({
    title: '', description: '', project: '', assignees: [],
    status: defaultStatus || 'Todo', priority: 'Medium', dueDate: '', tags: ''
  });
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([projectsAPI.getAll(), teamAPI.getAll()]).then(([p, t]) => {
      setProjects(p.data);
      setMembers(t.data);
    });
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        project: task.project?._id || task.project || '',
        assignees: task.assignees?.map(a => a._id || a) || [],
        status: task.status || 'Todo',
        priority: task.priority || 'Medium',
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        tags: task.tags?.join(', ') || ''
      });
    }
  }, [task]);

  const toggleAssignee = (id) => {
    setForm(f => ({
      ...f,
      assignees: f.assignees.includes(id)
        ? f.assignees.filter(a => a !== id)
        : [...f.assignees, id]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project) return toast.error('Please select a project');
    setLoading(true);
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (task) {
        const res = await tasksAPI.update(task._id, payload);
        toast.success('Task updated');
        onSave(res.data);
      } else {
        const res = await tasksAPI.create(payload);
        toast.success('Task created!');
        onSave(res.data);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error saving task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{task ? 'Edit Task' : 'Create New Task'}</div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input className="form-input" placeholder="Enter task title..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="Task description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Project *</label>
              <select className="form-select" value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} required>
                <option value="">Select project</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {['High', 'Medium', 'Normal', 'Low'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="Todo">Todo</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input className="form-input" placeholder="design, frontend, bug" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Assign Members</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
              {members.map(m => (
                <label key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 10px', borderRadius: 20, border: `2px solid ${form.assignees.includes(m._id) ? 'var(--primary)' : 'var(--border)'}`, background: form.assignees.includes(m._id) ? 'var(--primary-light)' : 'white', fontSize: 13 }}>
                  <input type="checkbox" style={{ display: 'none' }} checked={form.assignees.includes(m._id)} onChange={() => toggleAssignee(m._id)} />
                  {m.name}
                </label>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
