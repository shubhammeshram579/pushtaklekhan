'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { subscriptionAPI, creditsAPI } from '../../lib/api';
import { setSubscriptionStatus } from '../../store';
import { loadRazorpay } from '../../lib/loadRazorpay';
import toast from 'react-hot-toast';

export default function BillingPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { plan, status, credits } = useSelector(s => s.subscription);

  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [payments, setPayments] = useState([]);
  const [usageSummary, setUsageSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [subInfo, setSubInfo] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [plansRes, statusRes, historyRes, paymentsRes, summaryRes] = await Promise.all([
        subscriptionAPI.getPlans(),
        subscriptionAPI.getStatus(),
        creditsAPI.getHistory(30),
        subscriptionAPI.getHistory(),
        creditsAPI.getUsageSummary(),
      ]);
      setPlans(plansRes.data.plans);
      setSubInfo(statusRes.data.subscription);
      dispatch(setSubscriptionStatus(statusRes.data));
      setHistory(historyRes.data.transactions || []);
      setPayments(paymentsRes.data.payments || []);
      setUsageSummary(summaryRes.data.summary || []);
    } catch { toast.error('Failed to load billing info'); }
    finally { setLoading(false); }
  };

  const handleUpgrade = async (planId) => {
    setLoadingPlan(planId);
    try {
      const ok = await loadRazorpay();
      if (!ok) { toast.error('Payment gateway failed to load'); setLoadingPlan(null); return; }
      const { data } = await subscriptionAPI.createOrder(planId);
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Inkwell',
        description: `${data.plan.name} Plan — Monthly`,
        order_id: data.order.id,
        theme: { color: '#1a1612' },
        prefill: { name: user?.name, email: user?.email },
        handler: async (response) => {
          try {
            const verify = await subscriptionAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            dispatch(setSubscriptionStatus(verify.data));
            toast.success(`Upgraded to ${data.plan.name}! 🎉`);
            loadAll();
          } catch { toast.error('Payment succeeded but verification failed'); }
        },
        modal: { ondismiss: () => setLoadingPlan(null) },
      });
      rzp.open();
    } catch { toast.error('Could not start checkout'); }
    finally { setLoadingPlan(null); }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You\'ll keep access until the end of this billing period.')) return;
    setCancelling(true);
    try {
      const { data } = await subscriptionAPI.cancel();
      toast.success(data.message);
      loadAll();
    } catch { toast.error('Failed to cancel'); }
    finally { setCancelling(false); }
  };

  if (loading) return <div style={s.loadingPage}>Loading billing…</div>;

  const pct = credits.total > 0 ? Math.round((credits.remaining / credits.total) * 100) : 0;
  const otherPlans = plans.filter(p => p.id !== plan);

  return (
    <div style={s.page}>
      <header style={s.header}>
        <button style={s.backBtn} onClick={() => router.push('/dashboard')}>← Dashboard</button>
        <div style={s.headerTitle}>Billing & Usage</div>
        <div style={{ width: 90 }} />
      </header>

      <main style={s.main}>
        {/* Current plan card */}
        <div style={s.currentPlanCard}>
          <div style={s.cpLeft}>
            <div style={s.cpLabel}>Current plan</div>
            <div style={s.cpPlanName}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</div>
            {subInfo?.currentPeriodEnd && (
              <div style={s.cpRenewal}>
                {subInfo.cancelAtPeriodEnd ? 'Downgrades to Free on ' : 'Renews on '}
                {new Date(subInfo.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            )}
            {plan !== 'free' && !subInfo?.cancelAtPeriodEnd && (
              <button style={s.cancelLink} onClick={handleCancel} disabled={cancelling}>
                {cancelling ? 'Cancelling…' : 'Cancel subscription'}
              </button>
            )}
          </div>

          {/* Credit ring */}
          <div style={s.cpRight}>
            <div style={s.ringWrap}>
              <svg width="88" height="88" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r="38" fill="none" stroke="#ede6d8" strokeWidth="8" />
                <circle
                  cx="44" cy="44" r="38" fill="none"
                  stroke={pct <= 15 ? '#993c1d' : pct <= 40 ? '#d4860a' : '#0f6e56'}
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 38}
                  strokeDashoffset={2 * Math.PI * 38 * (1 - pct / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 44 44)"
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div style={s.ringCenter}>
                <div style={s.ringPct}>{pct}%</div>
              </div>
            </div>
            <div style={s.creditsText}>
              <span style={s.creditsBig}>{credits.remaining.toLocaleString()}</span> / {credits.total.toLocaleString()} credits left
            </div>
            {credits.resetAt && (
              <div style={s.resetText}>Resets {new Date(credits.resetAt).toLocaleDateString()}</div>
            )}
          </div>
        </div>

        {/* Upgrade options */}
        {otherPlans.length > 0 && (
          <div style={s.section}>
            <div style={s.sectionTitle}>
              {plan === 'free' ? 'Upgrade for more credits' : 'Other plans'}
            </div>
            <div style={s.upgradeGrid}>
              {otherPlans.map(p => (
                <div key={p.id} style={s.upgradeCard}>
                  <div>
                    <div style={s.upgradeName}>{p.name}</div>
                    <div style={s.upgradeCredits}>{p.aiCreditsPerMonth.toLocaleString()} credits/mo</div>
                  </div>
                  <div style={s.upgradeRight}>
                    <div style={s.upgradePrice}>{p.price === 0 ? 'Free' : `₹${p.price}/mo`}</div>
                    <button
                      style={s.upgradeBtn}
                      onClick={() => p.price > 0 ? handleUpgrade(p.id) : router.push('/dashboard')}
                      disabled={loadingPlan === p.id}
                    >
                      {loadingPlan === p.id ? '…' : p.price === 0 ? 'Downgrade' : 'Upgrade'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage breakdown */}
        {usageSummary.length > 0 && (
          <div style={s.section}>
            <div style={s.sectionTitle}>Usage this month, by action</div>
            <div style={s.usageList}>
              {usageSummary.map(u => (
                <div key={u._id} style={s.usageRow}>
                  <span style={s.usageAction}>{u._id}</span>
                  <div style={s.usageBarWrap}>
                    <div style={{ ...s.usageBar, width: `${Math.min((u.totalCredits / (usageSummary[0]?.totalCredits || 1)) * 100, 100)}%` }} />
                  </div>
                  <span style={s.usageCount}>{u.count}× · {u.totalCredits} credits</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction history */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Recent activity</div>
          <div style={s.historyList}>
            {history.length === 0 ? (
              <div style={s.emptyText}>No activity yet</div>
            ) : history.map(tx => (
              <div key={tx._id} style={s.historyRow}>
                <div>
                  <div style={s.historyAction}>
                    {tx.type === 'debit' ? '⚡' : tx.type === 'grant' ? '🎁' : '↩️'} {tx.action}
                  </div>
                  <div style={s.historyDate}>{new Date(tx.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div style={{ ...s.historyAmount, color: tx.type === 'debit' ? '#993c1d' : '#0f6e56' }}>
                  {tx.type === 'debit' ? '-' : '+'}{tx.amount}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment history */}
        {payments.length > 0 && (
          <div style={s.section}>
            <div style={s.sectionTitle}>Payment history</div>
            <div style={s.historyList}>
              {payments.map(p => (
                <div key={p._id} style={s.historyRow}>
                  <div>
                    <div style={s.historyAction}>{p.plan.charAt(0).toUpperCase() + p.plan.slice(1)} Plan</div>
                    <div style={s.historyDate}>{new Date(p.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={s.paymentAmount}>₹{(p.amount / 100).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  loadingPage: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a6e62', fontFamily: 'DM Sans, sans-serif' },
  page: { minHeight: '100vh', background: '#faf7f2', fontFamily: 'DM Sans, sans-serif' },
  header: { background: '#1a1612', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' },
  backBtn: { background: 'transparent', border: 'none', color: 'rgba(250,247,242,0.6)', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', width: 90, textAlign: 'left' },
  headerTitle: { fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 700, color: '#faf7f2' },
  main: { maxWidth: 720, margin: '0 auto', padding: '32px 20px 60px' },
  currentPlanCard: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 16, padding: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, gap: 20, flexWrap: 'wrap' },
  cpLeft: {},
  cpLabel: { fontSize: 11, fontWeight: 600, color: '#7a6e62', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 },
  cpPlanName: { fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 800, color: '#1a1612', marginBottom: 6 },
  cpRenewal: { fontSize: 12, color: '#7a6e62', marginBottom: 10 },
  cancelLink: { background: 'transparent', border: 'none', color: '#993c1d', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', textDecoration: 'underline', padding: 0 },
  cpRight: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  ringWrap: { position: 'relative', width: 88, height: 88 },
  ringCenter: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  ringPct: { fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#1a1612' },
  creditsText: { fontSize: 12, color: '#3d342b' },
  creditsBig: { fontWeight: 700, color: '#1a1612' },
  resetText: { fontSize: 10, color: '#7a6e62' },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: '#1a1612', marginBottom: 12, letterSpacing: '0.2px' },
  upgradeGrid: { display: 'flex', flexDirection: 'column', gap: 8 },
  upgradeCard: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  upgradeName: { fontSize: 14, fontWeight: 700, color: '#1a1612' },
  upgradeCredits: { fontSize: 11, color: '#7a6e62' },
  upgradeRight: { display: 'flex', alignItems: 'center', gap: 12 },
  upgradePrice: { fontSize: 13, fontWeight: 600, color: '#d4860a' },
  upgradeBtn: { background: '#1a1612', color: '#faf7f2', border: 'none', padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  usageList: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 12, padding: '6px 16px' },
  usageRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid #f0ebe0' },
  usageAction: { fontSize: 12, color: '#3d342b', width: 130, flexShrink: 0 },
  usageBarWrap: { flex: 1, background: '#f0ebe0', borderRadius: 4, height: 6, overflow: 'hidden' },
  usageBar: { height: '100%', background: '#d4860a', borderRadius: 4 },
  usageCount: { fontSize: 11, color: '#7a6e62', width: 110, textAlign: 'right', flexShrink: 0 },
  historyList: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 12, padding: '4px 16px' },
  historyRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0ebe0' },
  historyAction: { fontSize: 13, color: '#1a1612', fontWeight: 500, textTransform: 'capitalize' },
  historyDate: { fontSize: 11, color: '#7a6e62', marginTop: 2 },
  historyAmount: { fontSize: 14, fontWeight: 700 },
  paymentAmount: { fontSize: 14, fontWeight: 700, color: '#0f6e56' },
  emptyText: { textAlign: 'center', padding: '24px 0', color: '#7a6e62', fontSize: 13 },
};
