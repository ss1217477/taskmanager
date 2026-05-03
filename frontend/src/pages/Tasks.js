import React, { useState, useEffect, useCallback } from 'react';
import { tasksAPI } from '../utils/api';
import { getInitials, getAvatarColor, formatDate, isOverdue } from '../utils/helpers';
import TaskModal from '../components/tasks/TaskModal';
import toast from 'react-hot-toast';

const STATUSES = ['Todo', 'In Progress', 'Completed'];
const STATUS_COLORS = { 'Todo': '#3b82f6', 'In Progress': '#f59e0b', 'Completed': '#22c55e' };

const AvatarGroup = ({ users = [] }) => (
  <div className="avatar-group">
    {users.slice(0, 3).map(u => (
      <div key={u._id} title={u.name} className="avatar" style={{ background: getAvatarColor(u.name) }}>{getInitials(u.name)}</div>
    ))}
  </div>
);

const TaskCard = ({ task, onEdit, onDelete }) => (
  <div className="task-card" onClick={() => onEdit(task)}>
    <div className="task-card-header">
      <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
      <button className="action-btn danger" onClick={e => { e.stopPropagation(); onDelete(task._id); }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
    </div>
    <div className="task-title">{task.title}</div>
    <div className="task-date" style={{ color: isOverdue(task.dueDate, task.status) ? 'var(--danger)' : 'var(--text-muted)' }}>
      {formatDate(task.dueDate || task.createdAt)}
    </div>
    {task.tags?.length > 0 && (
      <div style={{ marginTop: 8 }}>
        {task.tags.slice(0, 2).map(tag => <span key={tag} className="tag" style={{ marginRight: 4 }}>{tag}</span>)}
      </div>
    )}
    {task.project && (
      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>{task.project?.name}</div>
    )}
    <div className="task-footer">
      <div className="task-meta">
        <span>💬 {task.comments?.length || 0}</span>
        <span>📎 {task.attachments?.length || 0}</span>
        <span>☑ {task.subtasks?.filter(s => s.completed).length || 0}/{task.subtasks?.length || 0}</span>
      </div>
      <AvatarGroup users={task.assignees || []} />
    </div>
  </div>
);

const Tasks = ({ filterStatus, title }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('board');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const res = await tasksAPI.getAll(params);
      setTasks(res.data.tasks);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleDelete = async (id) => {
    if (!window.confirm('Move to trash?')) return;
    await tasksAPI.delete(id);
    toast.success('Moved to trash');
    setTasks(prev => prev.filter(t => t._id !== id));
  };

  const handleEdit = (task) => { setEditTask(task); setShowModal(true); };

  const handleSave = (savedTask) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t._id === savedTask._id);
      if (idx >= 0) { const next = [...prev]; next[idx] = savedTask; return next; }
      return [savedTask, ...prev];
    });
  };

  const grouped = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s);
    return acc;
  }, {});

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{title || 'Tasks'}</h1>
        {!filterStatus && (
          <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowModal(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Task
          </button>
        )}
      </div>

      {/* View Toggle */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <div className={`tab${view === 'board' ? ' active' : ''}`} onClick={() => setView('board')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Board View
        </div>
        <div className={`tab${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          List View
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state card" style={{ padding: 60 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/></svg>
          <h3>No tasks found</h3>
          <p>Create your first task to get started</p>
        </div>
      ) : view === 'board' ? (
        <div className="board-columns">
          {(filterStatus ? [filterStatus] : STATUSES).map(status => (
            <div key={status} className="board-column">
              <div className="column-header">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="column-dot" style={{ background: STATUS_COLORS[status] }} />
                  {status}
                </div>
                <span style={{ background: 'var(--border)', borderRadius: 20, padding: '1px 8px', fontSize: 12 }}>{grouped[status]?.length || 0}</span>
              </div>
              {(filterStatus ? tasks : grouped[status])?.map(task => (
                <TaskCard key={task._id} task={task} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="task-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Priority</th>
                <th>Stage</th>
                <th>Assignees</th>
                <th>Modified On</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task._id} style={{ cursor: 'pointer' }} onClick={() => handleEdit(task)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`dot dot-${task.status === 'Completed' ? 'green' : task.status === 'In Progress' ? 'yellow' : 'blue'}`} />
                      {task.title}
                    </div>
                  </td>
                  <td><span className={`priority-badge priority-${task.priority}`}>{task.priority}</span></td>
                  <td><span className={`status-badge status-${task.status.replace(' ', '-')}`}>{task.status}</span></td>
                  <td><AvatarGroup users={task.assignees || []} /></td>
                  <td className="text-muted" style={{ fontSize: 12 }}>{formatDate(task.updatedAt)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="actions">
                      <button className="action-btn" onClick={() => handleEdit(task)}>✏️</button>
                      <button className="action-btn danger" onClick={() => handleDelete(task._id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <TaskModal
          task={editTask}
          defaultStatus={filterStatus}
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Tasks;
