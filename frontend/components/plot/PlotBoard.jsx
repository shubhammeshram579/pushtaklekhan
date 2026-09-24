'use client';
import { useState } from 'react';

const DEFAULT_COLUMNS = [
  { id: 'ideas',    title: '💡 Ideas',    color: '#fdf3dc', border: '#f5d98a' },
  { id: 'outline',  title: '📋 Outline',  color: '#e1f5ee', border: '#a8dece' },
  { id: 'drafting', title: '✍️ Drafting', color: '#ebe8f5', border: '#c5b9f0' },
  { id: 'editing',  title: '✏️ Editing',  color: '#faece7', border: '#f0b9a8' },
  { id: 'done',     title: '✅ Done',     color: '#e8f5e9', border: '#a5d6a7' },
];

let cardIdCounter = 1;

export default function PlotBoard() {
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [cards, setCards] = useState({
    ideas: [
      { id: cardIdCounter++, text: 'The protagonist discovers a hidden power', priority: 'high' },
      { id: cardIdCounter++, text: 'A mysterious letter arrives from the past', priority: 'medium' },
    ],
    outline: [
      { id: cardIdCounter++, text: 'Chapter 1: The Awakening — establish setting and character', priority: 'high' },
    ],
    drafting: [],
    editing: [],
    done: [],
  });
  const [dragging, setDragging] = useState(null); // { cardId, fromCol }
  const [showAddCard, setShowAddCard] = useState(null); // colId
  const [newCardText, setNewCardText] = useState('');
  const [newCardPriority, setNewCardPriority] = useState('medium');
  const [editCard, setEditCard] = useState(null); // { colId, card }

  const PRIORITIES = {
    high:   { bg: '#faece7', color: '#993c1d', label: 'High' },
    medium: { bg: '#fdf3dc', color: '#b8720a', label: 'Med' },
    low:    { bg: '#e1f5ee', color: '#0f6e56', label: 'Low' },
  };

  const addCard = (colId) => {
    if (!newCardText.trim()) return;
    setCards(prev => ({
      ...prev,
      [colId]: [...(prev[colId] || []), { id: cardIdCounter++, text: newCardText.trim(), priority: newCardPriority }],
    }));
    setNewCardText('');
    setNewCardPriority('medium');
    setShowAddCard(null);
  };

  const deleteCard = (colId, cardId) => {
    setCards(prev => ({ ...prev, [colId]: prev[colId].filter(c => c.id !== cardId) }));
  };

  const moveCard = (cardId, fromCol, toCol) => {
    if (fromCol === toCol) return;
    const card = cards[fromCol]?.find(c => c.id === cardId);
    if (!card) return;
    setCards(prev => ({
      ...prev,
      [fromCol]: prev[fromCol].filter(c => c.id !== cardId),
      [toCol]: [...(prev[toCol] || []), card],
    }));
  };

  const handleDragStart = (e, cardId, colId) => {
    setDragging({ cardId, fromCol: colId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, toCol) => {
    e.preventDefault();
    if (dragging) moveCard(dragging.cardId, dragging.fromCol, toCol);
    setDragging(null);
  };

  const totalCards = Object.values(cards).reduce((s, col) => s + col.length, 0);

  return (
    <div style={s.root}>
      <div style={s.header}>
        <div>
          <div style={s.title}>Plot Board</div>
          <div style={s.sub}>{totalCards} story card{totalCards !== 1 ? 's' : ''} · drag to move between stages</div>
        </div>
      </div>

      <div style={s.board}>
        {columns.map(col => (
          <div key={col.id} style={s.column}
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(e, col.id)}
          >
            <div style={{ ...s.colHeader, background: col.color, borderBottom: `2px solid ${col.border}` }}>
              <span style={s.colTitle}>{col.title}</span>
              <span style={s.colCount}>{(cards[col.id] || []).length}</span>
            </div>

            <div style={s.colBody}>
              {(cards[col.id] || []).map(card => {
                const pr = PRIORITIES[card.priority] || PRIORITIES.medium;
                return (
                  <div key={card.id} style={s.card}
                    draggable
                    onDragStart={e => handleDragStart(e, card.id, col.id)}
                  >
                    <div style={s.cardText}>{card.text}</div>
                    <div style={s.cardFooter}>
                      <span style={{ ...s.priorityBadge, background: pr.bg, color: pr.color }}>{pr.label}</span>
                      <div style={s.cardActions}>
                        {/* Move arrows */}
                        {columns.findIndex(c => c.id === col.id) > 0 && (
                          <button style={s.moveBtn} title="Move left"
                            onClick={() => {
                              const idx = columns.findIndex(c => c.id === col.id);
                              moveCard(card.id, col.id, columns[idx - 1].id);
                            }}>←</button>
                        )}
                        {columns.findIndex(c => c.id === col.id) < columns.length - 1 && (
                          <button style={s.moveBtn} title="Move right"
                            onClick={() => {
                              const idx = columns.findIndex(c => c.id === col.id);
                              moveCard(card.id, col.id, columns[idx + 1].id);
                            }}>→</button>
                        )}
                        <button style={s.deleteCardBtn} onClick={() => deleteCard(col.id, card.id)}>✕</button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add card */}
              {showAddCard === col.id ? (
                <div style={s.addForm}>
                  <textarea style={s.addInput} placeholder="Describe this story beat…" value={newCardText}
                    onChange={e => setNewCardText(e.target.value)} autoFocus rows={3}
                    onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) addCard(col.id); }} />
                  <select style={s.prioritySelect} value={newCardPriority} onChange={e => setNewCardPriority(e.target.value)}>
                    <option value="high">High priority</option>
                    <option value="medium">Medium priority</option>
                    <option value="low">Low priority</option>
                  </select>
                  <div style={s.addFormActions}>
                    <button style={s.cancelBtn} onClick={() => { setShowAddCard(null); setNewCardText(''); }}>Cancel</button>
                    <button style={s.confirmBtn} onClick={() => addCard(col.id)}>Add Card</button>
                  </div>
                </div>
              ) : (
                <button style={s.addCardBtn} onClick={() => setShowAddCard(col.id)}>+ Add card</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  root: { padding: 16, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  header: { marginBottom: 14, flexShrink: 0 },
  title: { fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#1a1612' },
  sub: { fontSize: 12, color: '#7a6e62', marginTop: 2 },
  board: { display: 'flex', gap: 10, overflowX: 'auto', flex: 1, paddingBottom: 8 },
  column: { minWidth: 200, maxWidth: 220, display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #e0d8ca', borderRadius: 10, overflow: 'hidden', flexShrink: 0 },
  colHeader: { padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  colTitle: { fontSize: 12, fontWeight: 700, color: '#1a1612' },
  colCount: { fontSize: 11, background: 'rgba(26,22,18,0.1)', color: '#3d342b', padding: '1px 6px', borderRadius: 8, fontWeight: 600 },
  colBody: { flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: 7 },
  card: { background: '#faf7f2', border: '1px solid #e8e2d8', borderRadius: 8, padding: '10px 10px 8px', cursor: 'grab', userSelect: 'none' },
  cardText: { fontSize: 12, color: '#1a1612', lineHeight: 1.5, marginBottom: 8 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  priorityBadge: { fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 6 },
  cardActions: { display: 'flex', gap: 3 },
  moveBtn: { background: 'transparent', border: '1px solid #e0d8ca', color: '#7a6e62', padding: '1px 5px', borderRadius: 4, fontSize: 11, cursor: 'pointer' },
  deleteCardBtn: { background: 'transparent', border: 'none', color: '#c0b5a8', fontSize: 11, cursor: 'pointer', padding: '1px 3px' },
  addCardBtn: { background: 'transparent', border: '1px dashed #e0d8ca', color: '#7a6e62', padding: '7px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', textAlign: 'center' },
  addForm: { display: 'flex', flexDirection: 'column', gap: 6 },
  addInput: { border: '1px solid #d4860a', borderRadius: 7, padding: '7px 9px', fontSize: 12, fontFamily: 'DM Sans, sans-serif', resize: 'none', outline: 'none', color: '#1a1612' },
  prioritySelect: { border: '1px solid #e0d8ca', borderRadius: 6, padding: '4px 7px', fontSize: 11, fontFamily: 'DM Sans, sans-serif', color: '#3d342b', background: '#fff', outline: 'none' },
  addFormActions: { display: 'flex', gap: 6 },
  cancelBtn: { flex: 1, background: 'transparent', border: '1px solid #e0d8ca', color: '#7a6e62', padding: '5px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  confirmBtn: { flex: 1, background: '#1a1612', color: '#faf7f2', border: 'none', padding: '5px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
};
