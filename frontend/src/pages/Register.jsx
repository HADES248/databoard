import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/Button';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      e.password = 'Must include uppercase, lowercase, and a number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome aboard 🎉');
      navigate('/dashboard');
    } catch (err) {
      const apiErrors = err.response?.data?.errors || [];
      if (apiErrors.length > 0) {
        const mapped = {};
        apiErrors.forEach((e) => { mapped[e.field] = e.message; });
        setErrors(mapped);
      } else {
        const msg = err.response?.data?.message || 'Registration failed';
        toast.error(msg);
        setErrors({ submit: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Jane Doe' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'jane@example.com' },
    { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.card} className="fade-in">
        <div style={styles.header}>
          <div style={styles.logo}>⬡</div>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Start managing your tasks today</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {fields.map(({ key, label, type, placeholder }) => (
            <div key={key} style={styles.field}>
              <label style={styles.label}>{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                style={errors[key] ? { borderColor: 'var(--danger)' } : {}}
              />
              {errors[key] && <span style={styles.error}>{errors[key]}</span>}
            </div>
          ))}

          {errors.submit && (
            <div style={styles.alertError}>{errors.submit}</div>
          )}

          <div style={styles.passHint}>
            Password must be 8+ chars with uppercase, lowercase, and a number
          </div>

          <Button type="submit" loading={loading} fullWidth size="lg">
            Create Account
          </Button>
        </form>

        <p style={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'var(--bg)', padding: '1rem',
    backgroundImage: 'radial-gradient(ellipse at 40% 80%, #00d4aa0d 0%, transparent 60%)',
  },
  card: {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 420,
    boxShadow: 'var(--shadow-lg)',
  },
  header: { textAlign: 'center', marginBottom: '2rem' },
  logo: { fontSize: '2.5rem', color: 'var(--accent2)', marginBottom: '0.5rem' },
  title: { fontSize: '1.8rem', color: 'var(--text)', marginBottom: '0.25rem' },
  subtitle: { color: 'var(--text2)', fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text2)' },
  error: { color: 'var(--danger)', fontSize: '0.78rem' },
  alertError: {
    background: '#ff4f6a18', border: '1px solid var(--danger)',
    borderRadius: 8, padding: '0.75rem 1rem', color: 'var(--danger)', fontSize: '0.85rem',
  },
  passHint: {
    fontSize: '0.75rem', color: 'var(--text3)',
    padding: '0.5rem 0.75rem', background: 'var(--bg3)',
    borderRadius: 6, lineHeight: 1.4,
  },
  footer: { textAlign: 'center', marginTop: '1.5rem', color: 'var(--text2)', fontSize: '0.875rem' },
};