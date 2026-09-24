'use client';
import { useState, useEffect } from 'react';
import { versionsAPI } from '../../lib/api';
import toast from 'react-hot-toast';

export default function VersionHistory({ pageId, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [label, setLabel] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (pageId) loadVersions();
  }, [pageId]);

  const loadVersions = async () => {
    if (!pageId) return;
    setLoading(true);
    try {
      const { data } = await versionsAPI.list(pageId);
      setVersions(data.versions || []);
    } catch {}
    finally { setLoading(false); }
  };

  const saveCheckpoint = async () => {
    if (!content) { toast.error('No content to save'); return; }
    try {
      await versionsAPI.create({ pageId, content, label: label.trim() || undefined });
      setShowSaveModal(false);
      setLabel('');
      await loadVersions();
      toast.success('Checkpoint saved');
    } catch { toast.error('Failed to save version'); }
  };

  const handleRestore = async (versionId) => {
    if (!confirm('Restore this version? Current content will be auto-backed up.')) return;
    try {
      const { data } = await versionsAPI.restore(versionId);
      onRestore?.(data.content);
      await loadVersions();
      toast.success('Version restored');
    } catch { toast.error('Failed to restore'); }
  };

  const handleDelete = async (id) => {
    try {
      await versionsAPI.delete(id);
      setVersions(v => v.filter(x => x._id !== id));
      toast.success('Version deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={s.root}>
      <div style={s.header}>
        <div>
          <div style={s.title}>Version History</div>
          <div style={s.sub}>{versions.length} saved version{versions.length !== 1 ? 's' : ''}</div>
        </div>
        <button style={s.saveBtn} onClick={() => { const ed = document.getElementById('inkwell-editor'); setContent(ed?.innerHTML || ''); setShowSaveModal(true); }}>
          + Checkpoint
        </button>
      </div>

      {loading ? (
        <div style={s.loading}>Loading versions…</div>
      ) : versions.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🕘</div>
          <div style={{ fontSize: 14, color: '#3d342b', fontFamily: 'Playfair Display, serif', marginBottom: 4 }}>No versions yet</div>
          <div style={{ fontSize: 12, color: '#7a6e62' }}>Save a checkpoint to preserve your progress</div>
        </div>
      ) : (
        <div style={s.list}>
          {versions.map((v, i) => (
            <div key={v._id} style={{ ...s.versionCard, ...(i === 0 ? s.latestCard : {}) }}>
              <div style={s.versionLeft}>
                <div style={s.versionIcon}>{v.isAutoSave ? '🔄' : '📌'}</div>
                <div>
                  <div style={s.versionLabel}>{v.label || `Version ${v.versionNumber}`}</div>
                  <div style={s.versionMeta}>{formatDate(v.createdAt)} · {v.wordCount || 0} words</div>
                </div>
              </div>
              <div style={s.versionActions}>
                {i === 0 && <span style={s.latestBadge}>Latest</span>}
                <button style={s.restoreBtn} onClick={() => handleRestore(v._id)}>Restore</button>
                <button style={s.deleteBtn} onClick={() => handleDelete(v._id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSaveModal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowSaveModal(false)}>
          <div style={s.modal}>
            <div style={s.modalTitle}>Save Checkpoint</div>
            <div style={{ fontSize: 12, color: '#7a6e62', marginBottom: 14 }}>Give this version a name to find it easily later.</div>
            <input style={s.input} value={label} onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Before AI rewrite, Final draft…"
              onKeyDown={e => e.key === 'Enter' && saveCheckpoint()} autoFocus />
            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={() => setShowSaveModal(false)}>Cancel</button>
              <button style={s.primaryBtn} onClick={saveCheckpoint}>Save Checkpoint</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  root: { padding: 16, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: '#1a1612' },
  sub: { fontSize: 12, color: '#7a6e62', marginTop: 2 },
  saveBtn: { background: '#1a1612', color: '#faf7f2', border: 'none', padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' },
  loading: { fontSize: 13, color: '#7a6e62', padding: '20px 0', textAlign: 'center' },
  empty: { textAlign: 'center', padding: '30px 20px', flex: 1 },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  versionCard: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 9, padding: '11px 13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  latestCard: { borderColor: '#d4860a', background: '#fdfaf4' },
  versionLeft: { display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  versionIcon: { fontSize: 18, flexShrink: 0 },
  versionLabel: { fontSize: 13, fontWeight: 600, color: '#1a1612', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  versionMeta: { fontSize: 11, color: '#7a6e62', marginTop: 2 },
  versionActions: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 },
  latestBadge: { fontSize: 9, fontWeight: 700, background: '#fdf3dc', color: '#b8720a', border: '1px solid #f5d98a', padding: '1px 6px', borderRadius: 6, textTransform: 'uppercase' },
  restoreBtn: { background: 'transparent', border: '1px solid #e0d8ca', color: '#3d342b', padding: '3px 9px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 },
  deleteBtn: { background: 'transparent', border: 'none', color: '#c0b5a8', fontSize: 12, cursor: 'pointer', padding: '2px 4px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,22,18,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 },
  modal: { background: '#faf7f2', borderRadius: 12, padding: '24px', width: '100%', maxWidth: 380 },
  modalTitle: { fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 700, color: '#1a1612', marginBottom: 8 },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #e0d8ca', borderRadius: 7, fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1a1612', background: '#fff', outline: 'none', marginBottom: 14 },
  modalActions: { display: 'flex', gap: 8, justifyContent: 'flex-end' },
  cancelBtn: { background: 'transparent', border: '1px solid #e0d8ca', color: '#7a6e62', padding: '7px 14px', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  primaryBtn: { background: '#1a1612', color: '#faf7f2', border: 'none', padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
};
