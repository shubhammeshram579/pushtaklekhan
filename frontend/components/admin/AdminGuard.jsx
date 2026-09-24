'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { authAPI } from '../../lib/api';
import { setUser, logout } from '../../store';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/usage', label: 'AI Usage', icon: '🤖' },
  { href: '/admin/revenue', label: 'Revenue', icon: '💰' },
  { href: '/admin/storage', label: 'Storage', icon: '🗄️' },
  { href: '/admin/reports', label: 'Reports', icon: '🚩' },
];

/**
 * Wraps every /admin/* page. Redirects non-admins to /dashboard.
 * Usage: wrap each admin page's default export content with <AdminGuard>...</AdminGuard>
 */
export default function AdminGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  console.log(user)

  const handleLogout = () => { 
    dispatch(logout()); router.replace('/'); 
  };

  return (
    <div style={s.shell}>
      <aside style={s.sidebar}>
        <div style={s.logo}><span style={s.quill}>✒</span> Pushtak<span style={s.quill}>lekhan</span> </div>
        <nav style={s.nav}>
          {NAV.map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} style={{ ...s.navItem, ...(active ? s.navItemActive : {}) }}>
                <span>{item.icon}</span> {item.label}
              </Link>
            );
          })}
        </nav>
        {/* <Link href="/dashboard" style={s.exitLink}>← Back to app</Link> */}
       <div >  <span style={s.adminTag}>👤 {user?.role} </span > <button style={s.exitLink} onClick={handleLogout}>Sign out</button> </div>
       
       {/* <span style={s.exitLink}>{user?.role}</span> */}
       
       
       
        
      </aside>
      <main style={s.main}>{children}</main>
    </div>
  );
}

const s = {
  loadingPage: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a6e62', fontFamily: 'DM Sans, sans-serif', fontSize: 14 },
  shell: { display: 'flex', minHeight: '100vh', background: '#f5f2ec', fontFamily: 'DM Sans, sans-serif' },
  sidebar: { width: 220, background: '#1a1612', display: 'flex', flexDirection: 'column', flexShrink: 0, padding: '20px 14px', position: 'sticky', top: 0, height: '100vh' },
  logo: { fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: '#faf7f2', marginBottom: 24, padding: '0 8px' },
  quill:{color: '#c8830a'},
  adminTag: { fontSize: 9, fontWeight: 700, color: '#1a1612', background: '#d4860a', padding: '2px 6px', borderRadius: 5, marginLeft: 6, verticalAlign: 'middle', letterSpacing: '0.5px', textTransform: 'uppercase' },
  nav: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, color: 'rgba(250,247,242,0.55)', fontSize: 13, fontWeight: 500, textDecoration: 'none' },
  navItemActive: { background: 'rgba(212,134,10,0.15)', color: '#f5d98a' },
  exitLink: { fontSize: 12, color: 'rgba(250,247,242,0.35)', textDecoration: 'none', padding: '10px 12px', textAlign:"start" },
  main: { flex: 1, padding: '32px 36px', overflowX: 'hidden' },
  logoutBtn: { background: 'transparent', border: '1px solid rgba(250,247,242,0.2)', color: 'rgba(250,247,242,0.6)', padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
};
