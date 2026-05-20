import React from 'react';

export default function Button({
  children, onClick, type = 'button', variant = 'primary',
  size = 'md', loading = false, disabled = false, fullWidth = false, style = {},
}) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.5rem', border: 'none', borderRadius: 'var(--radius-sm)',
    fontFamily: 'inherit', fontWeight: 600, cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s', opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    ...(size === 'sm' ? { padding: '0.4rem 0.85rem', fontSize: '0.8rem' } :
        size === 'lg' ? { padding: '0.85rem 2rem', fontSize: '1rem' } :
        { padding: '0.65rem 1.25rem', fontSize: '0.875rem' }),
  };

  const variants = {
    primary: { background: 'var(--accent)', color: '#fff' },
    secondary: { background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)' },
    danger: { background: 'var(--danger)', color: '#fff' },
    ghost: { background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border)' },
    success: { background: 'var(--success)', color: '#0d0f14' },
  };

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      style={{ ...base, ...variants[variant], ...style }}>
      {loading ? (
        <>
          <span style={{
            width: 14, height: 14, border: '2px solid transparent',
            borderTopColor: 'currentColor', borderRadius: '50%',
            animation: 'spin 0.7s linear infinite', display: 'inline-block',
          }} />
          Loading...
        </>
      ) : children}
    </button>
  );
}