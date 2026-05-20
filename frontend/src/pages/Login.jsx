import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/Button';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card} className="fade-in">
        <div style={styles.header}>
          <div style={styles.logo}>⬡</div>
          <h1 style={styles.title}>DataBoard</h1>
          <p style={styles.subtitle}>Sign in to your workspace</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={errors.email ? { ...styles.input, borderColor: 'var(--danger)' } : styles.input}
            />
            {errors.email && <span style={styles.error}>{errors.email}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={errors.password ? { ...styles.input, borderColor: 'var(--danger)' } : styles.input}
            />
            {errors.password && <span style={styles.error}>{errors.password}</span>}
          </div>

          {errors.submit && (
            <div style={styles.alertError}>{errors.submit}</div>
          )}

          <Button type="submit" loading={loading} fullWidth size="lg">
            Sign In
          </Button>
        </form>

        <p style={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register">Create one</Link>
        </p>

        {/* Demo credentials hint */}
        <div style={styles.hint}>
          <strong>Demo:</strong> Register any account, or add <code>role: "admin"</code> via the API for admin access
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'var(--bg)',
    padding: '1rem',
    backgroundImage: 'radial-gradient(ellipse at 60% 20%, #6c63ff12 0%, transparent 60%)',
  },
  card: {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 420,
    boxShadow: 'var(--shadow-lg)',
  },
  header: { textAlign: 'center', marginBottom: '2rem' },
  logo: { fontSize: '2.5rem', color: 'var(--accent)', marginBottom: '0.5rem' },
  title: { fontSize: '2rem', color: 'var(--text)', marginBottom: '0.25rem' },
  subtitle: { color: 'var(--text2)', fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text2)' },
  input: {},
  error: { color: 'var(--danger)', fontSize: '0.78rem' },
  alertError: {
    background: '#ff4f6a18', border: '1px solid var(--danger)',
    borderRadius: 8, padding: '0.75rem 1rem', color: 'var(--danger)', fontSize: '0.85rem',
  },
  footer: { textAlign: 'center', marginTop: '1.5rem', color: 'var(--text2)', fontSize: '0.875rem' },
  hint: {
    marginTop: '1rem', padding: '0.75rem', background: 'var(--accent-dim)',
    borderRadius: 8, fontSize: '0.78rem', color: 'var(--text2)', lineHeight: 1.5,
  },
};