'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../../lib/api';
import AdminGuard from '../../../components/admin/AdminGuard';

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

function StorageContent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { const { data: d } = await adminAPI.getStorage(); setData(d); }
    catch {} finally { setLoading(false); }
  };

  if (loading) return <div style={s.loading}>Loading storage usage…</div>;
  if (!data) return <div style={s.loading}>Failed to load</div>;

  const { total, byUser } = data;
  const maxBytes = Math.max(...byUser.map(u => u.bytes), 1);

  // Cloudinary free tier is 25GB — show a rough usage bar against that
  const freeTierBytes = 25 * 1024 * 1024 * 1024;
  const usagePct = Math.min((total.bytes / freeTierBytes) * 100, 100);

  return (
    <div>
      <div style={s.pageHeader}>
        <h1 style={s.title}>Storage Usage</h1>
        <p style={s.sub}>Image uploads via Cloudinary</p>
      </div>

      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div style={s.statLabel}>Total Storage Used</div>
          <div style={s.statValue}>{formatBytes(total.bytes)}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Total Images</div>
          <div style={s.statValue}>{total.count.toLocaleString()}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Avg. Image Size</div>
          <div style={s.statValue}>{formatBytes(total.count > 0 ? total.bytes / total.count : 0)}</div>
        </div>
      </div>

      {/* Free tier usage bar */}
      <div style={s.panel}>
        <div style={s.panelTop}>
          <div style={s.panelTitle}>Cloudinary free tier usage</div>
          <span style={s.tierLabel}>{formatBytes(total.bytes)} / 25 GB</span>
        </div>
        <div style={s.tierBarTrack}>
          <div style={{ ...s.tierBarFill, width: `${usagePct}%`, background: usagePct > 80 ? '#993c1d' : usagePct > 50 ? '#d4860a' : '#0f6e56' }} />
        </div>
        <div style={s.tierNote}>
          {usagePct > 80
            ? '⚠️ Approaching free tier limit — consider upgrading your Cloudinary plan soon.'
            : 'Comfortably within the free tier.'}
        </div>
      </div>

      {/* By user */}
      <div style={s.panel}>
        <div style={s.panelTitle}>Storage by user (top 15)</div>
        {byUser.length === 0 ? <div style={s.emptyText}>No images uploaded yet</div> : (
          <div style={s.list}>
            {byUser.map((u, i) => {
              const pct = (u.bytes / maxBytes) * 100;
              return (
                <div key={i} style={s.userRow}>
                  <div style={s.userTop}>
                    <span style={s.userName}>{u.name}</span>
                    <span style={s.userMeta}>{formatBytes(u.bytes)} · {u.count} images</span>
                  </div>
                  <div style={s.barTrack}><div style={{ ...s.barFill, width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminStoragePage() {
  return <AdminGuard><StorageContent /></AdminGuard>;
}

const s = {
  loading: { padding: 60, textAlign: 'center', color: '#7a6e62' },
  pageHeader: { marginBottom: 24 },
  title: { fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#1a1612' },
  sub: { fontSize: 13, color: '#7a6e62', marginTop: 4 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 },
  statCard: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 12, padding: '20px' },
  statLabel: { fontSize: 11, fontWeight: 600, color: '#7a6e62', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 },
  statValue: { fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 800, color: '#1a1612' },
  panel: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 14, padding: '22px', marginBottom: 16 },
  panelTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  panelTitle: { fontSize: 14, fontWeight: 700, color: '#1a1612' },
  tierLabel: { fontSize: 12, color: '#7a6e62', fontWeight: 600 },
  tierBarTrack: { background: '#f0ebe0', borderRadius: 6, height: 10, marginBottom: 10, overflow: 'hidden' },
  tierBarFill: { height: '100%', borderRadius: 6, transition: 'width 0.5s' },
  tierNote: { fontSize: 12, color: '#7a6e62' },
  emptyText: { fontSize: 13, color: '#7a6e62', textAlign: 'center', padding: '20px 0' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  userRow: { display: 'flex', flexDirection: 'column', gap: 5 },
  userTop: { display: 'flex', justifyContent: 'space-between' },
  userName: { fontSize: 12, fontWeight: 600, color: '#1a1612' },
  userMeta: { fontSize: 11, color: '#7a6e62' },
  barTrack: { background: '#f0ebe0', borderRadius: 4, height: 6 },
  barFill: { height: '100%', background: '#185fa5', borderRadius: 4 },
};
