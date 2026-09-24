'use client';
import { useState, useEffect } from 'react';
import { versionsAPI } from '../../lib/api';

// Simple word-level diff
function diffWords(oldText, newText) {
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);
  const result = [];

  // LCS-based diff (simplified)
  let i = 0, j = 0;
  while (i < oldWords.length || j < newWords.length) {
    if (i >= oldWords.length) {
      result.push({ type: 'added', text: newWords[j++] });
    } else if (j >= newWords.length) {
      result.push({ type: 'removed', text: oldWords[i++] });
    } else if (oldWords[i] === newWords[j]) {
      result.push({ type: 'same', text: oldWords[i] });
      i++; j++;
    } else {
      // Look ahead for match
      const lookahead = 3;
      let foundInNew = -1, foundInOld = -1;
      for (let k = 1; k <= lookahead; k++) {
        if (j + k < newWords.length && oldWords[i] === newWords[j + k]) { foundInNew = k; break; }
      }
      for (let k = 1; k <= lookahead; k++) {
        if (i + k < oldWords.length && oldWords[i + k] === newWords[j]) { foundInOld = k; break; }
      }
      if (foundInNew !== -1 && (foundInOld === -1 || foundInNew <= foundInOld)) {
        for (let k = 0; k < foundInNew; k++) result.push({ type: 'added', text: newWords[j++] });
      } else if (foundInOld !== -1) {
        for (let k = 0; k < foundInOld; k++) result.push({ type: 'removed', text: oldWords[i++] });
      } else {
        result.push({ type: 'removed', text: oldWords[i++] });
        result.push({ type: 'added', text: newWords[j++] });
      }
    }
  }
  return result;
}

function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.innerText || '';
}

export default function VersionDiff({ pageId, onClose, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');
  const [leftContent, setLeftContent] = useState('');
  const [rightContent, setRightContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [diffResult, setDiffResult] = useState([]);

  useEffect(() => {
    if (pageId) loadVersions();
  }, [pageId]);

  const loadVersions = async () => {
    try {
      const { data } = await versionsAPI.list(pageId);
      const vs = data.versions || [];
      setVersions(vs);
      if (vs.length >= 2) {
        setLeftId(vs[1]._id);
        setRightId(vs[0]._id);
      } else if (vs.length === 1) {
        setRightId(vs[0]._id);
      }
    } catch {}
  };

  useEffect(() => {
    if (leftId && rightId) loadDiff();
  }, [leftId, rightId]);

  const loadDiff = async () => {
    setLoading(true);
    try {
      const [l, r] = await Promise.all([
        leftId ? versionsAPI.get(leftId) : Promise.resolve({ data: { version: { content: '' } } }),
        versionsAPI.get(rightId),
      ]);
      const lText = stripHtml(l.data.version?.content || '');
      const rText = stripHtml(r.data.version?.content || '');
      setLeftContent(lText);
      setRightContent(rText);
      setDiffResult(diffWords(lText, rText));
    } catch {}
    finally { setLoading(false); }
  };

  const added   = diffResult.filter(d => d.type === 'added').length;
  const removed = diffResult.filter(d => d.type === 'removed').length;

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.header}>
          <div>
            <div style={s.title}>Compare Versions</div>
            {diffResult.length > 0 && (
              <div style={s.stats}>
                <span style={s.addedBadge}>+{added} added</span>
                <span style={s.removedBadge}>-{removed} removed</span>
              </div>
            )}
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Version selectors */}
        <div style={s.selectors}>
          <div style={s.selectorGroup}>
            <label style={s.selLabel}>Compare (older)</label>
            <select style={s.select} value={leftId} onChange={e => setLeftId(e.target.value)}>
              <option value="">— Current content —</option>
              {versions.map(v => (
                <option key={v._id} value={v._id}>
                  {v.label || `Version ${v.versionNumber}`} · {new Date(v.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
          <div style={s.arrow}>→</div>
          <div style={s.selectorGroup}>
            <label style={s.selLabel}>To (newer)</label>
            <select style={s.select} value={rightId} onChange={e => setRightId(e.target.value)}>
              {versions.map(v => (
                <option key={v._id} value={v._id}>
                  {v.label || `Version ${v.versionNumber}`} · {new Date(v.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Diff view */}
        <div style={s.diffArea}>
          {loading ? (
            <div style={s.loading}>Comparing versions…</div>
          ) : diffResult.length === 0 ? (
            <div style={s.empty}>Select two versions to compare</div>
          ) : (
            <div style={s.diffText}>
              {diffResult.map((chunk, i) => {
                if (chunk.type === 'same') return <span key={i}>{chunk.text}</span>;
                if (chunk.type === 'added') return <span key={i} style={s.added}>{chunk.text}</span>;
                if (chunk.type === 'removed') return <span key={i} style={s.removed}>{chunk.text}</span>;
                return null;
              })}
            </div>
          )}
        </div>

        {/* Legend + actions */}
        <div style={s.footer}>
          <div style={s.legend}>
            <span style={s.legendAdded}>■ Added</span>
            <span style={s.legendRemoved}>■ Removed</span>
          </div>
          {rightId && (
            <button style={s.restoreBtn} onClick={() => { onRestore(rightId); onClose(); }}>
              Restore selected version
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,22,18,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, padding: 20 },
  modal: { background: '#faf7f2', borderRadius: 14, width: '100%', maxWidth: 760, maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { padding: '18px 22px 14px', borderBottom: '1px solid #e0d8ca', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 },
  title: { fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#1a1612' },
  stats: { display: 'flex', gap: 8, marginTop: 5 },
  addedBadge: { background: '#e1f5ee', color: '#0f6e56', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8 },
  removedBadge: { background: '#faece7', color: '#993c1d', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8 },
  closeBtn: { background: 'transparent', border: 'none', color: '#7a6e62', fontSize: 18, cursor: 'pointer', padding: '0 4px' },
  selectors: { padding: '14px 22px', borderBottom: '1px solid #e0d8ca', display: 'flex', alignItems: 'flex-end', gap: 12, flexShrink: 0, background: '#f0ebe0' },
  selectorGroup: { flex: 1 },
  selLabel: { display: 'block', fontSize: 10, fontWeight: 600, color: '#7a6e62', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 },
  select: { width: '100%', padding: '7px 10px', border: '1px solid #e0d8ca', borderRadius: 7, fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#1a1612', background: '#fff', outline: 'none' },
  arrow: { fontSize: 18, color: '#7a6e62', paddingBottom: 6 },
  diffArea: { flex: 1, overflowY: 'auto', padding: '20px 22px' },
  loading: { color: '#7a6e62', fontSize: 13, textAlign: 'center', padding: 40 },
  empty: { color: '#7a6e62', fontSize: 13, textAlign: 'center', padding: 40, fontStyle: 'italic' },
  diffText: { fontFamily: 'Playfair Display, serif', fontSize: 16, lineHeight: 1.85, color: '#1a1612', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  added: { background: '#c6f0d8', color: '#0a4a28', borderRadius: 2 },
  removed: { background: '#fad0c8', color: '#6b1e10', textDecoration: 'line-through', borderRadius: 2 },
  footer: { padding: '12px 22px', borderTop: '1px solid #e0d8ca', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  legend: { display: 'flex', gap: 14 },
  legendAdded: { fontSize: 12, color: '#0f6e56' },
  legendRemoved: { fontSize: 12, color: '#993c1d' },
  restoreBtn: { background: '#1a1612', color: '#faf7f2', border: 'none', padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
};
