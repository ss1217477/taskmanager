import React, { useState, useEffect } from 'react';
import { teamAPI, authAPI } from '../utils/api';
import { getInitials, getAvatarColor } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Team = () => {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', title: '', role: 'Member' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    teamAPI.getAll().then(res => setMembers(res.data)).finally(() => setLoading(false));
  }, []);

  const openAdd = () => { setEditUser(null); setForm({ name: '', email: '', password: '', title: '', role: 'Member' }); setShowModal(true); };
  const openEdit = (u) => { setEditUser(u); setForm({ name: u.name, email: u.email, title: u.title || '', role: u.role }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editUser) {
        const res = await teamAPI.update(editUser._id, form);
        setMembers(prev => prev.map(m => m._id === editUser._id ? res.data : m));
        toast.success('Member updated');
      } else {
        const res = await authAPI.register({ ...form, role: form.role });
        setMembers(prev => [res.data.user, ...prev]);
        toast.success('Member added');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this user?')) return;
    await teamAPI.delete(id);
    setMembers(prev => prev.map(m => m._id === id ? { ...m, isActive: false } : m));
    toast.success('User deactivated');
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Team Members</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAdd}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add New User
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="team-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Title</th>
              <th>Email</th>
              <th>Role</th>
              <th>Active</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m._id}>
                <td>
                  <div className="member-cell">
                    <div className="avatar" style={{ background: getAvatarColor(m.name) }}>{getInitials(m.name)}</div>
                    <div className="member-info">
                      <div className="name">{m.name}</div>
                    </div>
                  </div>
                </td>
                <td className="text-muted">{m.title || '—'}</td>
                <td className="text-muted">{m.email}</td>
                <td><span className={`role-badge role-${m.role}`}>{m.role}</span></td>
                <td>
                  <span className={m.isActive ? 'active-badge' : 'inactive-badge'}>
                    {m.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                {isAdmin && (
                  <td>
                    <div className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(m)}>Edit</button>
                      <button className="btn btn-sm" style={{ color: 'var(--danger)', background: 'none', border: '1px solid var(--border)' }} onClick={() => handleDelete(m._id)}>Delete</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">{editUser ? 'Edit Member' : 'Add New Member'}</div>
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input className="form-input" placeholder="Developer" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              {!editUser && (
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-input" placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="Member">Member</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
