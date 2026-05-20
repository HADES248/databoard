import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Spinner from '../components/Spinner';

const STATUS_COLOR = { todo: '#6c63ff', 'in-progress': '#ffb340', done: '#00d4aa' };
const PRIORITY_COLOR = { low: '#00d4aa', medium: '#ffb340', high: '#ff4f6a' };

const EMPTY_FORM = { title: '', description: '', status: 'todo', priority: 'medium', dueDate: '' };

export default function Tasks() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', page: 1 });
  const [modal, setModal] = useState(null); // null | 'create' | task object
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: filters.page, limit: 10 });
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);
      const { data } = await api.get(`/tasks?${params}`);
      setTasks(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const openCreate = () => { setForm(EMPTY_FORM); setFormErrors({}); setModal('create'); };
  const openEdit = (task) => {
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    });
    setFormErrors({});
    setModal(task);
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    else if (form.title.trim().length < 3) e.title = 'Minimum 3 characters';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const body = { ...form };
      if (!body.dueDate) delete body.dueDate;

      if (modal === 'create') {
        await api.post('/tasks', body);
        toast.success('Task created!');
      } else {
        await api.patch(`/tasks/${modal._id}`, body);
        toast.success('Task updated!');
      }
      setModal(null);
      fetchTasks();
    } catch (err) {
      const apiErrors = err.response?.data?.errors || [];
      if (apiErrors.length) {
        const mapped = {};
        apiErrors.forEach((e) => { mapped[e.field] = e.message; });
        setFormErrors(mapped);
      } else {
        toast.error(err.response?.data?.message || 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    setDeleting(taskId);
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchTasks();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const handleFilterChange = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val, page: 1 }));
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>✦ Tasks</h1>
          <p style={styles.subtitle}>{pagination.total} task{pagination.total !== 1 ? 's' : ''} total</p>
        </div>
        <Button onClick={openCreate}>+ New Task</Button>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <input
          placeholder="🔍 Search tasks..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          style={{ ...styles.filterInput, flex: '1 1 200px' }}
        />
        <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} style={styles.filterInput}>
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select value={filters.priority} onChange={(e) => handleFilterChange('priority', e.target.value)} style={styles.filterInput}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Task list */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}><Spinner fullPage={false} /></div>
      ) : tasks.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✦</div>
          <p>No tasks found. <button style={styles.linkBtn} onClick={openCreate}>Create one!</button></p>
        </div>
      ) : (
        <div style={styles.taskGrid}>
          {tasks.map((task) => (
            <div key={task._id} style={styles.taskCard}>
              <div style={styles.cardTop}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ ...styles.badge, borderColor: STATUS_COLOR[task.status], color: STATUS_COLOR[task.status] }}>
                    {task.status}
                  </span>
                  <span style={{ ...styles.badge, borderColor: PRIORITY_COLOR[task.priority], color: PRIORITY_COLOR[task.priority] }}>
                    {task.priority}
                  </span>
                </div>
                <div style={styles.cardActions}>
                  <button style={styles.iconBtn} onClick={() => openEdit(task)} title="Edit">✎</button>
                  <button
                    style={{ ...styles.iconBtn, color: 'var(--danger)' }}
                    onClick={() => handleDelete(task._id)}
                    disabled={deleting === task._id}
                    title="Delete"
                  >
                    {deleting === task._id ? '...' : '✕'}
                  </button>
                </div>
              </div>

              <h3 style={styles.cardTitle}>{task.title}</h3>
              {task.description && <p style={styles.cardDesc}>{task.description}</p>}

              <div style={styles.cardFooter}>
                {task.dueDate && (
                  <span style={styles.dueDate}>
                    📅 {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
                {isAdmin && task.owner && (
                  <span style={styles.owner}>👤 {task.owner.name || task.owner.email}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={styles.pagination}>
          <Button variant="ghost" size="sm"
            disabled={filters.page <= 1}
            onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>
            ← Prev
          </Button>
          <span style={styles.pageInfo}>Page {pagination.page} of {pagination.pages}</span>
          <Button variant="ghost" size="sm"
            disabled={filters.page >= pagination.pages}
            onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>
            Next →
          </Button>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={styles.overlay} onClick={() => setModal(null)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{modal === 'create' ? '+ New Task' : '✎ Edit Task'}</h2>
              <button style={styles.closeBtn} onClick={() => setModal(null)}>✕</button>
            </div>

            <div style={styles.modalForm}>
              <div style={styles.field}>
                <label style={styles.label}>Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Task title"
                  style={formErrors.title ? { borderColor: 'var(--danger)' } : {}}
                />
                {formErrors.title && <span style={styles.error}>{formErrors.title}</span>}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description..."
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={styles.row}>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label}>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label}>Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Due Date</label>
                <input type="date" value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
              <Button onClick={handleSave} loading={saving}>
                {modal === 'create' ? 'Create Task' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' },
  title: { fontSize: '2rem', marginBottom: '0.25rem' },
  subtitle: { color: 'var(--text2)' },
  filters: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  filterInput: { padding: '0.6rem 0.9rem', flex: '0 0 auto', minWidth: 130 },
  taskGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' },
  taskCard: {
    background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
    padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem',
    transition: 'border-color 0.2s, transform 0.2s',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardActions: { display: 'flex', gap: '0.25rem' },
  iconBtn: {
    background: 'none', border: 'none', color: 'var(--text2)',
    fontSize: '1rem', padding: '0.25rem 0.4rem', borderRadius: 4,
    cursor: 'pointer', transition: 'color 0.2s',
  },
  cardTitle: { fontSize: '1rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 },
  cardDesc: { fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.5, flex: 1 },
  cardFooter: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem' },
  dueDate: { fontSize: '0.75rem', color: 'var(--text2)' },
  owner: { fontSize: '0.75rem', color: 'var(--text3)' },
  badge: { fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem', border: '1px solid', borderRadius: 4, textTransform: 'capitalize' },
  empty: {
    background: 'var(--bg2)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)',
    padding: '3rem', textAlign: 'center', color: 'var(--text2)',
  },
  linkBtn: { background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' },
  pageInfo: { fontSize: '0.85rem', color: 'var(--text2)' },
  // Modal
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)',
  },
  modalBox: {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 16, width: '100%', maxWidth: 520,
    boxShadow: 'var(--shadow-lg)', animation: 'fadeIn 0.25s ease',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)',
  },
  modalTitle: { fontSize: '1.2rem' },
  closeBtn: { background: 'none', border: 'none', color: 'var(--text2)', fontSize: '1.1rem', cursor: 'pointer' },
  modalForm: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  row: { display: 'flex', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.82rem', fontWeight: 600, color: 'var(--text2)' },
  error: { fontSize: '0.75rem', color: 'var(--danger)' },
  modalFooter: {
    display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
    padding: '1rem 1.5rem', borderTop: '1px solid var(--border)',
  },
};