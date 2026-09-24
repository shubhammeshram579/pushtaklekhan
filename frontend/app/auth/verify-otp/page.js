'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

function VerifyOtpContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [form, setForm] = useState({ email: emailParam, otp: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.verifyRegistrationOTP(form);
      toast.success(res.data?.message || 'Registration verified successfully!');
      router.push('/auth/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.logo}>✒ Inkwell</div>
      <div style={styles.tagline}>Enter the 6-digit code sent to your email</div>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.group}>
          <label style={styles.label}>EMAIL ADDRESS</label>
          <input
            type="email"
            required
            placeholder="you@example.com"
            style={styles.input}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div style={styles.group}>
          <label style={styles.label}>VERIFICATION CODE (OTP)</label>
          <input
            type="text"
            required
            maxLength={6}
            placeholder="123456"
            style={{ ...styles.input, letterSpacing: '4px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}
            value={form.otp}
            onChange={(e) => setForm((f) => ({ ...f, otp: e.target.value }))}
          />
        </div>
        <button type="submit" style={styles.btn} disabled={loading}>
          {loading ? 'Verifying...' : 'Verify OTP & Register'}
        </button>
      </form>
      <p style={styles.footer}>
        Didn't receive code? <Link href="/auth/register" style={styles.link}>Resend</Link>
      </p>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div style={styles.page}>
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyOtpContent />
      </Suspense>
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