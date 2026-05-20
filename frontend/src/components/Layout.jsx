import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: '⬡', label: 'Dashboard' },
    { to: '/tasks', icon: '✦', label: 'My Tasks' },
    ...(isAdmin ? [{ to: '/admin', icon: '◈', label: 'Admin Panel' }] : []),
  ];

  return (
    <div style={styles.shell}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? 240 : 64 }}>
        <div style={styles.sidebarHeader}>
          {sidebarOpen && (
            <div style={styles.logo}>
              <span style={styles.logoIcon}>⬡</span>
              <span style={styles.logoText}>DataBoard</span>
            </div>
          )}
          <button style={styles.collapseBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        <nav style={styles.nav}>
          {navItems.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
            })}>
              <span style={styles.navIcon}>{icon}</span>
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          {sidebarOpen && (
            <div style={styles.userCard}>
              <div style={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
              <div style={styles.userInfo}>
                <div style={styles.userName}>{user?.name}</div>
                <div style={styles.userRole}>{user?.role}</div>
              </div>
            </div>
          )}
          <button style={styles.logoutBtn} onClick={handleLogout} title="Logout">
            <span>↩</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        <div style={styles.content} className="fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const styles = {
  shell: { display: 'flex', height: '100vh', overflow: 'hidden' },
  sidebar: {
    background: 'var(--bg2)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    transition: 'width 0.25s ease',
    overflow: 'hidden', flexShrink: 0,
  },
  sidebarHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.25rem 1rem', borderBottom: '1px solid var(--border)',
    minHeight: 64,
  },
  logo: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  logoIcon: { fontSize: '1.5rem', color: 'var(--accent)' },
  logoText: { fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' },
  collapseBtn: {
    background: 'none', border: '1px solid var(--border)', color: 'var(--text2)',
    borderRadius: 6, padding: '4px 8px', fontSize: '0.8rem',
    transition: 'all 0.2s',
  },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '1rem 0.75rem' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.7rem 0.75rem', borderRadius: 'var(--radius-sm)',
    color: 'var(--text2)', fontSize: '0.9rem', fontWeight: 500,
    textDecoration: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap',
  },
  navItemActive: { background: 'var(--accent-dim)', color: 'var(--accent)' },
  navIcon: { fontSize: '1rem', flexShrink: 0 },
  sidebarFooter: { padding: '1rem 0.75rem', borderTop: '1px solid var(--border)' },
  userCard: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' },
  avatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '0.9rem', flexShrink: 0,
  },
  userInfo: { overflow: 'hidden' },
  userName: { fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: {
    fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--accent2)',
  },
  logoutBtn: {
    width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
    padding: '0.6rem 0.75rem', background: 'none',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    color: 'var(--text2)', fontSize: '0.85rem', transition: 'all 0.2s',
  },
  main: { flex: 1, overflow: 'auto', background: 'var(--bg)' },
  content: { padding: '2rem', maxWidth: 1200, margin: '0 auto' },
};