import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardAPI } from '../utils/api';
import { getInitials, getAvatarColor, formatDate } from '../utils/helpers';

const StatCard = ({ label, value, sub, iconBg, icon }) => (
  <div className="stat-card">
    <div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
    <div className={`stat-icon ${iconBg}`}>{icon}</div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const priorityData = data?.priorityStats?.map(p => ({ name: p._id, total: p.total })) || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          label="Total Task" value={data?.stats?.total || 0} sub="All tasks"
          iconBg="blue"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>}
        />
        <StatCard
          label="Completed Task" value={data?.stats?.completed || 0} sub="Done"
          iconBg="green"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
        />
        <StatCard
          label="Task In Progress" value={data?.stats?.inProgress || 0} sub="In progress"
          iconBg="orange"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <StatCard
          label="Todos" value={data?.stats?.todos || 0} sub="Pending"
          iconBg="red"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        />
      </div>

      {/* Chart */}
      <div className="chart-card">
        <div className="chart-title">Chart by Priority</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={priorityData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="total" fill="#8b87f8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Recent Tasks */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>Recent Tasks</div>
          <table className="task-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Priority</th>
                <th>Team</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentTasks?.map(task => (
                <tr key={task._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`dot dot-${task.status === 'Completed' ? 'green' : task.status === 'In Progress' ? 'yellow' : 'blue'}`} />
                      {task.title}
                    </div>
                  </td>
                  <td><span className={`priority-badge priority-${task.priority}`}>{task.priority}</span></td>
                  <td>
                    <div className="avatar-group">
                      {task.assignees?.slice(0, 3).map(a => (
                        <div key={a._id} className="avatar" style={{ background: getAvatarColor(a.name), width: 26, height: 26, fontSize: 10 }}>{getInitials(a.name)}</div>
                      ))}
                    </div>
                  </td>
                  <td className="text-muted">{formatDate(task.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Team */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>Team Members</div>
          {data?.teamMembers?.map(m => (
            <div key={m._id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="avatar" style={{ background: getAvatarColor(m.name), width: 36, height: 36 }}>{getInitials(m.name)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.title || m.role}</div>
              </div>
              <span className="active-badge">Active</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
