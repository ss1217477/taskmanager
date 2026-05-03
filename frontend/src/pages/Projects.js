import React, { useState, useEffect } from 'react';
import { projectsAPI, teamAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const Projects = () => {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', dueDate: '', tags: '', memberIds: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([projectsAPI.getAll(), teamAPI.getAll()])
      .then(([p, t]) => { setProjects(p.data); setMembers(t.data); })
      .finally(() => setLoading(false));
  }, []);

  const toggleMember = (id) => setForm(f => ({
    ...f, memberIds: f.memberIds.includes(id) ? f.memberIds.filter(m => m !== id) : [...f.memberIds, id]
  }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      const res = await projectsAPI.create(payload);
      // Add selected members
      for (const uid of form.memberIds) {
        await projectsAPI.addMember(res.data._id, { userId: uid }).catch(() => {});
      }
      setProjects(prev => [res.data, ...prev]);
      toast.success('Project created!');
      setShowModal(false);
      setForm({ name: '', description: '', dueDate: '', tags: '', memberIds: [] });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error creating project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    await projectsAPI.delete(id);
    setProjects(prev => prev.filter(p => p._id !== id));
    toast.success('Project deleted');
  };

  const statusColor = { Active: 'green', Completed: 'blue', 'On Hold': 'orange', Cancelled: 'red' };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state card" style={{ padding: 60 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <h3>No projects yet</h3>
          <p>Create your first project to organize tasks</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {projects.map(p => (
            <div key={p._id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: statusColor[p.status] === 'green' ? '#dcfce7' : '#dbeafe', color: statusColor[p.status] === 'green' ? '#166534' : '#1d4ed8' }}>{p.status}</span>
                  {isAdmin && <button className="action-btn danger" onClick={() => handleDelete(p._id)}>🗑️</button>}
                </div>
              </div>
              {p.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{p.description}</p>}
              {p.dueDate && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Due: {formatDate(p.dueDate)}</div>}
              {p.tags?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  {p.tags.map(tag => <span key={tag} className="tag" style={{ marginRight: 4 }}>{tag}</span>)}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="avatar-group">
                  {p.members?.slice(0, 4).map(m => (
                    <div key={m.user?._id} title={m.user?.name} className="avatar" style={{ background: getAvatarColor(m.user?.name || ''), width: 28, height: 28, fontSize: 11 }}>
                      {getInitials(m.user?.name || '')}
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.members?.length} members</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">Create New Project</div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input className="form-input" placeholder="My Awesome Project" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="What is this project about?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="date" className="form-input" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tags</label>
                  <input className="form-input" placeholder="design, api, ux" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Add Team Members</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  {members.map(m => (
                    <label key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 10px', borderRadius: 20, border: `2px solid ${form.memberIds.includes(m._id) ? 'var(--primary)' : 'var(--border)'}`, background: form.memberIds.includes(m._id) ? 'var(--primary-light)' : 'white', fontSize: 13 }}>
                      <input type="checkbox" style={{ display: 'none' }} checked={form.memberIds.includes(m._id)} onChange={() => toggleMember(m._id)} />
                      {m.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
