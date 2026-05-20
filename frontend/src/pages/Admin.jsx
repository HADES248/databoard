import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import Button from '../components/Button';
import Spinner from '../components/Spinner';

export default function AdminPanel() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.append('search', search);
      const { data } = await api.get(`/users?${params}`);
      setUsers(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setUpdating(user._id);
    try {
      await api.patch(`/users/${user._id}`, { role: newRole });
      toast.success(`${user.name} is now ${newRole}`);
      fetchUsers();
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const toggleActive = async (user) => {
    setUpdating(user._id);
    try {
      await api.patch(`/users/${user._id}`, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.name}? This will also delete all their tasks.`)) return;
    setDeleting(user._id);
    try {
      await api.delete(`/users/${user._id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>◈ Admin Panel</h1>
          <p style={styles.subtitle}>{pagination.total} registered users</p>
        </div>
      </div>

      <div style={styles.toolbar}>
        <input
          placeholder="🔍 Search users by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={styles.searchInput}
        />
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}><Spinner fullPage={false} /></div>
      ) : (
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span>User</span>
            <span>Role</span>
            <span>Status</span>
            <span>Joined</span>
            <span>Actions</span>
          </div>

          {users.length === 0 ? (
            <div style={styles.empty}>No users found</div>
          ) : (
            users.map((user) => (
              <div key={user._id} style={styles.tableRow}>
                <div style={styles.userCell}>
                  <div style={styles.avatar}>{user.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <div style={styles.userName}>{user.name}</div>
                    <div style={styles.userEmail}>{user.email}</div>
                  </div>
                </div>

                <div>
                  <span style={{ ...styles.roleBadge, ...(user.role === 'admin' ? styles.adminRole : styles.userRole) }}>
                    {user.role}
                  </span>
                </div>

                <div>
                  <span style={{ ...styles.statusBadge, ...(user.isActive ? styles.active : styles.inactive) }}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div style={styles.date}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>

                <div style={styles.actions}>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => toggleRole(user)}
                    loading={updating === user._id}
                  >
                    {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                  </Button>
                  <Button
                    size="sm" variant={user.isActive ? 'secondary' : 'success'}
                    onClick={() => toggleActive(user)}
                    loading={updating === user._id}
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm" variant="danger"
                    onClick={() => deleteUser(user)}
                    loading={deleting === user._id}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {pagination.pages > 1 && (
        <div style={styles.pagination}>
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</Button>
          <span style={styles.pageInfo}>Page {pagination.page} of {pagination.pages}</span>
          <Button variant="ghost" size="sm" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next →</Button>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: '2rem', marginBottom: '0.25rem' },
  subtitle: { color: 'var(--text2)' },
  toolbar: { display: 'flex', gap: '0.75rem' },
  searchInput: { flex: 1, maxWidth: 400 },
  table: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' },
  tableHeader: {
    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr',
    padding: '0.75rem 1.25rem', background: 'var(--bg3)',
    fontSize: '0.75rem', fontWeight: 700, color: 'var(--text2)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    borderBottom: '1px solid var(--border)',
    gap: '1rem',
  },
  tableRow: {
    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr',
    padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)',
    alignItems: 'center', gap: '1rem',
    transition: 'background 0.15s',
  },
  userCell: { display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 },
  avatar: {
    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '0.85rem',
  },
  userName: { fontWeight: 600, fontSize: '0.875rem' },
  userEmail: { fontSize: '0.75rem', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  roleBadge: { fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' },
  adminRole: { background: '#6c63ff22', color: 'var(--accent)' },
  userRole: { background: 'var(--bg3)', color: 'var(--text2)' },
  statusBadge: { fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: 4 },
  active: { background: '#00d4aa18', color: 'var(--accent2)' },
  inactive: { background: '#ff4f6a18', color: 'var(--danger)' },
  date: { fontSize: '0.8rem', color: 'var(--text2)' },
  actions: { display: 'flex', gap: '0.35rem', flexWrap: 'wrap' },
  empty: { padding: '2.5rem', textAlign: 'center', color: 'var(--text2)' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' },
  pageInfo: { fontSize: '0.85rem', color: 'var(--text2)' },
};