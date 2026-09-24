'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../../lib/api';
import AdminGuard from '../../../components/admin/AdminGuard';

function UsageContent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { const { data: d } = await adminAPI.getAIUsage(); setData(d); }
    catch {} finally { setLoading(false); }
  };

  if (loading) return <div style={s.loading}>Loading AI usage…</div>;
  if (!data) return <div style={s.loading}>Failed to load</div>;

  const { daily, byAction, topUsers, totals } = data;
  const maxDay = Math.max(...daily.map(d => d.requests), 1);
  const last14 = daily.slice(-14);

  return (
    <div>
      <div style={s.pageHeader}>
        <h1 style={s.title}>AI Usage Monitoring</h1>
        <p style={s.sub}>Last 30 days · {totals.totalRequests.toLocaleString()} requests · {totals.totalCredits.toLocaleString()} credits spent</p>
      </div>

      {/* Daily chart */}
      <div style={s.panel}>
        <div style={s.panelTitle}>Requests per day (last 14 days)</div>
        <div style={s.chart}>
          {last14.map((d, i) => {
            const h = Math.max((d.requests / maxDay) * 100, d.requests > 0 ? 6 : 2);
            return (
              <div key={i} style={s.barCol}>
                <div style={s.barWrap}><div style={{ ...s.bar, height: `${h}%` }} title={`${d.requests} requests`} /></div>
                <div style={s.barLabel}>{new Date(d.date).toLocaleDateString('en-US', { weekday: 'narrow' })}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={s.twoCol}>
        {/* By action */}
        <div style={s.panel}>
          <div style={s.panelTitle}>Requests by AI action</div>
          <div style={s.list}>
            {byAction.map((a, i) => {
              const pct = (a.requests / (byAction[0]?.requests || 1)) * 100;
              return (
                <div key={i} style={s.actionRow}>
                  <div style={s.actionTop}>
                    <span style={s.actionName}>{a._id}</span>
                    <span style={s.actionCount}>{a.requests} · {a.credits} credits</span>
                  </div>
                  <div style={s.barTrack}><div style={{ ...s.barFill, width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top users */}
        <div style={s.panel}>
          <div style={s.panelTitle}>Heaviest AI users (30d)</div>
          {topUsers.length === 0 ? <div style={s.emptyText}>No usage yet</div> : (
            <div style={s.list}>
              {topUsers.map((u, i) => (
                <div key={i} style={s.userRow}>
                  <div style={s.rankBadge}>#{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={s.userName}>{u.name}</div>
                    <div style={s.userSub}>{u.email} · {u.plan}</div>
                  </div>
                  <div style={s.userCredits}>{u.credits} credits</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminUsagePage() {
  return <AdminGuard><UsageContent /></AdminGuard>;
}

const s = {
  loading: { padding: 60, textAlign: 'center', color: '#7a6e62' },
  pageHeader: { marginBottom: 24 },
  title: { fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#1a1612' },
  sub: { fontSize: 13, color: '#7a6e62', marginTop: 4 },
  panel: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 14, padding: '22px', marginBottom: 16 },
  panelTitle: { fontSize: 14, fontWeight: 700, color: '#1a1612', marginBottom: 18 },
  chart: { display: 'flex', gap: 8, alignItems: 'flex-end', height: 140 },
  barCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' },
  barWrap: { flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' },
  bar: { width: '100%', background: '#d4860a', borderRadius: '4px 4px 0 0', minHeight: 2 },
  barLabel: { fontSize: 10, color: '#7a6e62' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  actionRow: { display: 'flex', flexDirection: 'column', gap: 5 },
  actionTop: { display: 'flex', justifyContent: 'space-between' },
  actionName: { fontSize: 12, fontWeight: 600, color: '#1a1612', textTransform: 'capitalize' },
  actionCount: { fontSize: 11, color: '#7a6e62' },
  barTrack: { background: '#f0ebe0', borderRadius: 4, height: 6 },
  barFill: { height: '100%', background: '#0f6e56', borderRadius: 4 },
  emptyText: { fontSize: 13, color: '#7a6e62', textAlign: 'center', padding: '20px 0' },
  userRow: { display: 'flex', alignItems: 'center', gap: 10 },
  rankBadge: { width: 24, height: 24, borderRadius: '50%', background: '#f0ebe0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#3d342b', flexShrink: 0 },
  userName: { fontSize: 12, fontWeight: 600, color: '#1a1612' },
  userSub: { fontSize: 10, color: '#7a6e62', textTransform: 'capitalize' },
  userCredits: { fontSize: 12, fontWeight: 700, color: '#d4860a', whiteSpace: 'nowrap' },
};
