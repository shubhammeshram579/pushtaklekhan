'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../../lib/api';
import AdminGuard from '../../../components/admin/AdminGuard';

function RevenueContent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { const { data: d } = await adminAPI.getRevenue(); setData(d); }
    catch {} finally { setLoading(false); }
  };

  if (loading) return <div style={s.loading}>Loading revenue…</div>;
  if (!data) return <div style={s.loading}>Failed to load</div>;

  const { monthly, planDistribution, totalRevenueAllTime, estimatedMRR } = data;
  const maxMonth = Math.max(...monthly.map(m => m.revenue), 1);
  const totalPlanUsers = planDistribution.reduce((s, p) => s + p.count, 0);

  const planColors = { free: '#c0b5a8', pro: '#d4860a', studio: '#0f6e56' };

  return (
    <div>
      <div style={s.pageHeader}>
        <h1 style={s.title}>Revenue</h1>
        <p style={s.sub}>All-time and recurring revenue overview</p>
      </div>

      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div style={s.statLabel}>Estimated MRR</div>
          <div style={s.statValue}>₹{estimatedMRR.toLocaleString()}</div>
          <div style={s.statSub}>Based on current active plans</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Total Revenue (all time)</div>
          <div style={s.statValue}>₹{totalRevenueAllTime.toLocaleString()}</div>
          <div style={s.statSub}>Across all paid invoices</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Paying Subscribers</div>
          <div style={s.statValue}>{planDistribution.filter(p => p._id !== 'free').reduce((s,p)=>s+p.count,0)}</div>
          <div style={s.statSub}>Pro + Studio combined</div>
        </div>
      </div>

      {/* Monthly revenue chart */}
      <div style={s.panel}>
        <div style={s.panelTitle}>Revenue by month (last 90 days)</div>
        {monthly.length === 0 ? <div style={s.emptyText}>No paid invoices yet</div> : (
          <div style={s.chart}>
            {monthly.map((m, i) => {
              const h = Math.max((m.revenue / maxMonth) * 100, m.revenue > 0 ? 8 : 2);
              return (
                <div key={i} style={s.barCol}>
                  <div style={s.barValueLabel}>₹{m.revenue.toLocaleString()}</div>
                  <div style={s.barWrap}><div style={{ ...s.bar, height: `${h}%` }} /></div>
                  <div style={s.barLabel}>{m.month}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Plan distribution */}
      <div style={s.panel}>
        <div style={s.panelTitle}>Plan distribution</div>
        <div style={s.planList}>
          {planDistribution.map(p => {
            const pct = totalPlanUsers > 0 ? Math.round((p.count / totalPlanUsers) * 100) : 0;
            return (
              <div key={p._id} style={s.planRow}>
                <div style={s.planTop}>
                  <span style={s.planName}>
                    <span style={{ ...s.planDot, background: planColors[p._id] || '#7a6e62' }} />
                    {p._id}
                  </span>
                  <span style={s.planCount}>{p.count} users · {pct}%</span>
                </div>
                <div style={s.barTrack}>
                  <div style={{ ...s.barFill, width: `${pct}%`, background: planColors[p._id] || '#7a6e62' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AdminRevenuePage() {
  return <AdminGuard><RevenueContent /></AdminGuard>;
}

const s = {
  loading: { padding: 60, textAlign: 'center', color: '#7a6e62' },
  pageHeader: { marginBottom: 24 },
  title: { fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#1a1612' },
  sub: { fontSize: 13, color: '#7a6e62', marginTop: 4 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 },
  statCard: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 12, padding: '20px' },
  statLabel: { fontSize: 11, fontWeight: 600, color: '#7a6e62', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 },
  statValue: { fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 800, color: '#1a1612', marginBottom: 4 },
  statSub: { fontSize: 11, color: '#7a6e62' },
  panel: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 14, padding: '22px', marginBottom: 16 },
  panelTitle: { fontSize: 14, fontWeight: 700, color: '#1a1612', marginBottom: 18 },
  emptyText: { fontSize: 13, color: '#7a6e62', textAlign: 'center', padding: '20px 0' },
  chart: { display: 'flex', gap: 12, alignItems: 'flex-end', height: 180 },
  barCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' },
  barValueLabel: { fontSize: 10, color: '#d4860a', fontWeight: 700 },
  barWrap: { flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' },
  bar: { width: '100%', background: '#d4860a', borderRadius: '4px 4px 0 0', minHeight: 2 },
  barLabel: { fontSize: 10, color: '#7a6e62' },
  planList: { display: 'flex', flexDirection: 'column', gap: 14 },
  planRow: { display: 'flex', flexDirection: 'column', gap: 6 },
  planTop: { display: 'flex', justifyContent: 'space-between' },
  planName: { fontSize: 13, fontWeight: 600, color: '#1a1612', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 8 },
  planDot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  planCount: { fontSize: 12, color: '#7a6e62' },
  barTrack: { background: '#f0ebe0', borderRadius: 4, height: 8 },
  barFill: { height: '100%', borderRadius: 4 },
};
