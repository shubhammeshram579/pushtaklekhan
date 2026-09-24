'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword({ email });
      toast.success(res.data?.message || 'Password reset OTP sent to your email.');
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>✒ Inkwell</div>
        <div style={styles.tagline}>Reset your password</div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.group}>
            <label style={styles.label}>ENTER YOUR REGISTERED EMAIL</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Sending Code...' : 'Send Reset Code'}
          </button>
        </form>
        <p style={styles.footer}>
          Remembered your password? <Link href="/auth/login" style={styles.link}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1a1612 0%, #3d342b 100%)', padding: 20 },
  card: { background: '#faf7f2', borderRadius: 16, padding: '40px 40px', width: '100%', maxWidth: 420 },
  logo: { fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#1a1612', marginBottom: 4 },
  tagline: { fontSize: 13, color: '#7a6e62', marginBottom: 28 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  group: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, fontWeight: 600, color: '#7a6e62', letterSpacing: '0.5px' },
  input: { padding: '10px 14px', border: '1px solid #e0d8ca', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1a1612', background: '#fff', outline: 'none' },
  btn: { padding: '11px 20px', background: '#1a1612', color: '#faf7f2', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8, fontFamily: 'DM Sans, sans-serif' },
  footer: { textAlign: 'center', marginTop: 20, fontSize: 13, color: '#7a6e62' },
  link: { color: '#d4860a', textDecoration: 'none', fontWeight: 600 },
};