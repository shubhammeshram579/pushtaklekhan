'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { authAPI } from '../../../lib/api';
import { setCredentials } from '../../../store';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      
      const responseData = res.data?.data || res.data;
      const { user } = responseData; // Cookies are assigned automatically in background

      dispatch(setCredentials({ user }));
      toast.success('Welcome back!');

      if (user?.role === "admin") {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}><span style={styles.quill}> ✒ </span> Pushtak<span style={styles.quill}>lekhan</span></div>
        <div style={styles.tagline}>Your AI writing studio</div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.group}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              style={styles.input}
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              style={styles.input}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
          </div>
          <Link href="/auth/forgot-password" style={styles.link2}>forgot-password</Link>

          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p style={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" style={styles.link}>Register</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1a1612 0%, #3d342b 100%)', padding: 20 },
  card: { background: '#faf7f2', borderRadius: 16, padding: '40px 40px', width: '100%', maxWidth: 420 },
  logo: { fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#1a1612', marginBottom: 4 },
  quill:{color: '#c8830a',fontSize: 20},
  tagline: { fontSize: 13, color: '#7a6e62', marginBottom: 28 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  group: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, fontWeight: 500, color: '#7a6e62', letterSpacing: '0.5px' },
  input: { padding: '10px 14px', border: '1px solid #e0d8ca', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1a1612', background: '#fff', outline: 'none' },
  btn: { padding: '11px 20px', background: '#1a1612', color: '#faf7f2', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8, fontFamily: 'DM Sans, sans-serif' },
  footer: { textAlign: 'center', marginTop: 20, fontSize: 13, color: '#7a6e62' },
  link: { color: '#d4860a', textDecoration: 'none', fontWeight: 600 },
  link2: { color: '#d4860a', textDecoration: 'none', fontWeight: 400 ,fontSize:12},
};