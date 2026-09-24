'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../../lib/api';
import AdminGuard from '../../../components/admin/AdminGuard';
import toast from 'react-hot-toast';

function UsersContent() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [blockedFilter, setBlockedFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [showCreditModal, setShowCreditModal] = useState(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getUsers({
        search, plan: planFilter, blocked: blockedFilter, page, limit: 20,
      });
      setUsers(data.users);
      setTotal(data.total);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [search, planFilter, blockedFilter, page]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    try {
      const { data } = await adminAPI.getUserDetail(id);
      setSelectedUser(data);
    } catch { toast.error('Failed to load user detail'); }
  };

  const handleBlock = async () => {
    try {
      await adminAPI.blockUser(showBlockModal, blockReason);
      toast.success('User blocked');
      setShowBlockModal(null); setBlockReason('');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to block'); }
  };

  const handleUnblock = async (id) => {
    try {
      await adminAPI.unblockUser(id);
      toast.success('User unblocked');
      load();
    } catch { toast.error('Failed to unblock'); }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await adminAPI.changeRole(id, role);
      toast.success(`Role updated to ${role}`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change role'); }
  };

  const handleGrantCredits = async () => {
    if (!creditAmount || Number(creditAmount) <= 0) { toast.error('Enter a valid amount'); return; }
    try {
      await adminAPI.grantCredits(showCreditModal, Number(creditAmount), creditReason);
      toast.success(`Granted ${creditAmount} credits`);
      setShowCreditModal(null); setCreditAmount(''); setCreditReason('');
      load();
    } catch { toast.error('Failed to grant credits'); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Permanently delete ${name}'s account and all their books? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(id);
      toast.success('User deleted');
      setSelectedUser(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div style={s.pageHeader}>
        <h1 style={s.title}>User Management</h1>
        <p style={s.sub}>{total} total users</p>
      </div>

      <div style={s.filterBar}>
        <input style={s.searchInput} placeholder="Search by name or email…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select style={s.filterSelect} value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1); }}>
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="studio">Studio</option>
        </select>
        <select style={s.filterSelect} value={blockedFilter} onChange={e => { setBlockedFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="false">Active</option>
          <option value="true">Blocked</option>
        </select>
      </div>

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              {['User', 'Plan', 'Credits', 'Books', 'Joined', 'Status', 'Actions'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={s.emptyCell}>Loading users…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} style={s.emptyCell}>No users match these filters</td></tr>
            ) : users.map(u => (
              <tr key={u._id} style={s.tr}>
                <td style={s.td}>
                  <div onClick={() => openDetail(u._id)} style={{ cursor: 'pointer' }}>
                    <div style={s.userName}>{u.name} {u.role === 'admin' && <span style={s.adminBadge}>admin</span>}</div>
                    <div style={s.userEmail}>{u.email}</div>
                  </div>
                </td>
                <td style={s.td}><span style={{ ...s.planBadge, ...planColors[u.subscription.plan] }}>{u.subscription.plan}</span></td>
                <td style={s.td}>{u.aiCredits.remaining}/{u.aiCredits.total}</td>
                <td style={s.td}>{u.bookCount}</td>
                <td style={s.td}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td style={s.td}>
                  {u.moderation?.isBlocked
                    ? <span style={s.blockedBadge}>Blocked</span>
                    : <span style={s.activeBadge}>Active</span>}
                </td>
                <td style={s.td}>
                  <div style={s.actionsRow}>
                    {u.moderation?.isBlocked ? (
                      <button style={s.actionBtn} onClick={() => handleUnblock(u._id)}>Unblock</button>
                    ) : (
                      <button style={{ ...s.actionBtn, color: '#993c1d' }} onClick={() => setShowBlockModal(u._id)}>Block</button>
                    )}
                    <button style={s.actionBtn} onClick={() => setShowCreditModal(u._id)}>+ Credits</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={s.pagination}>
          <button style={s.pageBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={s.pageInfo}>Page {page} of {totalPages}</span>
          <button style={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {selectedUser && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setSelectedUser(null)}>
          <div style={s.drawer}>
            <button style={s.closeBtn} onClick={() => setSelectedUser(null)}>✕</button>
            <div style={s.drawerHeader}>
              <div style={s.drawerAvatar}>{selectedUser.user.name.charAt(0).toUpperCase()}</div>
              <div>
                <div style={s.drawerName}>{selectedUser.user.name}</div>
                <div style={s.drawerEmail}>{selectedUser.user.email}</div>
              </div>
            </div>

            <div style={s.drawerStats}>
              <div style={s.drawerStat}><div style={s.drawerStatVal}>{selectedUser.books.length}</div><div style={s.drawerStatLbl}>Books</div></div>
              <div style={s.drawerStat}><div style={s.drawerStatVal}>{selectedUser.user.aiCredits.remaining}</div><div style={s.drawerStatLbl}>Credits Left</div></div>
              <div style={s.drawerStat}><div style={s.drawerStatVal}>{selectedUser.payments.length}</div><div style={s.drawerStatLbl}>Payments</div></div>
            </div>

            <div style={s.drawerSection}>
              <div style={s.drawerSectionTitle}>Role</div>
              <select style={s.roleSelect} value={selectedUser.user.role}
                onChange={e => handleRoleChange(selectedUser.user._id, e.target.value)}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div style={s.drawerSection}>
              <div style={s.drawerSectionTitle}>Books</div>
              {selectedUser.books.length === 0 ? <div style={s.emptyText}>No books yet</div> : (
                <div style={s.miniList}>
                  {selectedUser.books.map(b => (
                    <div key={b._id} style={s.miniRow}>
                      <span>{b.title}</span>
                      <span style={s.miniStatus}>{b.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={s.drawerSection}>
              <div style={s.drawerSectionTitle}>Recent credit activity</div>
              {selectedUser.creditHistory.length === 0 ? <div style={s.emptyText}>No activity yet</div> : (
                <div style={s.miniList}>
                  {selectedUser.creditHistory.slice(0, 8).map(tx => (
                    <div key={tx._id} style={s.miniRow}>
                      <span>{tx.action}</span>
                      <span style={{ color: tx.type === 'debit' ? '#993c1d' : '#0f6e56' }}>
                        {tx.type === 'debit' ? '-' : '+'}{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button style={s.deleteAccountBtn} onClick={() => handleDelete(selectedUser.user._id, selectedUser.user.name)}>
              🗑 Delete account permanently
            </button>
          </div>
        </div>
      )}

      {showBlockModal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowBlockModal(null)}>
          <div style={s.modal}>
            <h3 style={s.modalTitle}>Block this user</h3>
            <p style={s.modalSub}>They'll be signed out immediately and unable to log back in until unblocked.</p>
            <textarea style={s.modalInput} placeholder="Reason (shown to the user)…" value={blockReason}
              onChange={e => setBlockReason(e.target.value)} rows={3} />
            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={() => setShowBlockModal(null)}>Cancel</button>
              <button style={s.dangerBtn} onClick={handleBlock}>Block User</button>
            </div>
          </div>
        </div>
      )}

      {showCreditModal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowCreditModal(null)}>
          <div style={s.modal}>
            <h3 style={s.modalTitle}>Grant AI credits</h3>
            <p style={s.modalSub}>Adds to both their remaining and total balance for this period.</p>
            <input style={s.modalInput} type="number" placeholder="Amount (e.g. 50)" value={creditAmount}
              onChange={e => setCreditAmount(e.target.value)} />
            <input style={{ ...s.modalInput, marginTop: 8 }} placeholder="Reason (optional)" value={creditReason}
              onChange={e => setCreditReason(e.target.value)} />
            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={() => setShowCreditModal(null)}>Cancel</button>
              <button style={s.primaryBtn} onClick={handleGrantCredits}>Grant Credits</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return <AdminGuard><UsersContent /></AdminGuard>;
}

const planColors = {
  free: { background: '#f0ebe0', color: '#7a6e62' },
  pro: { background: '#fdf3dc', color: '#b8720a' },
  studio: { background: '#e1f5ee', color: '#0f6e56' },
};

const s = {
  pageHeader: { marginBottom: 20 },
  title: { fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#1a1612' },
  sub: { fontSize: 13, color: '#7a6e62', marginTop: 4 },
  filterBar: { display: 'flex', gap: 10, marginBottom: 18 },
  searchInput: { flex: 1, padding: '9px 14px', border: '1px solid #e0d8ca', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', background: '#fff' },
  filterSelect: { padding: '9px 12px', border: '1px solid #e0d8ca', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans, sans-serif', background: '#fff', outline: 'none' },
  tableWrap: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 12, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#7a6e62', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '1px solid #e0d8ca', background: '#faf7f2' },
  tr: { borderBottom: '1px solid #f0ebe0' },
  td: { padding: '12px 16px', fontSize: 13, color: '#3d342b', verticalAlign: 'middle' },
  emptyCell: { textAlign: 'center', padding: 40, color: '#7a6e62' },
  userName: { fontWeight: 600, color: '#1a1612' },
  userEmail: { fontSize: 11, color: '#7a6e62', marginTop: 1 },
  adminBadge: { fontSize: 9, background: '#1a1612', color: '#f5d98a', padding: '1px 6px', borderRadius: 5, marginLeft: 6, fontWeight: 700 },
  planBadge: { fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 8, textTransform: 'capitalize' },
  blockedBadge: { fontSize: 11, fontWeight: 600, color: '#993c1d', background: '#faece7', padding: '2px 9px', borderRadius: 8 },
  activeBadge: { fontSize: 11, fontWeight: 600, color: '#0f6e56', background: '#e1f5ee', padding: '2px 9px', borderRadius: 8 },
  actionsRow: { display: 'flex', gap: 6 },
  actionBtn: { background: 'transparent', border: '1px solid #e0d8ca', color: '#3d342b', padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20 },
  pageBtn: { background: '#fff', border: '1px solid #e0d8ca', color: '#3d342b', padding: '7px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  pageInfo: { fontSize: 12, color: '#7a6e62' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,22,18,0.5)', display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end', zIndex: 2000 },
  drawer: { background: '#faf7f2', width: 420, maxWidth: '100%', height: '100vh', overflowY: 'auto', padding: '28px 24px', position: 'relative' },
  closeBtn: { position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', fontSize: 18, color: '#7a6e62', cursor: 'pointer' },
  drawerHeader: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 },
  drawerAvatar: { width: 48, height: 48, borderRadius: '50%', background: '#1a1612', color: '#f5d98a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, fontFamily: 'Playfair Display, serif', flexShrink: 0 },
  drawerName: { fontFamily: 'Playfair Display, serif', fontSize: 19, fontWeight: 700, color: '#1a1612' },
  drawerEmail: { fontSize: 12, color: '#7a6e62' },
  drawerStats: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 24 },
  drawerStat: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 10, padding: '12px', textAlign: 'center' },
  drawerStatVal: { fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#1a1612' },
  drawerStatLbl: { fontSize: 10, color: '#7a6e62' },
  drawerSection: { marginBottom: 20 },
  drawerSectionTitle: { fontSize: 11, fontWeight: 700, color: '#7a6e62', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 },
  roleSelect: { width: '100%', padding: '8px 12px', border: '1px solid #e0d8ca', borderRadius: 8, fontSize: 13, background: '#fff', fontFamily: 'DM Sans, sans-serif' },
  miniList: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 8, padding: '4px 12px' },
  miniRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0ebe0', fontSize: 12 },
  miniStatus: { color: '#7a6e62', textTransform: 'capitalize' },
  emptyText: { fontSize: 12, color: '#7a6e62', padding: '10px 0' },
  deleteAccountBtn: { width: '100%', background: '#993c1d', color: '#fff', border: 'none', padding: '11px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', marginTop: 8 },
  modal: { background: '#faf7f2', borderRadius: 14, padding: '26px', width: '100%', maxWidth: 420, position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' },
  modalTitle: { fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: '#1a1612', marginBottom: 6 },
  modalSub: { fontSize: 12, color: '#7a6e62', marginBottom: 14 },
  modalInput: { width: '100%', padding: '9px 12px', border: '1px solid #e0d8ca', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1a1612', background: '#fff', outline: 'none', resize: 'vertical' },
  modalActions: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 },
  cancelBtn: { background: 'transparent', border: '1px solid #e0d8ca', color: '#7a6e62', padding: '8px 16px', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  primaryBtn: { background: '#1a1612', color: '#faf7f2', border: 'none', padding: '8px 18px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  dangerBtn: { background: '#993c1d', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
};
