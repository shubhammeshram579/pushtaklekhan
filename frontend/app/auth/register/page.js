// 'use client';
// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useDispatch } from 'react-redux';
// import { authAPI } from '../../../lib/api';
// import { setCredentials } from '../../../store';
// import toast from 'react-hot-toast';
// import Link from 'next/link';

// export default function RegisterPage() {
//   const [form, setForm] = useState({ name: '', email: '', password: '' });
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();
//   const dispatch = useDispatch();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
//     setLoading(true);
//     try {
//       const { data } = await authAPI.register(form);
//       dispatch(setCredentials({ user: data.user, token: data.token }));
//       toast.success('Account created! Welcome to Inkwell.');
//       router.push('/dashboard');
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Registration failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const s = {
//     page: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1a1612 0%, #3d342b 100%)', padding: 20 },
//     card: { background: '#faf7f2', borderRadius: 16, padding: '40px 40px', width: '100%', maxWidth: 420 },
//     logo: { fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#1a1612', marginBottom: 4 },
//     tagline: { fontSize: 13, color: '#7a6e62', marginBottom: 28 },
//     form: { display: 'flex', flexDirection: 'column', gap: 16 },
//     group: { display: 'flex', flexDirection: 'column', gap: 5 },
//     label: { fontSize: 12, fontWeight: 600, color: '#7a6e62', letterSpacing: '0.5px' },
//     input: { padding: '10px 14px', border: '1px solid #e0d8ca', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1a1612', background: '#fff', outline: 'none' },
//     btn: { padding: '11px 20px', background: '#1a1612', color: '#faf7f2', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8, fontFamily: 'DM Sans, sans-serif' },
//     footer: { textAlign: 'center', marginTop: 20, fontSize: 13, color: '#7a6e62' },
//     link: { color: '#d4860a', textDecoration: 'none', fontWeight: 600 },
//   };

//   return (
//     <div style={s.page}>
//       <div style={s.card}>
//         <div style={s.logo}>✒ Inkwell</div>
//         <div style={s.tagline}>Create your author account</div>
//         <form onSubmit={handleSubmit} style={s.form}>
//           {[
//             { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Shubham Meshram' },
//             { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
//             { key: 'password', label: 'Password', type: 'password', placeholder: '6+ characters' },
//           ].map(field => (
//             <div key={field.key} style={s.group}>
//               <label style={s.label}>{field.label.toUpperCase()}</label>
//               <input type={field.type} required placeholder={field.placeholder} style={s.input}
//                 value={form[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} />
//             </div>
//           ))}
//           <button type="submit" style={s.btn} disabled={loading}>
//             {loading ? 'Creating account…' : 'Create Account'}
//           </button>
//         </form>
//         <p style={s.footer}>
//           Already have an account? <Link href="/auth/login" style={s.link}>Sign In</Link>
//         </p>
//       </div>
//     </div>
//   );
// }




'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      toast.success(res.data?.message || 'OTP sent to your email!');
      // Redirect to OTP verification page with query string
      router.push(`/auth/verify-otp?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const s = {
    page: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1a1612 0%, #3d342b 100%)', padding: 20 },
    card: { background: '#faf7f2', borderRadius: 16, padding: '40px 40px', width: '100%', maxWidth: 420 },
    logo: { fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#1a1612', marginBottom: 4 },
    quill:{color: '#c8830a',fontSize: 20},
    tagline: { fontSize: 13, color: '#7a6e62', marginBottom: 28 },
    form: { display: 'flex', flexDirection: 'column', gap: 16 },
    group: { display: 'flex', flexDirection: 'column', gap: 5 },
    label: { fontSize: 12, fontWeight: 600, color: '#7a6e62', letterSpacing: '0.5px' },
    input: { padding: '10px 14px', border: '1px solid #e0d8ca', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1a1612', background: '#fff', outline: 'none' },
    btn: { padding: '11px 20px', background: '#1a1612', color: '#faf7f2', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8, fontFamily: 'DM Sans, sans-serif' },
    footer: { textAlign: 'center', marginTop: 20, fontSize: 13, color: '#7a6e62' },
    link: { color: '#d4860a', textDecoration: 'none', fontWeight: 600 },
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}><span style={s.quill}> ✒ </span>  Pushtak<span style={s.quill}>lekhan</span></div>
        <div style={s.tagline}>Create your author account</div>
        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.group}>
            <label style={s.label}>FULL NAME</label>
            <input type="text" required placeholder="Shubham Meshram" style={s.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div style={s.group}>
            <label style={s.label}>EMAIL</label>
            <input type="email" required placeholder="you@example.com" style={s.input} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div style={s.group}>
            <label style={s.label}>PASSWORD</label>
            <input type="password" required placeholder="6+ characters" style={s.input} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? 'Sending OTP…' : 'Send Verification Code'}
          </button>
        </form>
        <p style={s.footer}>
          Already have an account? <Link href="/auth/login" style={s.link}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
