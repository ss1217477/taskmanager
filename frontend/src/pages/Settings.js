import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { getInitials, getAvatarColor } from '../utils/helpers';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', title: user?.title || '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authAPI.updateProfile(form);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      <div style={{ maxWidth: 560 }}>
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div className="avatar" style={{ width: 60, height: 60, fontSize: 22, background: getAvatarColor(user?.name) }}>
              {getInitials(user?.name)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{user?.email}</div>
              <span className={`role-badge role-${user?.role}`} style={{ marginTop: 4, display: 'inline-block' }}>{user?.role}</span>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Job Title</label>
              <input className="form-input" placeholder="e.g. Frontend Developer" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={user?.email} disabled style={{ background: '#f8fafc', color: 'var(--text-muted)' }} />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Email cannot be changed</div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="card" style={{ padding: 24, borderLeft: '3px solid var(--primary)' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Account Info</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            <div>Role: <strong>{user?.role}</strong></div>
            <div>Status: <strong style={{ color: 'var(--success)' }}>Active</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
