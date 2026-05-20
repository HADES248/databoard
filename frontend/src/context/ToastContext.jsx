import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
    warning: (msg) => addToast(msg, 'warning'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={styles.container}>
        {toasts.map((t) => (
          <div key={t.id} style={{ ...styles.toast, ...styles[t.type] }}>
            <span style={styles.icon}>{icons[t.type]}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

const styles = {
  container: {
    position: 'fixed', bottom: '1.5rem', right: '1.5rem',
    display: 'flex', flexDirection: 'column', gap: '0.5rem',
    zIndex: 9999, maxWidth: '360px',
  },
  toast: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.875rem 1.25rem', borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    fontSize: '0.9rem', fontWeight: 500, color: '#fff',
    animation: 'slideIn 0.3s ease',
  },
  success: { background: 'linear-gradient(135deg, #10b981, #059669)' },
  error: { background: 'linear-gradient(135deg, #ef4444, #dc2626)' },
  info: { background: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
  warning: { background: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  icon: { fontSize: '1rem', fontWeight: 700 },
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};