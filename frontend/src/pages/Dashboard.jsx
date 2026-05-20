import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Spinner from '../components/Spinner';
import Button from '../components/Button';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, statsRes] = await Promise.allSettled([
          api.get('/tasks?limit=5&sortBy=createdAt&order=desc'),
          isAdmin ? api.get('/tasks/stats') : Promise.resolve(null),
        ]);
        if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data.data);
        if (statsRes.status === 'fulfilled' && statsRes.value) setStats(statsRes.value.data.data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  const myTasks = tasks || [];
  const todo = myTasks.filter((t) => t.status === 'todo').length;
  const inProgress = myTasks.filter((t) => t.status === 'in-progress').length;
  const done = myTasks.filter((t) => t.status === 'done').length;

  const statusColor = { todo: '#6c63ff', 'in-progress': '#ffb340', done: '#00d4aa' };
  const priorityColor = { low: '#00d4aa', medium: '#ffb340', high: '#ff4f6a' };

  if (loading) return <Spinner fullPage={false} />;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={styles.subtitle}>Here's what's on your plate today</p>
        </div>
        <Link to="/tasks">
          <Button variant="primary">+ New Task</Button>
        </Link>
      </div>

      {/* Quick stats */}
      <div style={styles.statsGrid}>
        {[
          { label: 'To Do', count: todo, color: '#6c63ff', icon: '○' },
          { label: 'In Progress', count: inProgress, color: '#ffb340', icon: '◑' },
          { label: 'Completed', count: done, color: '#00d4aa', icon: '●' },
          { label: 'Total', count: myTasks.length, color: 'var(--text2)', icon: '⬡' },
        ].map(({ label, count, color, icon }) => (
          <div key={label} style={styles.statCard}>
            <div style={{ ...styles.statIcon, color }}>{icon}</div>
            <div style={{ ...styles.statCount, color }}>{count}</div>
            <div style={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      {/* Admin global stats */}
      {isAdmin && stats && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>◈ Platform Overview</h2>
          <div style={styles.adminGrid}>
            <div style={styles.adminStat}>
              <div style={styles.adminCount}>{stats.totalTasks}</div>
              <div style={styles.adminLabel}>Total Tasks</div>
            </div>
            <div style={styles.adminStat}>
              <div style={styles.adminCount}>{stats.totalUsers}</div>
              <div style={styles.adminLabel}>Total Users</div>
            </div>
            {stats.byStatus?.map((s) => (
              <div key={s._id} style={styles.adminStat}>
                <div style={{ ...styles.adminCount, color: statusColor[s._id] }}>{s.count}</div>
                <div style={styles.adminLabel}>{s._id}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent tasks */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>✦ Recent Tasks</h2>
          <Link to="/tasks" style={styles.viewAll}>View all →</Link>
        </div>

        {myTasks.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>✦</div>
            <p>No tasks yet. <Link to="/tasks">Create your first one!</Link></p>
          </div>
        ) : (
          <div style={styles.taskList}>
            {myTasks.map((task) => (
              <div key={task._id} style={styles.taskRow}>
                <div style={{
                  ...styles.statusDot,
                  background: statusColor[task.status] || '#666',
                }} />
                <div style={styles.taskInfo}>
                  <div style={styles.taskTitle}>{task.title}</div>
                  {task.description && (
                    <div style={styles.taskDesc}>{task.description.slice(0, 80)}{task.description.length > 80 ? '…' : ''}</div>
                  )}
                </div>
                <div style={styles.taskMeta}>
                  <span style={{ ...styles.badge, borderColor: priorityColor[task.priority], color: priorityColor[task.priority] }}>
                    {task.priority}
                  </span>
                  <span style={{ ...styles.badge, borderColor: statusColor[task.status], color: statusColor[task.status] }}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: '2rem' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: '2rem', color: 'var(--text)', marginBottom: '0.25rem' },
  subtitle: { color: 'var(--text2)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' },
  statCard: {
    background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
    padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '0.25rem', textAlign: 'center',
  },
  statIcon: { fontSize: '1.25rem' },
  statCount: { fontSize: '2.25rem', fontWeight: 800, fontFamily: 'Syne, sans-serif', lineHeight: 1 },
  statLabel: { fontSize: '0.8rem', color: 'var(--text2)', fontWeight: 500 },
  section: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: '1.1rem', color: 'var(--text)' },
  viewAll: { fontSize: '0.85rem', color: 'var(--accent)' },
  adminGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' },
  adminStat: {
    background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
    padding: '1.25rem', textAlign: 'center',
  },
  adminCount: { fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Syne, sans-serif', color: 'var(--accent)' },
  adminLabel: { fontSize: '0.75rem', color: 'var(--text2)', textTransform: 'capitalize' },
  taskList: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  taskRow: {
    display: 'flex', alignItems: 'center', gap: '1rem',
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '0.875rem 1rem',
    transition: 'border-color 0.2s',
  },
  statusDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  taskInfo: { flex: 1, minWidth: 0 },
  taskTitle: { fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.15rem' },
  taskDesc: { color: 'var(--text2)', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  taskMeta: { display: 'flex', gap: '0.4rem', flexShrink: 0 },
  badge: {
    fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem',
    border: '1px solid', borderRadius: 4, textTransform: 'capitalize',
  },
  empty: {
    background: 'var(--bg2)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)',
    padding: '3rem', textAlign: 'center', color: 'var(--text2)',
  },
  emptyIcon: { fontSize: '2rem', color: 'var(--text3)', marginBottom: '0.75rem' },
};