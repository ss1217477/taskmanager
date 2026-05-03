import React, { useState, useEffect } from 'react';
import { tasksAPI } from '../utils/api';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const Trash = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = async () => {
    setLoading(true);
    try { const res = await tasksAPI.getTrash(); setTasks(res.data); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTrash(); }, []);

  const handleRestore = async (id) => {
    await tasksAPI.restore(id);
    setTasks(prev => prev.filter(t => t._id !== id));
    toast.success('Task restored');
  };

  const handlePermDelete = async (id) => {
    if (!window.confirm('Permanently delete this task?')) return;
    await tasksAPI.permanentDelete(id);
    setTasks(prev => prev.filter(t => t._id !== id));
    toast.success('Task permanently deleted');
  };

  const handleRestoreAll = async () => {
    for (const t of tasks) await tasksAPI.restore(t._id);
    setTasks([]);
    toast.success('All tasks restored');
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Permanently delete ALL trashed tasks?')) return;
    await tasksAPI.clearTrash();
    setTasks([]);
    toast.success('Trash cleared');
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Trashed Tasks</h1>
        {tasks.length > 0 && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={handleRestoreAll}>
              🔄 Restore All
            </button>
            <button className="btn btn-danger" onClick={handleDeleteAll}>
              🗑️ Delete All
            </button>
          </div>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state card" style={{ padding: 60 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          <h3>Trash is empty</h3>
          <p>Deleted tasks will appear here</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="task-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Priority</th>
                <th>Stage</th>
                <th>Modified On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`dot dot-${task.status === 'Completed' ? 'green' : task.status === 'In Progress' ? 'yellow' : 'blue'}`} />
                      {task.title}
                    </div>
                  </td>
                  <td><span className={`priority-badge priority-${task.priority}`}>{task.priority}</span></td>
                  <td><span className={`status-badge status-${task.status?.replace(' ', '-')}`}>{task.status}</span></td>
                  <td className="text-muted" style={{ fontSize: 12 }}>{formatDate(task.updatedAt)}</td>
                  <td>
                    <div className="actions">
                      <button className="action-btn" title="Restore" onClick={() => handleRestore(task._id)}>🔄</button>
                      <button className="action-btn danger" title="Delete permanently" onClick={() => handlePermDelete(task._id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Trash;
