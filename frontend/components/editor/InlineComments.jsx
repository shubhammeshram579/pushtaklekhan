'use client';
import { useState, useEffect, useRef } from 'react';

let commentIdCounter = 1;

export default function InlineComments({ editorRef, enabled }) {
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState(null); // { x, y, selectedText, range }
  const [draftText, setDraftText] = useState('');
  const [activeComment, setActiveComment] = useState(null);
  const inputRef = useRef(null);

  // Listen for text selection in editor
  useEffect(() => {
    if (!enabled) return;
    const handler = (e) => {
      // Don't trigger if clicking on comment UI
      if (e.target.closest('[data-comment-ui]')) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setDraft(null);
        return;
      }
      const range = sel.getRangeAt(0);
      // Only trigger if selection is inside editor
      if (!editorRef.current?.contains(range.commonAncestorContainer)) {
        setDraft(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      setDraft({
        x: rect.right + 8,
        y: rect.top,
        selectedText: sel.toString().trim(),
        range: range.cloneRange(),
      });
      setDraftText('');
    };
    document.addEventListener('mouseup', handler);
    return () => document.removeEventListener('mouseup', handler);
  }, [enabled, editorRef]);

  const addComment = () => {
    if (!draftText.trim() || !draft) return;
    const id = commentIdCounter++;

    // Wrap selected text with highlight span
    try {
      const span = document.createElement('span');
      span.dataset.commentId = id;
      span.style.cssText = 'background:#fdf3dc;border-bottom:2px solid #d4860a;cursor:pointer;';
      span.title = 'Click to view comment';
      span.onclick = () => setActiveComment(id);
      draft.range.surroundContents(span);
    } catch {
      // surroundContents fails for cross-node selections — just store without highlight
    }

    setComments(prev => [...prev, {
      id,
      text: draftText.trim(),
      selectedText: draft.selectedText,
      x: draft.x,
      y: draft.y,
      resolved: false,
      createdAt: new Date(),
    }]);
    setDraft(null);
    setDraftText('');
  };

  const resolveComment = (id) => {
    // Remove highlight span
    const span = editorRef.current?.querySelector(`[data-comment-id="${id}"]`);
    if (span) {
      const parent = span.parentNode;
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
    }
    setComments(prev => prev.map(c => c._id === id || c.id === id ? { ...c, resolved: true } : c));
    setActiveComment(null);
  };

  const deleteComment = (id) => {
    const span = editorRef.current?.querySelector(`[data-comment-id="${id}"]`);
    if (span) {
      const parent = span.parentNode;
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
    }
    setComments(prev => prev.filter(c => c.id !== id));
    setActiveComment(null);
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  if (!enabled) return null;

  return (
    <>
      {/* Draft comment bubble */}
      {draft && (
        <div data-comment-ui="true" style={{
          position: 'fixed', left: Math.min(draft.x, window.innerWidth - 260), top: draft.y,
          background: '#fff', border: '1px solid #e0d8ca', borderRadius: 10,
          boxShadow: '0 4px 20px rgba(26,22,18,0.14)', zIndex: 9000,
          width: 240, padding: '12px',
        }}>
          <div style={s.draftLabel}>Add comment</div>
          <div style={s.selectedPreview}>"{draft.selectedText.slice(0, 60)}{draft.selectedText.length > 60 ? '…' : ''}"</div>
          <textarea
            ref={inputRef}
            style={s.commentInput}
            placeholder="Write a comment…"
            value={draftText}
            onChange={e => setDraftText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) addComment(); if (e.key === 'Escape') setDraft(null); }}
            autoFocus
            rows={3}
          />
          <div style={s.draftActions}>
            <button style={s.cancelBtn} onClick={() => setDraft(null)}>Cancel</button>
            <button style={s.addBtn} onClick={addComment} disabled={!draftText.trim()}>Add</button>
          </div>
        </div>
      )}

      {/* Comment sidebar panel */}
      <div style={s.sidebar}>
        <div style={s.sidebarTitle}>
          Comments
          <span style={s.count}>{comments.filter(c => !c.resolved).length}</span>
        </div>

        {comments.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
            <div style={{ fontSize: 13, color: '#3d342b', fontFamily: 'Playfair Display, serif' }}>No comments yet</div>
            <div style={{ fontSize: 11, color: '#7a6e62', marginTop: 4 }}>Select text to add a comment</div>
          </div>
        ) : (
          <div style={s.commentList}>
            {comments.map(c => (
              <div key={c.id}
                style={{ ...s.commentCard, ...(c.resolved ? s.resolved : {}), ...(activeComment === c.id ? s.activeCard : {}) }}
                onClick={() => setActiveComment(activeComment === c.id ? null : c.id)}
              >
                <div style={s.commentQuote}>"{c.selectedText.slice(0, 50)}{c.selectedText.length > 50 ? '…' : ''}"</div>
                <div style={s.commentText}>{c.text}</div>
                <div style={s.commentMeta}>
                  {formatTime(c.createdAt)}
                  {c.resolved && <span style={s.resolvedBadge}>Resolved</span>}
                </div>
                {activeComment === c.id && !c.resolved && (
                  <div style={s.commentActions}>
                    <button style={s.resolveBtn} onClick={e => { e.stopPropagation(); resolveComment(c.id); }}>✓ Resolve</button>
                    <button style={s.deleteBtn} onClick={e => { e.stopPropagation(); deleteComment(c.id); }}>✕</button>
                  </div>
                )}
                {activeComment === c.id && c.resolved && (
                  <div style={s.commentActions}>
                    <button style={s.deleteBtn} onClick={e => { e.stopPropagation(); deleteComment(c.id); }}>Remove</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

const s = {
  draftLabel: { fontSize: 11, fontWeight: 600, color: '#7a6e62', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 },
  selectedPreview: { fontSize: 11, color: '#b8720a', fontStyle: 'italic', background: '#fdf3dc', padding: '4px 8px', borderRadius: 5, marginBottom: 8, lineHeight: 1.4 },
  commentInput: { width: '100%', border: '1px solid #e0d8ca', borderRadius: 7, padding: '7px 10px', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#1a1612', outline: 'none', resize: 'none', marginBottom: 8 },
  draftActions: { display: 'flex', gap: 6, justifyContent: 'flex-end' },
  cancelBtn: { background: 'transparent', border: '1px solid #e0d8ca', color: '#7a6e62', padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  addBtn: { background: '#1a1612', color: '#faf7f2', border: 'none', padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  sidebar: { width: 220, background: '#faf7f2', borderLeft: '1px solid #e0d8ca', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' },
  sidebarTitle: { padding: '12px 14px 8px', fontSize: 11, fontWeight: 700, color: '#7a6e62', letterSpacing: '0.8px', textTransform: 'uppercase', borderBottom: '1px solid #e0d8ca', display: 'flex', alignItems: 'center', gap: 8 },
  count: { background: '#d4860a', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8 },
  empty: { padding: '24px 14px', textAlign: 'center' },
  commentList: { padding: '8px', display: 'flex', flexDirection: 'column', gap: 6 },
  commentCard: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 8, padding: '10px 11px', cursor: 'pointer', transition: 'all 0.15s' },
  activeCard: { borderColor: '#d4860a', background: '#fdfaf4' },
  resolved: { opacity: 0.5 },
  commentQuote: { fontSize: 10, color: '#b8720a', fontStyle: 'italic', background: '#fdf3dc', padding: '3px 7px', borderRadius: 4, marginBottom: 6, lineHeight: 1.4 },
  commentText: { fontSize: 12, color: '#1a1612', lineHeight: 1.5, marginBottom: 5 },
  commentMeta: { fontSize: 10, color: '#7a6e62', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  resolvedBadge: { background: '#e1f5ee', color: '#0f6e56', fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 6 },
  commentActions: { display: 'flex', gap: 6, marginTop: 8 },
  resolveBtn: { flex: 1, background: '#0f6e56', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  deleteBtn: { background: 'transparent', border: '1px solid #e0d8ca', color: '#7a6e62', padding: '4px 8px', borderRadius: 5, fontSize: 10, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
};
