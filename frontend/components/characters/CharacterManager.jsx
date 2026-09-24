'use client';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { charactersAPI } from '../../lib/api';
import { addCharacter, updateChar, removeCharacter, setCharacters } from '../../store';
import toast from 'react-hot-toast';

const ROLES = ['protagonist','antagonist','supporting','minor','narrator'];
const ROLE_COLORS = {
  protagonist: { bg: '#fdf3dc', color: '#b8720a', border: '#f5d98a' },
  antagonist:  { bg: '#faece7', color: '#993c1d', border: '#f0b9a8' },
  supporting:  { bg: '#e1f5ee', color: '#0f6e56', border: '#a8dece' },
  minor:       { bg: '#f0ebe0', color: '#7a6e62', border: '#e0d8ca' },
  narrator:    { bg: '#ebe8f5', color: '#5b3fa8', border: '#c5b9f0' },
};

const EMPTY_FORM = { name: '', role: 'supporting', personality: '', appearance: '', backstory: '', goals: '', notes: '' };

export default function CharacterManager({ bookId }) {
  const dispatch = useDispatch();
  const { list: characters } = useSelector(s => s.characters);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); setSelected(null); };
  const openEdit = (ch) => { setForm({ name: ch.name, role: ch.role, personality: ch.personality || '', appearance: ch.appearance || '', backstory: ch.backstory || '', goals: ch.goals || '', notes: ch.notes || '' }); setEditId(ch._id); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editId) {
        const { data } = await charactersAPI.update(editId, form);
        dispatch(updateChar(data.character));
        toast.success('Character updated');
      } else {
        const { data } = await charactersAPI.create({ ...form, bookId });
        dispatch(addCharacter(data.character));
        toast.success('Character created');
      }
      setShowForm(false);
    } catch { toast.error('Failed to save character'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await charactersAPI.delete(id);
      dispatch(removeCharacter(id));
      if (selected?._id === id) setSelected(null);
      toast.success('Character deleted');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div style={s.root}>
      <div style={s.header}>
        <div>
          <div style={s.title}>Characters</div>
          <div style={s.sub}>{characters.length} character{characters.length !== 1 ? 's' : ''}</div>
        </div>
        <button style={s.addBtn} onClick={openCreate}>+ Add</button>
      </div>

      {characters.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🎭</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: '#3d342b', marginBottom: 6 }}>No characters yet</div>
          <div style={{ fontSize: 12, color: '#7a6e62', marginBottom: 14 }}>Add your cast to give AI writing context</div>
          <button style={s.addBtn} onClick={openCreate}>Create first character</button>
        </div>
      ) : (
        <div style={s.grid}>
          {characters.map(ch => {
            const rc = ROLE_COLORS[ch.role] || ROLE_COLORS.minor;
            return (
              <div key={ch._id} style={{ ...s.card, ...(selected?._id === ch._id ? s.cardActive : {}) }} onClick={() => setSelected(selected?._id === ch._id ? null : ch)}>
                <div style={s.cardTop}>
                  <div style={s.avatar}>{ch.name.charAt(0).toUpperCase()}</div>
                  <div style={s.cardInfo}>
                    <div style={s.charName}>{ch.name}</div>
                    <span style={{ ...s.roleBadge, background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>{ch.role}</span>
                  </div>
                  <div style={s.cardActions}>
                    <button style={s.iconBtn} onClick={e => { e.stopPropagation(); openEdit(ch); }}>✎</button>
                    <button style={s.iconBtn} onClick={e => { e.stopPropagation(); handleDelete(ch._id, ch.name); }}>✕</button>
                  </div>
                </div>
                {selected?._id === ch._id && (
                  <div style={s.detail}>
                    {ch.personality && <div style={s.detailRow}><span style={s.detailLabel}>Personality</span><span style={s.detailVal}>{ch.personality}</span></div>}
                    {ch.appearance && <div style={s.detailRow}><span style={s.detailLabel}>Appearance</span><span style={s.detailVal}>{ch.appearance}</span></div>}
                    {ch.goals && <div style={s.detailRow}><span style={s.detailLabel}>Goals</span><span style={s.detailVal}>{ch.goals}</span></div>}
                    {ch.backstory && <div style={s.detailRow}><span style={s.detailLabel}>Backstory</span><span style={s.detailVal}>{ch.backstory.slice(0, 150)}{ch.backstory.length > 150 ? '…' : ''}</span></div>}
                    {ch.notes && <div style={s.detailRow}><span style={s.detailLabel}>Notes</span><span style={s.detailVal}>{ch.notes}</span></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={s.modal}>
            <h3 style={s.modalTitle}>{editId ? 'Edit Character' : 'New Character'}</h3>
            <div style={s.formGrid}>
              <div style={s.formGroup}>
                <label style={s.label}>Name *</label>
                <input style={s.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Character name" />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Role</label>
                <select style={s.input} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
            </div>
            {[
              { key: 'personality', label: 'Personality', placeholder: 'Sarcastic, introverted, loyal…' },
              { key: 'appearance', label: 'Appearance', placeholder: 'Tall, dark hair, piercing blue eyes…' },
              { key: 'goals', label: 'Goals & Motivations', placeholder: 'Wants to find their lost sister…' },
              { key: 'backstory', label: 'Backstory', placeholder: 'Grew up in a small village before the war…', rows: 3 },
              { key: 'notes', label: 'Notes', placeholder: 'Any other important notes…', rows: 2 },
            ].map(f => (
              <div key={f.key} style={s.formGroup}>
                <label style={s.label}>{f.label}</label>
                <textarea style={{ ...s.input, minHeight: f.rows ? f.rows * 28 : 44, resize: 'vertical' }}
                  value={form[f.key]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} rows={f.rows || 2} />
              </div>
            ))}
            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={s.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Character'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  root: { padding: '16px', overflowY: 'auto', height: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#1a1612' },
  sub: { fontSize: 12, color: '#7a6e62', marginTop: 2 },
  addBtn: { background: '#1a1612', color: '#faf7f2', border: 'none', padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' },
  empty: { textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  grid: { display: 'flex', flexDirection: 'column', gap: 8 },
  card: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 10, padding: '12px', cursor: 'pointer', transition: 'all 0.15s' },
  cardActive: { borderColor: '#d4860a', background: '#fdf9f0' },
  cardTop: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: '#1a1612', color: '#faf7f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0, fontFamily: 'Playfair Display, serif' },
  cardInfo: { flex: 1 },
  charName: { fontWeight: 600, fontSize: 14, color: '#1a1612', marginBottom: 3 },
  roleBadge: { fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 8, textTransform: 'capitalize' },
  cardActions: { display: 'flex', gap: 4 },
  iconBtn: { background: 'transparent', border: 'none', color: '#c0b5a8', fontSize: 12, cursor: 'pointer', padding: '2px 4px' },
  detail: { marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0ebe0', display: 'flex', flexDirection: 'column', gap: 6 },
  detailRow: { display: 'flex', gap: 8 },
  detailLabel: { fontSize: 10, fontWeight: 600, color: '#7a6e62', letterSpacing: '0.5px', textTransform: 'uppercase', minWidth: 70, paddingTop: 1 },
  detailVal: { fontSize: 12, color: '#3d342b', lineHeight: 1.5, flex: 1 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,22,18,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 },
  modal: { background: '#faf7f2', borderRadius: 14, padding: '26px', width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: '#1a1612', marginBottom: 16 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 },
  formGroup: { marginBottom: 12 },
  label: { display: 'block', fontSize: 11, fontWeight: 600, color: '#7a6e62', marginBottom: 4, letterSpacing: '0.5px', textTransform: 'uppercase' },
  input: { width: '100%', padding: '8px 11px', border: '1px solid #e0d8ca', borderRadius: 7, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1a1612', background: '#fff', outline: 'none' },
  modalActions: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 },
  cancelBtn: { background: 'transparent', border: '1px solid #e0d8ca', color: '#7a6e62', padding: '7px 14px', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  saveBtn: { background: '#1a1612', color: '#faf7f2', border: 'none', padding: '7px 18px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
};
