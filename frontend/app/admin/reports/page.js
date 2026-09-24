'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../../lib/api';
import AdminGuard from '../../../components/admin/AdminGuard';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { id: 'pending', label: 'Pending' },
  { id: 'reviewed', label: 'Reviewed' },
  { id: 'dismissed', label: 'Dismissed' },
  { id: 'actioned', label: 'Actioned' },
  { id: 'all', label: 'All' },
];

const REASON_LABELS = {
  spam: '🚫 Spam',
  harassment: '⚠️ Harassment',
  copyright: '©️ Copyright',
  inappropriate: '🔞 Inappropriate',
  other: '❓ Other',
};

function ReportsContent() {
  const [reports, setReports] = useState([]);
  const [statusTab, setStatusTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => { load(); }, [statusTab]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getReports(statusTab);
      setReports(data.reports);
    } catch {} finally { setLoading(false); }
  };

  const handleReview = async (id, status) => {
    try {
      await adminAPI.reviewReport(id, { status, adminNote: note });
      toast.success(`Report marked as ${status}`);
      setReviewing(null); setNote('');
      load();
    } catch { toast.error('Failed to update report'); }
  };

  return (
    <div>
      <div style={s.pageHeader}>
        <h1 style={s.title}>Content Reports</h1>
        <p style={s.sub}>Moderation queue — ready for when community features ship</p>
      </div>

      <div style={s.tabs}>
        {STATUS_TABS.map(t => (
          <button key={t.id} style={{ ...s.tab, ...(statusTab === t.id ? s.tabActive : {}) }}
            onClick={() => setStatusTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={s.loading}>Loading reports…</div>
      ) : reports.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🚩</div>
          <div style={s.emptyTitle}>
            {statusTab === 'pending' ? 'No pending reports' : 'Nothing here'}
          </div>
          <div style={s.emptySub}>
            Inkwell doesn't have public or shared content yet, so there's nothing to report.
            This queue is wired up and ready — as soon as you add features like public book
            previews or shared chapters, a "Report" button anywhere in the app can call
            <code style={s.code}> POST /api/admin/reports</code> and items will appear here
            automatically.
          </div>
        </div>
      ) : (
        <div style={s.list}>
          {reports.map(r => (
            <div key={r._id} style={s.reportCard}>
              <div style={s.reportTop}>
                <span style={s.reasonBadge}>{REASON_LABELS[r.reason] || r.reason}</span>
                <span style={s.reportDate}>{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={s.reportMeta}>
                Reported by {r.reporterId?.name || 'Unknown'} ({r.reporterId?.email}) · Target: {r.targetType}
              </div>
              {r.details && <div style={s.reportDetails}>"{r.details}"</div>}

              {statusTab === 'pending' && (
                reviewing === r._id ? (
                  <div style={s.reviewBox}>
                    <input style={s.noteInput} placeholder="Admin note (optional)…" value={note}
                      onChange={e => setNote(e.target.value)} />
                    <div style={s.reviewActions}>
                      <button style={s.dismissBtn} onClick={() => handleReview(r._id, 'dismissed')}>Dismiss</button>
                      <button style={s.actionBtn} onClick={() => handleReview(r._id, 'actioned')}>Take Action</button>
                      <button style={s.cancelBtn} onClick={() => { setReviewing(null); setNote(''); }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button style={s.reviewBtn} onClick={() => setReviewing(r._id)}>Review</button>
                )
              )}
              {r.status !== 'pending' && (
                <div style={s.statusFooter}>
                  Status: <strong>{r.status}</strong>
                  {r.adminNote && ` — "${r.adminNote}"`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminReportsPage() {
  return <AdminGuard><ReportsContent /></AdminGuard>;
}

const s = {
  loading: { padding: 60, textAlign: 'center', color: '#7a6e62' },
  pageHeader: { marginBottom: 20 },
  title: { fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#1a1612' },
  sub: { fontSize: 13, color: '#7a6e62', marginTop: 4 },
  tabs: { display: 'flex', gap: 4, background: '#f0ebe0', borderRadius: 9, padding: 4, marginBottom: 20, width: 'fit-content' },
  tab: { background: 'transparent', border: 'none', padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: '#7a6e62' },
  tabActive: { background: '#fff', color: '#1a1612', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  empty: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 14, padding: '48px 40px', textAlign: 'center', maxWidth: 560 },
  emptyTitle: { fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: '#1a1612', marginBottom: 10 },
  emptySub: { fontSize: 13, color: '#7a6e62', lineHeight: 1.7 },
  code: { background: '#f0ebe0', padding: '1px 6px', borderRadius: 4, fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#3d342b' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  reportCard: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 12, padding: '16px 18px' },
  reportTop: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  reasonBadge: { fontSize: 12, fontWeight: 600, color: '#993c1d', background: '#faece7', padding: '2px 10px', borderRadius: 8 },
  reportDate: { fontSize: 11, color: '#7a6e62' },
  reportMeta: { fontSize: 12, color: '#3d342b', marginBottom: 6 },
  reportDetails: { fontSize: 12, color: '#7a6e62', fontStyle: 'italic', background: '#faf7f2', padding: '8px 12px', borderRadius: 7, marginBottom: 10 },
  reviewBtn: { background: 'transparent', border: '1px solid #e0d8ca', color: '#3d342b', padding: '6px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  reviewBox: { marginTop: 8 },
  noteInput: { width: '100%', padding: '7px 10px', border: '1px solid #e0d8ca', borderRadius: 7, fontSize: 12, fontFamily: 'DM Sans, sans-serif', outline: 'none', marginBottom: 8 },
  reviewActions: { display: 'flex', gap: 6 },
  dismissBtn: { background: 'transparent', border: '1px solid #e0d8ca', color: '#7a6e62', padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  actionBtn: { background: '#993c1d', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  cancelBtn: { background: 'transparent', border: 'none', color: '#7a6e62', padding: '6px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  statusFooter: { fontSize: 11, color: '#7a6e62', marginTop: 6, textTransform: 'capitalize' },
};
