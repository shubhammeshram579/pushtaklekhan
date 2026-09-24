'use client';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { creditsAPI } from '../../lib/api';
import { setCredits } from '../../store';

/**
 * Compact credit balance pill. Drop this into your header (dashboard) or
 * the book editor header. Clicking it goes to /billing.
 *
 * Usage:
 *   import CreditBalance from '../../components/subscription/CreditBalance';
 *   <CreditBalance />
 */
export default function CreditBalance({ dark = true }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { credits, plan } = useSelector(s => s.subscription);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const load = async () => {
    try {
      const { data } = await creditsAPI.getBalance();
      dispatch(setCredits(data.credits));
    } catch {}
    finally { setLoading(false); }
  };

  if (loading) return null;

  const pct = credits.total > 0 ? (credits.remaining / credits.total) * 100 : 0;
  const low = pct <= 15;
  const empty = credits.remaining <= 0;

  const colors = dark
    ? { bg: 'rgba(250,247,242,0.08)', border: 'rgba(250,247,242,0.15)', text: '#faf7f2', sub: 'rgba(250,247,242,0.5)' }
    : { bg: '#fff', border: '#e0d8ca', text: '#1a1612', sub: '#7a6e62' };

  return (
    <button
      onClick={() => router.push('/billing')}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: colors.bg, border: `1px solid ${empty ? '#993c1d' : low ? '#d4860a' : colors.border}`,
        borderRadius: 8, padding: '2px 2px', cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif',
      }}
      title="View billing & usage"
    >
      <span style={{ fontSize: 13 }}>⚡</span>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: empty ? '#f0b9a8' : low ? '#f5d98a' : colors.text, lineHeight: 1.1 }}>
          {credits.remaining.toLocaleString()} <span style={{ fontWeight: 400, color: colors.sub }}>/ {credits.total.toLocaleString()}</span>
        </div>
        <div style={{ fontSize: 9, color: colors.sub, textTransform: 'capitalize' }}>{plan} plan</div>
      </div>
      {/* Mini progress ring */}
      <div style={{ width: 26, height: 26, position: 'relative', flexShrink: 0 }}>
        <svg width="26" height="26" viewBox="0 0 26 26">
          <circle cx="13" cy="13" r="10" fill="none" stroke={colors.border} strokeWidth="3" />
          <circle
            cx="13" cy="13" r="10" fill="none"
            stroke={empty ? '#993c1d' : low ? '#d4860a' : '#0f6e56'}
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 10}`}
            strokeDashoffset={`${2 * Math.PI * 10 * (1 - pct / 100)}`}
            strokeLinecap="round"
            transform="rotate(-90 13 13)"
          />
        </svg>
      </div>
    </button>
  );
}
