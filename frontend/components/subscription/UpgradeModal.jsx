'use client';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { subscriptionAPI } from '../../lib/api';
import { closeUpgradeModal, setSubscriptionStatus } from '../../store';
import { loadRazorpay } from '../../lib/loadRazorpay';
import toast from 'react-hot-toast';

/**
 * Mount this ONCE near the root of your app (e.g. in the book editor layout
 * and dashboard layout) — it reads `showUpgradeModal` from Redux and renders
 * itself. Trigger it from anywhere with:
 *   dispatch(openUpgradeModal({ reason: "You've used all your AI credits." }))
 * or automatically when an AI call returns 402 (see ai call wrapper below).
 */
export default function UpgradeModal() {
  const dispatch = useDispatch();
  const { showUpgradeModal, upgradeReason, plan: currentPlan } = useSelector(s => s.subscription);
  const { user } = useSelector(s => s.auth);
  const [plans, setPlans] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(null);

  useEffect(() => {
    if (showUpgradeModal) loadPlans();
  }, [showUpgradeModal]);

  const loadPlans = async () => {
    try {
      const { data } = await subscriptionAPI.getPlans();
      setPlans(data.plans.filter(p => p.id !== 'free'));
    } catch {}
  };

  const handleUpgrade = async (planId) => {
    setLoadingPlan(planId);
    try {
      const ok = await loadRazorpay();
      if (!ok) { toast.error('Payment gateway failed to load. Check your connection.'); setLoadingPlan(null); return; }

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
            dispatch(closeUpgradeModal());
          } catch {
            toast.error('Payment succeeded but verification failed — contact support.');
          }
        },
        modal: { ondismiss: () => setLoadingPlan(null) },
      });
      rzp.open();
    } catch {
      toast.error('Could not start checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  if (!showUpgradeModal) return null;

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && dispatch(closeUpgradeModal())}>
      <div style={s.modal}>
        <button style={s.closeBtn} onClick={() => dispatch(closeUpgradeModal())}>✕</button>

        <div style={s.header}>
          <div style={s.icon}>⚡</div>
          <div style={s.title}>You're out of AI credits</div>
          <p style={s.reason}>{upgradeReason || "You've used all your AI credits for this period."}</p>
        </div>

        <div style={s.plansGrid}>
          {plans.map(plan => (
            <div key={plan.id} style={{ ...s.planCard, ...(plan.id === 'pro' ? s.planCardHighlight : {}) }}>
              {plan.id === 'pro' && <div style={s.popularBadge}>Most popular</div>}
              <div style={s.planName}>{plan.name}</div>
              <div style={s.planPrice}>
                ₹{plan.price}<span style={s.planInterval}>/month</span>
              </div>
              <div style={s.planCredits}>{plan.aiCreditsPerMonth.toLocaleString()} AI credits / month</div>
              <ul style={s.featureList}>
                {plan.features.map((f, i) => (
                  <li key={i} style={s.featureItem}>
                    <span style={s.checkIcon}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                style={{ ...s.upgradeBtn, ...(plan.id === 'pro' ? s.upgradeBtnPrimary : {}) }}
                onClick={() => handleUpgrade(plan.id)}
                disabled={loadingPlan === plan.id}
              >
                {loadingPlan === plan.id ? 'Opening checkout…' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        <div style={s.footer}>
          <span style={s.securePay}>🔒 Secured by Razorpay · Cancel anytime</span>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,22,18,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 20 },
  modal: { background: '#faf7f2', borderRadius: 18, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', padding: '36px 32px', position: 'relative', boxShadow: '0 24px 64px rgba(15,13,10,0.3)' },
  closeBtn: { position: 'absolute', top: 18, right: 18, background: 'transparent', border: 'none', fontSize: 18, color: '#7a6e62', cursor: 'pointer' },
  header: { textAlign: 'center', marginBottom: 28 },
  icon: { fontSize: 32, marginBottom: 10 },
  title: { fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, color: '#1a1612', marginBottom: 8 },
  reason: { fontSize: 13, color: '#7a6e62', maxWidth: 380, margin: '0 auto', lineHeight: 1.5 },
  plansGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 },
  planCard: { background: '#fff', border: '1px solid #e0d8ca', borderRadius: 14, padding: '22px 20px', position: 'relative', display: 'flex', flexDirection: 'column' },
  planCardHighlight: { borderColor: '#d4860a', boxShadow: '0 4px 20px rgba(212,134,10,0.15)' },
  popularBadge: { position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#d4860a', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 10, letterSpacing: '0.5px' },
  planName: { fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: '#1a1612', marginBottom: 6 },
  planPrice: { fontSize: 28, fontWeight: 800, color: '#1a1612', marginBottom: 4, fontFamily: 'Playfair Display, serif' },
  planInterval: { fontSize: 13, fontWeight: 400, color: '#7a6e62' },
  planCredits: { fontSize: 12, color: '#d4860a', fontWeight: 600, marginBottom: 16 },
  featureList: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, flex: 1 },
  featureItem: { fontSize: 12, color: '#3d342b', display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.4 },
  checkIcon: { color: '#0f6e56', fontWeight: 700, flexShrink: 0 },
  upgradeBtn: { background: 'transparent', border: '1px solid #e0d8ca', color: '#1a1612', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  upgradeBtnPrimary: { background: '#1a1612', color: '#faf7f2', border: 'none' },
  footer: { textAlign: 'center' },
  securePay: { fontSize: 11, color: '#7a6e62' },
};
