'use client';
import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../lib/api';

export default function WritingAnalytics({ bookId, wordCountGoal }) {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookId) loadAnalytics();
  }, [bookId]);

  const loadAnalytics = async () => {
    try {
      const { data } = await analyticsAPI.getBook(bookId);
      setStats(data.stats);
      setChartData(data.chartData || []);
    } catch {}
    finally { setLoading(false); }
  };

  if (loading) return <div style={{ padding: 20, color: '#7a6e62', fontSize: 13 }}>Loading analytics…</div>;
  if (!stats) return <div style={{ padding: 20, color: '#7a6e62', fontSize: 13 }}>No data yet — start writing!</div>;

  const maxWords = Math.max(...chartData.map(d => d.words), 1);
  const last7 = chartData.slice(-7);

  return (
    <div style={s.root}>
      <div style={s.title}>Writing Analytics</div>

      {/* Stats Grid */}
      <div style={s.statsGrid}>
        {[
          { icon: '📝', label: 'Total Words', value: stats.totalWords?.toLocaleString() || '0' },
          { icon: '📚', label: 'Chapters', value: stats.totalChapters || '0' },
          { icon: '📄', label: 'Pages', value: stats.totalPages || '0' },
          { icon: '🔥', label: 'Day Streak', value: `${stats.writingStreak || 0} days` },
          { icon: '🤖', label: 'AI Used', value: stats.totalAIUsage || '0' },
          { icon: '⏱', label: 'Read Time', value: `${stats.estimatedReadingMinutes || 0} min` },
        ].map(({ icon, label, value }) => (
          <div key={label} style={s.statCard}>
            <div style={s.statIcon}>{icon}</div>
            <div style={s.statVal}>{value}</div>
            <div style={s.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      {/* Goal Progress */}
      {wordCountGoal > 0 && (
        <div style={s.goalSection}>
          <div style={s.goalHeader}>
            <span style={s.goalLabel}>Word Count Goal</span>
            <span style={s.goalNumbers}>{stats.totalWords?.toLocaleString()} / {wordCountGoal?.toLocaleString()}</span>
          </div>
          <div style={s.progressBar}>
            <div style={{ ...s.progressFill, width: `${Math.min(stats.goalProgress || 0, 100)}%` }} />
          </div>
          <div style={s.goalPercent}>{stats.goalProgress || 0}% complete</div>
        </div>
      )}

      {/* Daily chart — last 7 days */}
      <div style={s.chartSection}>
        <div style={s.chartTitle}>Last 7 Days</div>
        <div style={s.chart}>
          {last7.map((d, i) => {
            const height = maxWords > 0 ? Math.max((d.words / maxWords) * 100, d.words > 0 ? 8 : 2) : 2;
            const day = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
            return (
              <div key={i} style={s.barCol}>
                <div style={s.barWrap}>
                  <div style={{ ...s.bar, height: `${height}%`, background: d.words > 0 ? '#d4860a' : '#e0d8ca' }} title={`${d.words} words`} />
                </div>
                <div style={s.barLabel}>{day}</div>
                {d.words > 0 && <div style={s.barWords}>{d.words > 999 ? `${(d.words/1000).toFixed(1)}k` : d.words}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Streak display */}
      {stats.writingStreak > 0 && (
        <div style={s.streakBanner}>
          <span style={{ fontSize: 20 }}>🔥</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1612' }}>{stats.writingStreak}-day writing streak!</div>
            <div style={{ fontSize: 11, color: '#7a6e62' }}>Keep it up — consistency builds great books</div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  root: { padding: '16px', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: 16 },
  title: { fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#1a1612' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 },
  statCard: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 9, padding: '12px 10px', textAlign: 'center' },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statVal: { fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: '#1a1612' },
  statLabel: { fontSize: 10, color: '#7a6e62', marginTop: 2 },
  goalSection: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 9, padding: '14px' },
  goalHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  goalLabel: { fontSize: 12, fontWeight: 600, color: '#3d342b' },
  goalNumbers: { fontSize: 12, color: '#7a6e62' },
  progressBar: { background: '#f0ebe0', borderRadius: 6, height: 10, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #d4860a, #f5d98a)', borderRadius: 6, transition: 'width 0.6s ease' },
  goalPercent: { fontSize: 11, color: '#7a6e62', marginTop: 5, textAlign: 'right' },
  chartSection: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 9, padding: '14px' },
  chartTitle: { fontSize: 11, fontWeight: 600, color: '#7a6e62', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 12 },
  chart: { display: 'flex', gap: 4, alignItems: 'flex-end', height: 80 },
  barCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%' },
  barWrap: { flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' },
  bar: { width: '100%', borderRadius: '3px 3px 0 0', transition: 'height 0.4s ease', minHeight: 2 },
  barLabel: { fontSize: 9, color: '#7a6e62', textAlign: 'center' },
  barWords: { fontSize: 8, color: '#d4860a', fontWeight: 600 },
  streakBanner: { background: 'linear-gradient(135deg, #fdf3dc, #faf7f2)', border: '1px solid #f5d98a', borderRadius: 9, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 },
};
