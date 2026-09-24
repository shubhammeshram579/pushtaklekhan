'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { subscriptionAPI } from '../../lib/api';
import { setSubscriptionStatus } from '../../store';
import { loadRazorpay } from '../../lib/loadRazorpay';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function PricingPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, token } = useSelector(s => s.auth);
  const { plan: currentPlan } = useSelector(s => s.subscription);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(null);

  useEffect(() => { loadPlans(); }, []);

  const loadPlans = async () => {
    try {
      const { data } = await subscriptionAPI.getPlans();
      setPlans(data.plans);
    } catch { toast.error('Failed to load plans'); }
    finally { setLoading(false); }
  };

  const handleSelectPlan = async (planId) => {
    if (planId === 'free') { router.push('/dashboard'); return; }

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
            toast.success(`Welcome to ${data.plan.name}! 🎉`);
            router.push('/dashboard');
          } catch { toast.error('Payment succeeded but verification failed — contact support.'); }
        },
        modal: { ondismiss: () => setLoadingPlan(null) },
      });
      rzp.open();
    } catch { toast.error('Could not start checkout'); }
    finally { setLoadingPlan(null); }
  };

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=DM+Sans:wght@400;500;600&display=swap');
      `}</style>

      {/* Nav */}
      <nav style={s.nav}>
        <Link href="/" style={s.navLogo}><span style={s.quill}>✒</span> Pushtak<span style={s.quill}>lekhan</span></Link>
        <div style={s.navRight}>
          <Link href="/auth/login" style={s.navLink}>Sign in</Link>
          <Link href="/auth/register" style={s.navBtn}>Start free →</Link>
        </div>
      </nav>

      {/* Header */}
      <div style={s.header}>
        <div style={s.eyebrow}>Simple, credit-based pricing</div>
        <h1 style={s.title}>Pay for what you write,<br /><em>not what you might.</em></h1>
        <p style={s.subtitle}>
          Every plan includes the full editor, characters, plot board, and version history.
          Plans differ only in how many AI credits you get each month.
        </p>
      </div>

      {/* Plans */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#7a6e62' }}>Loading plans…</div>
      ) : (
        <div style={s.plansGrid}>
          {plans.map(plan => {
            const isCurrent = currentPlan === plan.id;
            const isPro = plan.id === 'pro';
            return (
              <div key={plan.id} style={{ ...s.planCard, ...(isPro ? s.planCardHighlight : {}) }}>
                {isPro && <div style={s.popularBadge}>Most popular</div>}
                <div style={s.planName}>{plan.name}</div>
                <div style={s.planPrice}>
                  {plan.price === 0 ? 'Free' : <>₹{plan.price}<span style={s.priceInterval}>/mo</span></>}
                </div>
                <div style={s.planCreditsBox}>
                  <span style={s.creditsNum}>{plan.aiCreditsPerMonth.toLocaleString()}</span>
                  <span style={s.creditsLabel}>AI credits / month</span>
                </div>
                <ul style={s.featureList}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={s.featureItem}><span style={s.check}>✓</span>{f}</li>
                  ))}
                </ul>
                <button
                  style={{ ...s.planBtn, ...(isPro ? s.planBtnPrimary : {}), ...(isCurrent ? s.planBtnCurrent : {}) }}
                  onClick={() => !isCurrent && handleSelectPlan(plan.id)}
                  disabled={isCurrent || loadingPlan === plan.id}
                >
                  {isCurrent ? 'Current plan' : loadingPlan === plan.id ? 'Opening checkout…' : plan.price === 0 ? 'Start free' : `Upgrade to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Credit cost table */}
      <div style={s.costSection}>
        <h2 style={s.costTitle}>What does a credit buy?</h2>
        <p style={s.costSub}>Every AI action costs a small, fixed number of credits — you always know what you're spending.</p>
        <div style={s.costTable}>
          {[
            ['✨ Fix Grammar', '1 credit'],
            ['🔍 Simplify', '1 credit'],
            ['📋 Summarize', '1 credit'],
            ['♻ Rewrite', '2 credits'],
            ['🔭 Expand', '2 credits'],
            ['🎭 Adjust Tone', '2 credits'],
            ['💡 Writer\'s Block Ideas', '2 credits'],
            ['💬 Custom Prompt', '2 credits'],
            ['➕ Continue Writing', '3 credits'],
            ['🖼️ Generate Images', '2 credits'],
          ].map(([action, cost]) => (
            <div key={action} style={s.costRow}>
              <span style={s.costAction}>{action}</span>
              <span style={s.costValue}>{cost}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={s.faqSection}>
        <h2 style={s.costTitle}>Questions</h2>
        <div style={s.faqGrid}>
          {[
            ['What happens when I run out of credits?', 'You can keep writing and using every non-AI feature. AI tools pause until your credits reset next month, or you upgrade instantly.'],
            ['Do unused credits roll over?', 'No — credits reset to your plan\'s monthly amount on your renewal date, so pricing stays predictable for us and for you.'],
            ['Can I cancel anytime?', 'Yes. Cancelling keeps your plan active until the end of your current billing period, then you drop to Free automatically.'],
            ['Is payment secure?', 'All payments are processed by Razorpay — we never see or store your card details.'],
          ].map(([q, a], i) => (
            <div key={i} style={s.faqItem}>
              <div style={s.faqQ}>{q}</div>
              <div style={s.faqA}>{a}</div>
            </div>
          ))}
        </div>
      </div>

      <footer style={s.footer}>
        <div style={s.footerLogo}><span style={s.quill}>✒</span> Pushtak<span style={s.quill}>lekhan</span></div>
        <div style={s.footerCopy}>© {new Date().getFullYear()} Pushtaklekhan</div>
      </footer>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#f8f4ed', fontFamily: 'DM Sans, sans-serif' },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 64 },
  navLogo: { fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#0f0d0a', textDecoration: 'none' },
  quill:{color: '#c8830a'},
  navRight: { display: 'flex', alignItems: 'center', gap: 16 },
  navLink: { fontSize: 14, color: '#6b5e4e', textDecoration: 'none' },
  navBtn: { background: '#0f0d0a', color: '#f8f4ed', padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' },
  header: { textAlign: 'center', padding: '56px 24px 40px', maxWidth: 700, margin: '0 auto' },
  eyebrow: { fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#c8830a', marginBottom: 16 },
  title: { fontFamily: 'Playfair Display, serif', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, color: '#0f0d0a', lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 18 },
  subtitle: { fontSize: 16, color: '#6b5e4e', lineHeight: 1.6, maxWidth: 520, margin: '0 auto' },
  plansGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 1080, margin: '0 auto', padding: '20px 24px 80px' },
  planCard: { background: '#fff', border: '1px solid #ddd3c0', borderRadius: 18, padding: '32px 28px', display: 'flex', flexDirection: 'column', position: 'relative' },
  planCardHighlight: { borderColor: '#c8830a', boxShadow: '0 12px 40px rgba(200,131,10,0.15)', transform: 'scale(1.03)' },
  popularBadge: { position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#c8830a', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 12, letterSpacing: '0.5px' },
  planName: { fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#0f0d0a', marginBottom: 8 },
  planPrice: { fontSize: 38, fontWeight: 900, color: '#0f0d0a', fontFamily: 'Playfair Display, serif', marginBottom: 4 },
  priceInterval: { fontSize: 15, fontWeight: 400, color: '#6b5e4e' },
  planCreditsBox: { display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 22, paddingBottom: 20, borderBottom: '1px solid #ede6d8' },
  creditsNum: { fontSize: 15, fontWeight: 700, color: '#c8830a' },
  creditsLabel: { fontSize: 12, color: '#6b5e4e' },
  featureList: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 26, flex: 1 },
  featureItem: { fontSize: 13, color: '#2a2218', display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.5 },
  check: { color: '#0d6b52', fontWeight: 700, flexShrink: 0 },
  planBtn: { background: 'transparent', border: '1.5px solid #ddd3c0', color: '#0f0d0a', padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  planBtnPrimary: { background: '#0f0d0a', color: '#f8f4ed', border: 'none' },
  planBtnCurrent: { opacity: 0.5, cursor: 'default' },
  costSection: { maxWidth: 640, margin: '0 auto', padding: '20px 24px 80px', textAlign: 'center' },
  costTitle: { fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 800, color: '#0f0d0a', marginBottom: 10 },
  costSub: { fontSize: 14, color: '#6b5e4e', marginBottom: 32, lineHeight: 1.6 },
  costTable: { background: '#fff', border: '1px solid #ddd3c0', borderRadius: 14, overflow: 'hidden', textAlign: 'left' },
  costRow: { display: 'flex', justifyContent: 'space-between', padding: '13px 24px', borderBottom: '1px solid #ede6d8' },
  costAction: { fontSize: 14, color: '#2a2218', fontWeight: 500 },
  costValue: { fontSize: 13, color: '#c8830a', fontWeight: 700 },
  faqSection: { maxWidth: 800, margin: '0 auto', padding: '20px 24px 90px', textAlign: 'center' },
  faqGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 32, textAlign: 'left' },
  faqItem: { background: '#fff', border: '1px solid #ddd3c0', borderRadius: 12, padding: '20px 22px' },
  faqQ: { fontSize: 14, fontWeight: 700, color: '#0f0d0a', marginBottom: 8 },
  faqA: { fontSize: 13, color: '#6b5e4e', lineHeight: 1.6 },
  footer: { textAlign: 'center', padding: '32px 24px', borderTop: '1px solid #ddd3c0' },
  footerLogo: { fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 700, color: '#0f0d0a', marginBottom: 6 },
  footerCopy: { fontSize: 12, color: '#a89b87' },
};
