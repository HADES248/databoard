import React from 'react';

export default function Spinner({ size = 40, fullPage = true }) {
  const spinner = (
    <div style={{
      width: size, height: size, border: `3px solid var(--border)`,
      borderTopColor: 'var(--accent)', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  );

  if (!fullPage) return spinner;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg)',
    }}>
      {spinner}
    </div>
  );
}