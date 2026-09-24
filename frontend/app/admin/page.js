'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import AdminGuard from '../../components/admin/AdminGuard';

function DashboardContent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const { data: d } = await adminAPI.getDashboard();
      setData(d);
    } catch {}
    finally { setLoading(false); }
  };

  if (loading) return <div style={s.loading}>Loading dashboard…</div>;
  if (!data) return <div style={s.loading}>Failed to load dashboard</div>;

  const { stats, topWriters, topAIFeatures } = data;

  const CARDS = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', accent: '#1a1612' },
    { label: 'New This Week', value: stats.newUsersThisWeek, icon: '✨', accent: '#0f6e56' },
    { label: 'Total Books', value: stats.totalBooks, icon: '📚', accent: '#1a1612' },
    { label: 'Draft Books', value: stats.draftBooks, icon: '📝', accent: '#7a6e62' },
    { label: 'Completed Books', value: stats.completedBooks, icon: '✅', accent: '#0f6e56' },
    { label: 'Published Books', value: stats.publishedBooks, icon: '🚀', accent: '#185fa5' },
    { label: 'AI Requests Today', value: stats.aiRequestsToday, icon: '⚡', accent: '#d4860a' },
    { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: '💳', accent: '#0f6e56' },
    { label: 'Revenue This Month', value: `₹${stats.revenueThisMonth.toLocaleString()}`, icon: '💰', accent: '#d4860a' },
    { label: 'Blocked Users', value: stats.blockedUsers, icon: '🚫', accent: '#993c1d' },
  ];

  return (
    <div>
      <div style={s.pageHeader}>
        <h1 style={s.title}>Admin Dashboard</h1>
        <p style={s.sub}>Platform overview — updated live</p>
      </div>

      {/* Stat cards grid */}
      <div style={s.grid}>
        {CARDS.map(c => (
          <div key={c.label} style={s.card}>
            <div style={{ ...s.cardIcon, background: `${c.accent}12` }}>{c.icon}</div>
            <div style={s.cardValue}>{c.value}</div>
            <div style={s.cardLabel}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={s.twoCol}>
        {/* Top writers */}
        <div style={s.panel}>
          <div style={s.panelTitle}>🏆 Top Writers</div>
          {topWriters.length === 0 ? (
            <div style={s.emptyText}>No writing activity yet</div>
          ) : (
            <div style={s.list}>
              {topWriters.map((w, i) => (
                <div key={i} style={s.listRow}>
                  <div style={s.rankBadge}>#{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={s.rowName}>{w.name}</div>
                    <div style={s.rowSub}>{w.email} · {w.bookCount} book{w.bookCount !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={s.rowValue}>{w.totalWords.toLocaleString()} words</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most used AI feature */}
        <div style={s.panel}>
          <div style={s.panelTitle}>🤖 Most Used AI Features (30d)</div>
          {topAIFeatures.length === 0 ? (
            <div style={s.emptyText}>No AI usage yet</div>
          ) : (
            <div style={s.list}>
              {topAIFeatures.map((f, i) => {
                const maxCount = topAIFeatures[0]?.count || 1;
                const pct = (f.count / maxCount) * 100;
                return (
                  <div key={i} style={s.featureRow}>
                    <div style={s.featureTop}>
                      <span style={s.featureName}>{f._id}</span>
                      <span style={s.featureCount}>{f.count} requests</span>
                    </div>
                    <div style={s.barTrack}>
                      <div style={{ ...s.barFill, width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Book status breakdown */}
      <div style={s.panel}>
        <div style={s.panelTitle}>📖 Book Status Breakdown</div>
        <div style={s.statusGrid}>
          {[
            ['Draft', stats.draftBooks, '#7a6e62'],
            ['In Progress', stats.inProgressBooks, '#d4860a'],
            ['Completed', stats.completedBooks, '#0f6e56'],
            ['Published', stats.publishedBooks, '#185fa5'],
          ].map(([label, val, color]) => (
            <div key={label} style={s.statusItem}>
              <div style={{ ...s.statusDot, background: color }} />
              <span style={s.statusLabel}>{label}</span>
              <span style={s.statusValue}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return <AdminGuard><DashboardContent /></AdminGuard>;
}

const s = {
  loading: { padding: 60, textAlign: 'center', color: '#7a6e62' },
  pageHeader: { marginBottom: 24 },
  title: { fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#1a1612' },
  sub: { fontSize: 13, color: '#7a6e62', marginTop: 4 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 },
  card: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 12, padding: '18px 16px' },
  cardIcon: { width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 12 },
  cardValue: { fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 800, color: '#1a1612', marginBottom: 2 },
  cardLabel: { fontSize: 11, color: '#7a6e62' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  panel: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 14, padding: '20px', marginBottom: 16 },
  panelTitle: { fontSize: 14, fontWeight: 700, color: '#1a1612', marginBottom: 16 },
  emptyText: { fontSize: 13, color: '#7a6e62', textAlign: 'center', padding: '20px 0' },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  listRow: { display: 'flex', alignItems: 'center', gap: 12 },
  rankBadge: { width: 26, height: 26, borderRadius: '50%', background: '#f0ebe0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#3d342b', flexShrink: 0 },
  rowName: { fontSize: 13, fontWeight: 600, color: '#1a1612' },
  rowSub: { fontSize: 11, color: '#7a6e62', marginTop: 1 },
  rowValue: { fontSize: 12, fontWeight: 700, color: '#d4860a', whiteSpace: 'nowrap' },
  featureRow: { display: 'flex', flexDirection: 'column', gap: 5 },
  featureTop: { display: 'flex', justifyContent: 'space-between' },
  featureName: { fontSize: 12, color: '#1a1612', fontWeight: 600, textTransform: 'capitalize' },
  featureCount: { fontSize: 11, color: '#7a6e62' },
  barTrack: { background: '#f0ebe0', borderRadius: 4, height: 6, overflow: 'hidden' },
  barFill: { height: '100%', background: '#d4860a', borderRadius: 4 },
  statusGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  statusItem: { display: 'flex', alignItems: 'center', gap: 8, background: '#faf7f2', borderRadius: 8, padding: '10px 12px' },
  statusDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  statusLabel: { fontSize: 12, color: '#3d342b', flex: 1 },
  statusValue: { fontSize: 14, fontWeight: 700, color: '#1a1612' },
};
