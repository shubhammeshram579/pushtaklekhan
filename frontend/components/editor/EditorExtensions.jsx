'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

// ── Smart typography replacements ──
const smartTypography = (e) => {
  const editor = e.currentTarget;
  const sel = window.getSelection();
  if (!sel?.rangeCount) return;
  const range = sel.getRangeAt(0);
  const node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) return;
  const text = node.textContent;
  const pos = range.startOffset;
  const before = text.slice(0, pos);
  const lastChar = before.slice(-1);
  const secondLast = before.slice(-2, -1);

  // em dash: -- → —
  if (lastChar === '-' && secondLast === '-') {
    node.textContent = text.slice(0, pos - 2) + '—' + text.slice(pos);
    const newRange = document.createRange();
    newRange.setStart(node, pos - 1);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
    e.preventDefault();
  }
  // curly quotes handled by browser mostly, but we fix opening/closing
};

// ── Keyboard shortcuts ──
export const handleKeyboardShortcuts = (e, editorEl) => {
  if (!e.ctrlKey && !e.metaKey) return false;
  const shortcuts = {
    'b': () => document.execCommand('bold'),
    'i': () => document.execCommand('italic'),
    'u': () => document.execCommand('underline'),
    '1': () => document.execCommand('formatBlock', false, 'h1'),
    '2': () => document.execCommand('formatBlock', false, 'h2'),
    '3': () => document.execCommand('formatBlock', false, 'h3'),
    '\'': () => document.execCommand('formatBlock', false, 'blockquote'),
    'z': () => document.execCommand(e.shiftKey ? 'redo' : 'undo'),
  };
  const fn = shortcuts[e.key.toLowerCase()];
  if (fn) { e.preventDefault(); fn(); return true; }
  return false;
};

// ── Slash command menu ──
export function SlashMenu({ position, onSelect, onClose }) {
  const COMMANDS = [
    { icon: '📝', label: 'Paragraph', cmd: 'p', desc: 'Normal text' },
    { icon: 'H1', label: 'Heading 1', cmd: 'h1', desc: 'Large heading' },
    { icon: 'H2', label: 'Heading 2', cmd: 'h2', desc: 'Medium heading' },
    { icon: 'H3', label: 'Heading 3', cmd: 'h3', desc: 'Small heading' },
    { icon: '≡', label: 'Bullet List', cmd: 'ul', desc: 'Unordered list' },
    { icon: '⒈', label: 'Numbered List', cmd: 'ol', desc: 'Ordered list' },
    { icon: '"', label: 'Quote', cmd: 'quote', desc: 'Blockquote' },
    { icon: '{ }', label: 'Code', cmd: 'code', desc: 'Code block' },
    { icon: '⊞', label: 'Table', cmd: 'table', desc: '3×3 table' },
    { icon: '—', label: 'Divider', cmd: 'hr', desc: 'Horizontal line' },
  ];

  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(0);
  const filtered = COMMANDS.filter(c => c.label.toLowerCase().includes(filter.toLowerCase()));

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter')     { e.preventDefault(); if (filtered[selected]) onSelect(filtered[selected].cmd); }
      if (e.key === 'Escape')    { onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filtered, selected, onSelect, onClose]);

  if (filtered.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', left: position.x, top: position.y + 24,
      background: '#fff', border: '1px solid #e0d8ca', borderRadius: 10,
      boxShadow: '0 8px 32px rgba(26,22,18,0.15)', zIndex: 9999,
      width: 240, maxHeight: 320, overflowY: 'auto', padding: 4,
    }}>
      <div style={{ padding: '6px 10px 4px', fontSize: 10, fontWeight: 600, color: '#7a6e62', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
        Commands
      </div>
      {filtered.map((cmd, i) => (
        <div key={cmd.cmd}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
            borderRadius: 7, cursor: 'pointer',
            background: i === selected ? '#fdf3dc' : 'transparent',
          }}
          onMouseEnter={() => setSelected(i)}
          onClick={() => onSelect(cmd.cmd)}
        >
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#f0ebe0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#3d342b', flexShrink: 0 }}>
            {cmd.icon}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1612' }}>{cmd.label}</div>
            <div style={{ fontSize: 11, color: '#7a6e62' }}>{cmd.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Floating selection toolbar ──
export function FloatingToolbar({ onFormat }) {
  const [pos, setPos] = useState(null);
  const toolbarRef = useRef(null);

  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setPos(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setPos({ x: rect.left + rect.width / 2, y: rect.top - 44 });
    };
    document.addEventListener('mouseup', handler);
    document.addEventListener('keyup', handler);
    return () => {
      document.removeEventListener('mouseup', handler);
      document.removeEventListener('keyup', handler);
    };
  }, []);

  if (!pos) return null;

  const tools = [
    { label: 'B', cmd: 'bold', style: { fontWeight: 700 } },
    { label: 'I', cmd: 'italic', style: { fontStyle: 'italic' } },
    { label: 'U', cmd: 'underline', style: { textDecoration: 'underline' } },
    { label: 'H1', cmd: 'h1', style: {} },
    { label: 'H2', cmd: 'h2', style: {} },
    { label: '"', cmd: 'quote', style: {} },
    { label: '✨', cmd: 'ai-fix', style: {} },
  ];

  return (
    <div
      ref={toolbarRef}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        transform: 'translateX(-50%)',
        background: '#1a1612',
        borderRadius: 8,
        padding: '4px 6px',
        display: 'flex',
        gap: 2,
        zIndex: 9998,
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      }}
    >
      {tools.map(t => (
        <button
          key={t.cmd}
          style={{
            background: 'transparent', border: 'none',
            color: '#faf7f2', padding: '3px 7px', borderRadius: 5,
            fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            fontWeight: 500, ...t.style,
          }}
          onMouseDown={e => { e.preventDefault(); onFormat(t.cmd); }}
          title={t.cmd}
        >
          {t.label}
        </button>
      ))}
      {/* Arrow tip */}
      <div style={{
        position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '6px solid #1a1612',
      }} />
    </div>
  );
}

// ── Insert table ──
export const insertTable = (rows = 3, cols = 3) => {
  const createCell = (tag) => `<${tag} style="border:1px solid #e0d8ca;padding:8px 12px;min-width:80px;"> </${tag}>`;
  const headerRow = `<tr>${Array(cols).fill(0).map(() => createCell('th')).join('')}</tr>`;
  const bodyRows = Array(rows - 1).fill(0).map(() =>
    `<tr>${Array(cols).fill(0).map(() => createCell('td')).join('')}</tr>`
  ).join('');
  const table = `<table style="border-collapse:collapse;width:100%;margin:16px 0;font-family:DM Sans,sans-serif;font-size:15px;">
    <thead>${headerRow}</thead>
    <tbody>${bodyRows}</tbody>
  </table><p><br></p>`;
  document.execCommand('insertHTML', false, table);
};

// ── Image toolbar (resize + align) ──
export function ImageToolbar({ img, onClose, onChange  }) {
  if (!img) return null;

  const resize = (w) => {
    img.style.width = w;
    img.style.maxWidth = '100%';
    onChange?.();   // ← add this
  };

  const align = (a) => {
    img.style.display = 'block';
    img.style.marginLeft = a === 'center' ? 'auto' : a === 'right' ? 'auto' : '0';
    img.style.marginRight = a === 'center' ? 'auto' : a === 'right' ? '0' : 'auto';
    if (a === 'left') { img.style.float = 'left'; img.style.marginRight = '16px'; img.style.marginLeft = '0'; }
    else if (a === 'right') { img.style.float = 'right'; img.style.marginLeft = '16px'; img.style.marginRight = '0'; }
    else { img.style.float = 'none'; }
     onChange?.();   // ← add this
  };

  const rect = img.getBoundingClientRect();

  return (
    <div style={{
      position: 'fixed',
      left: rect.left + rect.width / 2,
      top: rect.top - 46,
      transform: 'translateX(-50%)',
      background: '#1a1612',
      borderRadius: 8,
      padding: '5px 8px',
      display: 'flex',
      gap: 4,
      zIndex: 9999,
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    }}>
      <span style={{ fontSize: 10, color: 'rgba(250,247,242,0.5)', padding: '3px 6px', alignSelf: 'center' }}>Size:</span>
      {[['25%','¼'],['50%','½'],['75%','¾'],['100%','Full']].map(([w, l]) => (
        <button key={w} style={imgBtnStyle} onMouseDown={e => { e.preventDefault(); resize(w); }}>
          {l}
        </button>
      ))}
      <span style={{ width: 1, background: 'rgba(250,247,242,0.15)', margin: '2px 2px' }} />
      <span style={{ fontSize: 10, color: 'rgba(250,247,242,0.5)', padding: '3px 4px', alignSelf: 'center' }}>Align:</span>
      {[['left','◧'],['center','◫'],['right','◨']].map(([a, l]) => (
        <button key={a} style={imgBtnStyle} onMouseDown={e => { e.preventDefault(); align(a); }}>
          {l}
        </button>
      ))}
      <span style={{ width: 1, background: 'rgba(250,247,242,0.15)', margin: '2px 2px' }} />
      <button style={{ ...imgBtnStyle, color: '#f0b9a8' }} onMouseDown={e => { e.preventDefault(); img.remove(); onChange?.(); onClose(); }}>
        ✕
      </button>
      <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #1a1612' }} />
    </div>
  );
}

const imgBtnStyle = {
  background: 'transparent', border: 'none',
  color: '#faf7f2', padding: '3px 7px', borderRadius: 5,
  fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
};

// ── Typewriter scroll mode ──
export const useTypewriterMode = (editorRef, enabled) => {
  useEffect(() => {
    if (!enabled || !editorRef.current) return;
    const handler = () => {
      const sel = window.getSelection();
      if (!sel?.rangeCount) return;
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const viewH = window.innerHeight;
      const target = viewH * 0.45; // keep cursor at 45% from top
      const scroll = rect.top - target;
      window.scrollBy({ top: scroll, behavior: 'smooth' });
    };
    editorRef.current.addEventListener('keyup', handler);
    return () => editorRef.current?.removeEventListener('keyup', handler);
  }, [enabled, editorRef]);
};

export { smartTypography };
