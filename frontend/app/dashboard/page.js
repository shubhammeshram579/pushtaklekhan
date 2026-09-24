'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { booksAPI, analyticsAPI,subscriptionAPI,authAPI } from '../../lib/api';
import { logout ,setSubscriptionStatus} from '../../store';
import toast from 'react-hot-toast';
import CreditBalance from '../../components/subscription/CreditBalance';


const GENRES = ['fiction','non-fiction','fantasy','sci-fi','mystery','romance','thriller','biography','self-help','technical','other'];
const STATUS_COLORS = {
  draft:       { bg: '#f0ebe0', color: '#7a6e62' },
  'in-progress':{ bg: '#fdf3dc', color: '#b8720a' },
  completed:   { bg: '#e1f5ee', color: '#0f6e56' },
  published:   { bg: '#e6f1fb', color: '#185fa5' },
};

export default function Dashboard() {
  const [books, setBooks] = useState([]);
  const [dashStats, setDashStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', genre: 'fiction', wordCountGoal: '' });
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);

  const loadAll = useCallback(async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      const [booksRes, statsRes,data] = await Promise.all([
        booksAPI.list(params),
        analyticsAPI.getDashboard().catch(() => ({ data: { stats: null } })),
        subscriptionAPI.getStatus()
        
      ]);
      setBooks(booksRes.data.books || []);
      setDashStats(statsRes.data.stats);
      dispatch(setSubscriptionStatus(data));
    } catch { toast.error('Failed to load library'); }
    finally { setLoading(false); }
  }, [search, filterStatus]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const createBook = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      const payload = { ...form, wordCountGoal: form.wordCountGoal ? Number(form.wordCountGoal) : 0 };
      const { data } = await booksAPI.create(payload);
      toast.success('Book created!');
      router.push(`/book/${data.book._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create book');
    } finally { setCreating(false); }
  };

  const deleteBook = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await booksAPI.delete(id);
      setBooks(b => b.filter(bk => bk._id !== id));
      toast.success('Book deleted');
    } catch { toast.error('Failed to delete book'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await booksAPI.update(id, { status });
      setBooks(b => b.map(bk => bk._id === id ? { ...bk, status } : bk));
    } catch {}
  };

  const handleImageUpload = async (bookId, file) => {
  if (!file) return;

  const formData = new FormData();
  formData.append('coverImage', file); // Field name MUST match upload.single('coverImage')

  try {
    // Send FormData to your backend API
    const { data } = await booksAPI.update(bookId, formData);

    // Update state with returned book from backend
    setBooks(prev => prev.map(bk => bk._id === bookId ? data.book : bk));
    toast.success('Cover updated successfully!');
  } catch (err) {
    toast.error('Failed to update cover image');
  }
};

  const handleLogout = async () => { 

    try {

      await authAPI.logout()

      dispatch(logout()); 
      router.replace('/');

    } catch {}
     
  };

  const filteredBooks = books;

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.logo}><span style={s.quill}>✒</span> Pushtak<span style={s.quill}>lekhan</span></span>
          <span style={s.version}>v2.0</span>
        </div>
        <div style={s.headerRight}>
          {user && <span style={s.userName}>👤 {user.name}</span>}

          <CreditBalance dark={true} />
          <button style={s.logoutBtn} onClick={handleLogout}>Sign out</button>

          {user?.role === 'admin' && (
            <Link href="/admin" style={{
              fontSize: 12, color: '#f5d98a', textDecoration: 'none',
              border: '1px solid rgba(212,134,10,0.4)', padding: '4px 11px',
              borderRadius: 6, fontWeight: 600,
            }}>
              ⚙ Admin Panel
            </Link>
          )}

          
        </div>


   

        
      </header>

      <main style={s.main}>
        {/* Dashboard Stats */}
        {dashStats && (
          <div style={s.statsRow}>
            {[
              { icon: '📚', label: 'Books', value: dashStats.totalBooks || 0 },
              { icon: '📝', label: 'Total Words', value: dashStats.totalWords > 999 ? `${(dashStats.totalWords/1000).toFixed(1)}k` : dashStats.totalWords || 0 },
              { icon: '✍️', label: 'Today', value: dashStats.todayWords || 0 },
              { icon: '⏱', label: 'Reading Hours', value: `${dashStats.estimatedReadingHours || 0}h` },
            ].map(({ icon, label, value }) => (
              <div key={label} style={s.dashStat}>
                <span style={s.dashStatIcon}>{icon}</span>
                <div>
                  <div style={s.dashStatVal}>{value}</div>
                  <div style={s.dashStatLabel}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Library header */}
        <div style={s.libraryHeader}>
          <div>
            <h1 style={s.heroTitle}>Your Library</h1>
            <p style={s.heroSub}>{books.length} book{books.length !== 1 ? 's' : ''}</p>
          </div>
          <div style={s.libraryActions}>
            {/* Search */}
            <input style={s.searchInput} placeholder="Search books…" value={search}
              onChange={e => setSearch(e.target.value)} />
            {/* Status filter */}
            <select style={s.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All statuses</option>
              {['draft','in-progress','completed','published'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <button style={s.createBtn} onClick={() => setShowCreate(true)}>+ New Book</button>
          </div>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div style={s.center}>Loading your library…</div>
        ) : filteredBooks.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>📚</div>
            <div style={s.emptyTitle}>No books yet</div>
            <div style={s.emptySub}>{search ? 'No books match your search' : 'Start your first masterpiece'}</div>
            {!search && <button style={s.createBtn} onClick={() => setShowCreate(true)}>Create your first book</button>}
          </div>
        ) : (
          <div style={s.grid}>
            {filteredBooks.map(book => {
              const sc = STATUS_COLORS[book.status] || STATUS_COLORS.draft;
              const progress = book.wordCountGoal > 0 ? Math.min(Math.round((book.totalWordCount / book.wordCountGoal) * 100), 100) : 0;
              return (
                <div key={book._id} style={s.bookCard}>
                  {/* Cover */}
                  {/* <div style={s.bookCover} onClick={() => router.push(`/book/${book._id}`)}>
                    {book.coverImage
                      ? <img src={book.coverImage} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={s.coverInner}>
                          <span style={s.coverIcon}>✒</span>
                          <span style={s.coverGenre}>{book.genre}</span>
                        </div>
                    }
                  </div> */}

                  <div style={{ ...s.bookCover, position: 'relative' }}>
                    <input
                      type="file"
                      accept="image/*"
                      id={`cover-file-${book._id}`}
                      style={{ display: 'none' }}
                      onChange={(e) => handleImageUpload(book._id, e.target.files[0])}
                    />

                    {book.coverImage ? (
                      <img src={book.coverImage} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={s.coverInner}>
                        <span style={s.coverIcon}>✒</span>
                        <span style={s.coverGenre}>{book.genre}</span>
                      </div>
                    )}

                    <label
                      htmlFor={`cover-file-${book._id}`}
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        background: '#fff',
                        color: '#fff',
                        padding: '2px 3px',
                        borderRadius: 30,
                        fontSize: 10,
                        cursor: 'pointer'
                      }}
                    >
                      📷
                    </label>
                  </div>

                  {/* Info */}
                  <div style={s.bookInfo}>
                    <div style={s.bookTop}>
                      <h3 style={s.bookTitle} onClick={() => router.push(`/book/${book._id}`)}>
                        {book.title}
                      </h3>
                      <button style={s.deleteBtn} onClick={() => deleteBook(book._id, book.title)}>✕</button>
                    </div>

                    {book.description && (
                      <p style={s.bookDesc}>{book.description.slice(0, 70)}{book.description.length > 70 ? '…' : ''}</p>
                    )}

                    <div style={s.bookMeta}>
                      <select style={{ ...s.statusSelect, background: sc.bg, color: sc.color }}
                        value={book.status}
                        onChange={e => updateStatus(book._id, e.target.value)}>
                        {['draft','in-progress','completed','published'].map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                      <span style={s.genreTag}>{book.genre}</span>
                    </div>

                    {/* Progress bar */}
                    {book.wordCountGoal > 0 && (
                      <div style={s.progressWrap}>
                        <div style={s.progressBar}>
                          <div style={{ ...s.progressFill, width: `${progress}%` }} />
                        </div>
                        <span style={s.progressLabel}>{progress}%</span>
                      </div>
                    )}

                    <button style={s.openBtn} onClick={() => router.push(`/book/${book._id}`)}>
                      Open Editor →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Book Modal */}
      {showCreate && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div style={s.modal}>
            <h2 style={s.modalTitle}>New Book</h2>
            <form onSubmit={createBook} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label style={s.label}>Title *</label>
                <input style={s.input} required placeholder="The name of your masterpiece…"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
              </div>
              <div>
                <label style={s.label}>Description</label>
                <textarea style={{ ...s.input, minHeight: 72, resize: 'vertical' }}
                  placeholder="A brief premise or summary…"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={s.label}>Genre</label>
                  <select style={s.input} value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}>
                    {GENRES.map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Word Count Goal</label>
                  <input style={s.input} type="number" placeholder="e.g. 80000"
                    value={form.wordCountGoal} onChange={e => setForm(f => ({ ...f, wordCountGoal: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="button" style={s.cancelBtn} onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" style={s.primaryBtn} disabled={creating}>
                  {creating ? 'Creating…' : 'Create Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#faf7f2', fontFamily: 'DM Sans, sans-serif' },
  header: { background: '#1a1612', padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  logo: { fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#faf7f2' },
  quill:{color: '#c8830a'},
  version: { fontSize: 10, color: 'rgba(250,247,242,0.3)', background: 'rgba(250,247,242,0.08)', padding: '2px 7px', borderRadius: 8 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  userName: { fontSize: 12, color: 'rgba(250,247,242,0.6)' },
  logoutBtn: { background: 'transparent', border: '1px solid rgba(250,247,242,0.2)', color: 'rgba(250,247,242,0.6)', padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  main: { maxWidth: 1140, margin: '0 auto', padding: '32px 24px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 },
  dashStat: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 },
  dashStatIcon: { fontSize: 24 },
  dashStatVal: { fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#1a1612' },
  dashStatLabel: { fontSize: 11, color: '#7a6e62' },
  libraryHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  heroTitle: { fontFamily: 'Playfair Display, serif', fontSize: 30, fontWeight: 700, color: '#1a1612' },
  heroSub: { fontSize: 13, color: '#7a6e62', marginTop: 2 },
  libraryActions: { display: 'flex', alignItems: 'center', gap: 8 },
  searchInput: { padding: '7px 12px', border: '1px solid #e0d8ca', borderRadius: 7, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1a1612', background: '#fff', outline: 'none', width: 180 },
  filterSelect: { padding: '7px 10px', border: '1px solid #e0d8ca', borderRadius: 7, fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#1a1612', background: '#fff', outline: 'none' },
  createBtn: { background: '#1a1612', color: '#faf7f2', border: 'none', padding: '8px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px,1fr))', gap: 20 },
  bookCard: { background: '#fff', borderRadius: 12, border: '1px solid #e0d8ca', overflow: 'hidden' },
  bookCover: { height: 150, background: 'linear-gradient(135deg, #1a1612, #3d342b)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  coverInner: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  coverIcon: { fontSize: 32, opacity: 0.35 },
  coverGenre: { fontSize: 10, color: 'rgba(250,247,242,0.3)', textTransform: 'capitalize', letterSpacing: '1px' },
  bookInfo: { padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 7 },
  bookTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 },
  bookTitle: { fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 700, color: '#1a1612', cursor: 'pointer', flex: 1, lineHeight: 1.3 },
  bookDesc: { fontSize: 11, color: '#7a6e62', lineHeight: 1.5 },
  bookMeta: { display: 'flex', gap: 6, alignItems: 'center' },
  statusSelect: { fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', textTransform: 'capitalize' },
  genreTag: { fontSize: 10, color: '#7a6e62', textTransform: 'capitalize' },
  progressWrap: { display: 'flex', alignItems: 'center', gap: 7 },
  progressBar: { flex: 1, background: '#f0ebe0', borderRadius: 4, height: 5, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #d4860a, #f5d98a)', borderRadius: 4, transition: 'width 0.5s ease' },
  progressLabel: { fontSize: 10, color: '#7a6e62', minWidth: 28 },
  openBtn: { background: 'transparent', border: '1px solid #e0d8ca', color: '#1a1612', padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  deleteBtn: { background: 'transparent', border: 'none', color: '#c0b5a8', fontSize: 13, cursor: 'pointer', padding: '0 2px', flexShrink: 0 },
  center: { textAlign: 'center', padding: 80, color: '#7a6e62', fontSize: 14 },
  empty: { textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  emptyTitle: { fontFamily: 'Playfair Display, serif', fontSize: 22, color: '#1a1612' },
  emptySub: { fontSize: 13, color: '#7a6e62' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,22,18,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal: { background: '#faf7f2', borderRadius: 14, padding: '28px', width: '100%', maxWidth: 460 },
  modalTitle: { fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#1a1612', marginBottom: 18 },
  label: { display: 'block', fontSize: 11, fontWeight: 600, color: '#7a6e62', marginBottom: 4, letterSpacing: '0.5px', textTransform: 'uppercase' },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #e0d8ca', borderRadius: 7, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1a1612', background: '#fff', outline: 'none' },
  cancelBtn: { background: 'transparent', border: '1px solid #e0d8ca', color: '#7a6e62', padding: '8px 14px', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  primaryBtn: { background: '#1a1612', color: '#faf7f2', border: 'none', padding: '8px 18px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
};
