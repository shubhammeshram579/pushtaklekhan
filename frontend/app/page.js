// 'use client';
// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';

// export default function Home() {
//   const router = useRouter();
//   useEffect(() => {
//     const token = typeof window !== 'undefined' ? localStorage.getItem('pushtaklekhan_token') : null;
//     router.replace(token ? '/dashboard' : '/auth/login');
//   }, [router]);
//   return (
//     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#faf7f2' }}>
//       <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: '#1a1612' }}>✒ pushtaklekhan</div>
//     </div>
//   );
// }


'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ── Typewriter hook ──
function useTypewriter(phrases, speed = 55, pause = 2200) {
  const [display, setDisplay] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  

  useEffect(() => {
    const current = phrases[phraseIdx];
    let timeout;
    if (!deleting && charIdx < current.length) {
      timeout = setTimeout(() => setCharIdx(i => i + 1), speed);
    } else if (!deleting && charIdx === current.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx(i => i - 1), speed / 2);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setPhraseIdx(i => (i + 1) % phrases.length);
    }
    setDisplay(current.slice(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, phraseIdx, phrases, speed, pause]);

  return display;
}

// ── Scroll animation hook ──
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const TYPEWRITER_PHRASES = [
  'Once upon a time in a city that forgot to sleep…',
  'The letter arrived on a Tuesday, unsigned…',
  'She had three days to finish the manuscript…',
  'Chapter One: The world ended quietly…',
  'He wrote the last line first, always…',
];

const FEATURES = [
  {
    icon: '✍️',
    title: 'Write without friction',
    desc: 'A distraction-free editor built for long-form work. Rich formatting, slash commands, keyboard shortcuts, and a focus mode that hides everything but the page.',
    tag: 'Editor',
  },
  {
    icon: '🧠',
    title: 'AI that reads the room',
    desc: 'Claude knows your genre, your characters, your tone. Fix grammar, rewrite passages, beat writer\'s block, or continue a scene — all without leaving the manuscript.',
    tag: 'AI Assistant',
  },
  {
    icon: '🎭',
    title: 'Your cast, always in context',
    desc: 'Build character profiles — personality, appearance, backstory, relationships. The AI reads them automatically so your characters stay consistent across chapters.',
    tag: 'Characters',
  },
  {
    icon: '🗂️',
    title: 'Plan your story visually',
    desc: 'A Kanban board for story arcs. Move plot cards from Ideas → Outline → Drafting → Editing → Done. See your whole story at a glance.',
    tag: 'Plot Board',
  },
  {
    icon: '🕘',
    title: 'Nothing is ever lost',
    desc: 'Auto-saves every 1.5 seconds. Named checkpoints before big rewrites. Word-level diff to compare any two versions. Restore with one click.',
    tag: 'Version History',
  },
  {
    icon: '📊',
    title: 'Track your momentum',
    desc: 'Daily word count charts, writing streaks, goal progress bars. See exactly how your book is growing — chapter by chapter, week by week.',
    tag: 'Analytics',
  },
];

const TESTIMONIALS = [
  {
    quote: 'I finished my first novel draft in four months using pushtaklekhan. The AI continuation feature got me through every block.',
    name: 'Priya R.',
    role: 'Fiction author, Mumbai',
    avatar: 'P',
  },
  {
    quote: 'The character system is what sold me. My cast of 24 characters stays consistent across 300 pages because the AI actually knows who they are.',
    name: 'Marcus T.',
    role: 'Fantasy writer, London',
    avatar: 'M',
  },
  {
    quote: 'I use it for technical documentation at work. The AI tone adjustment from storytelling to professional is brilliant.',
    name: 'Aisha K.',
    role: 'Technical writer, Nairobi',
    avatar: 'A',
  },
];

const STATS = [
  { value: '9', label: 'AI writing tools', sub: 'grammar, rewrite, continue, expand, simplify, tone, summarize, ideas, custom' },
  { value: '∞', label: 'Version history', sub: 'named checkpoints + auto-backups before every restore' },
  { value: '5', label: 'Export formats', sub: 'PDF · DOCX · ePub · TXT · with table of contents' },
];

const WORKFLOW_STEPS = [
  { step: '01', title: 'Create your book', desc: 'Set your genre, word count goal, and cover. pushtaklekhan structures your chapters and pages automatically.' },
  { step: '02', title: 'Build your world', desc: 'Add your characters with full profiles. Plan your story arc on the plot board. The AI reads all of it.' },
  { step: '03', title: 'Write every day', desc: 'Your editor is always waiting. Type /, use the floating toolbar, or let the AI continue where you left off.' },
  { step: '04', title: 'Ship the book', desc: 'Preview your full manuscript, generate the table of contents, and export in any format — professionally formatted.' },
];

export default function HomePage() {
  const typed = useTypewriter(TYPEWRITER_PHRASES);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);
 

  useScrollReveal();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);


  return (
    <>
      <style dangerouslySetInnerHTML={{ __html:`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink:         #0f0d0a;
          --ink-soft:    #2a2218;
          --ink-muted:   #6b5e4e;
          --parchment:   #f8f4ed;
          --parch-dark:  #ede6d8;
          --parch-darker:#ddd3c0;
          --gold:        #c8830a;
          --gold-light:  #fdf1d8;
          --gold-soft:   #f0c96a;
          --teal:        #0d6b52;
          --navy:        #121826;
          --font-serif:  'Playfair Display', Georgia, serif;
          --font-sans:   'DM Sans', system-ui, sans-serif;
          --font-mono:   'DM Mono', monospace;
        }

        html { scroll-behavior: smooth; }
        body { font-family: var(--font-sans); background: var(--parchment); color: var(--ink); overflow-x: hidden; }

        /* Reveal animations */
        [data-reveal] { opacity: 0; transform: translateY(28px); transition: opacity 0.65s ease, transform 0.65s ease; }
        [data-reveal].revealed { opacity: 1; transform: translateY(0); }
        [data-reveal-delay="1"] { transition-delay: 0.1s; }
        [data-reveal-delay="2"] { transition-delay: 0.2s; }
        [data-reveal-delay="3"] { transition-delay: 0.3s; }
        [data-reveal-delay="4"] { transition-delay: 0.4s; }

        /* Nav */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 48px; height: 64px;
          transition: background 0.3s ease, box-shadow 0.3s ease;
        }
        .nav.scrolled {
          background: rgba(248,244,237,0.95);
          backdrop-filter: blur(12px);
          box-shadow: 0 1px 0 rgba(15,13,10,0.08);
        }
        .nav-logo {
          font-family: var(--font-serif); font-size: 22px; font-weight: 700;
          color: var(--ink); letter-spacing: -0.5px; text-decoration: none;
          display: flex; align-items: center; gap: 8px;
        }
        .nav-logo .quill { color: var(--gold); }
        .nav-links { display: flex; align-items: center; gap: 32px; }
        .nav-link {
          font-size: 14px; color: var(--ink-muted); text-decoration: none;
          font-weight: 500; transition: color 0.2s;
        }
        .nav-link:hover { color: var(--ink); }
        .nav-cta { display: flex; align-items: center; gap: 10px; }
        .btn-ghost {
          padding: 8px 18px; border: 1px solid var(--parch-darker);
          border-radius: 8px; font-size: 14px; font-weight: 500;
          color: var(--ink-soft); background: transparent; cursor: pointer;
          font-family: var(--font-sans); text-decoration: none;
          transition: all 0.2s;
        }
        .btn-ghost:hover { border-color: var(--ink-muted); color: var(--ink); }
        .btn-primary {
          padding: 8px 20px; background: var(--ink);
          border: none; border-radius: 8px; font-size: 14px; font-weight: 600;
          color: var(--parchment); cursor: pointer; font-family: var(--font-sans);
          text-decoration: none; transition: all 0.2s;
        }
        .btn-primary:hover { background: var(--gold); }

        /* Hero */
        .hero {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 100px 24px 80px;
          background: radial-gradient(ellipse 80% 60% at 50% 30%, rgba(200,131,10,0.06) 0%, transparent 70%);
          text-align: center; position: relative;
        }
        .hero::before {
          content: ''; position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(200,131,10,0.06) 1px, transparent 1px);
          background-size: 32px 32px; pointer-events: none;
        }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 600; letter-spacing: 1.5px;
          text-transform: uppercase; color: var(--gold);
          background: var(--gold-light); border: 1px solid rgba(200,131,10,0.2);
          padding: 5px 14px; border-radius: 20px; margin-bottom: 28px;
        }
        .hero-eyebrow .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }

        .hero-headline {
          font-family: var(--font-serif); font-size: clamp(42px, 7vw, 88px);
          font-weight: 900; line-height: 1.04; letter-spacing: -2px;
          color: var(--ink); max-width: 900px; margin-bottom: 12px;
        }
        .hero-headline em { font-style: italic; color: var(--gold); }

        .hero-sub {
          font-size: clamp(16px, 2vw, 19px); color: var(--ink-muted);
          max-width: 520px; line-height: 1.65; margin: 20px auto 40px;
          font-weight: 400;
        }

        /* Typewriter block */
        .typewriter-block {
          font-family: var(--font-serif); font-size: clamp(15px, 1.8vw, 18px);
          color: var(--ink-soft); font-style: italic; line-height: 1.6;
          background: var(--gold-light); border-left: 3px solid var(--gold);
          padding: 14px 22px; border-radius: 0 10px 10px 0;
          max-width: 560px; margin: 0 auto 44px; text-align: left;
          min-height: 56px; display: flex; align-items: center;
        }
        .cursor {
          display: inline-block; width: 2px; height: 1.1em;
          background: var(--gold); margin-left: 2px;
          animation: blink 0.9s step-end infinite; vertical-align: text-bottom;
        }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }

        .hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .btn-hero {
          padding: 14px 32px; background: var(--ink); color: var(--parchment);
          border: none; border-radius: 10px; font-size: 15px; font-weight: 600;
          cursor: pointer; font-family: var(--font-sans); text-decoration: none;
          display: inline-flex; align-items: center; gap: 8px;
          transition: all 0.22s; letter-spacing: -0.2px;
        }
        .btn-hero:hover { background: var(--gold); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(200,131,10,0.25); }
        .btn-hero-ghost {
          padding: 14px 28px; background: transparent;
          border: 1.5px solid var(--parch-darker);
          border-radius: 10px; font-size: 15px; font-weight: 500;
          cursor: pointer; font-family: var(--font-sans); text-decoration: none;
          color: var(--ink-soft); display: inline-flex; align-items: center; gap: 8px;
          transition: all 0.22s;
        }
        .btn-hero-ghost:hover { border-color: var(--ink-muted); color: var(--ink); }

        .hero-note { font-size: 12px; color: var(--ink-muted); margin-top: 16px; }
        .hero-note span { color: var(--teal); font-weight: 600; }

        /* Scroll indicator */
        .scroll-hint {
          position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          color: var(--ink-muted); font-size: 11px; letter-spacing: 1px;
          text-transform: uppercase; animation: float 3s ease-in-out infinite;
        }
        @keyframes float { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-6px); } }
        .scroll-line { width: 1px; height: 32px; background: linear-gradient(to bottom, var(--ink-muted), transparent); }

        /* Stats band */
        .stats-band {
          background: var(--ink); padding: 48px 48px;
          display: flex; align-items: stretch; justify-content: center;
          gap: 0;
        }
        .stat-item {
          flex: 1; max-width: 320px; padding: 0 48px; text-align: center;
          border-right: 1px solid rgba(248,244,237,0.08);
        }
        .stat-item:last-child { border-right: none; }
        .stat-value {
          font-family: var(--font-serif); font-size: 52px; font-weight: 900;
          color: var(--gold-soft); line-height: 1; margin-bottom: 8px;
        }
        .stat-label { font-size: 14px; font-weight: 600; color: var(--parchment); margin-bottom: 6px; }
        .stat-sub { font-size: 11px; color: rgba(248,244,237,0.4); line-height: 1.5; max-width: 200px; margin: 0 auto; }

        /* Section commons */
        .section { padding: 96px 48px; max-width: 1160px; margin: 0 auto; }
        .section-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 2px;
          text-transform: uppercase; color: var(--gold); margin-bottom: 14px;
        }
        .section-title {
          font-family: var(--font-serif); font-size: clamp(28px, 4vw, 46px);
          font-weight: 800; line-height: 1.12; color: var(--ink);
          letter-spacing: -1px; max-width: 580px; margin-bottom: 18px;
        }
        .section-sub {
          font-size: 16px; color: var(--ink-muted); line-height: 1.7;
          max-width: 480px; margin-bottom: 56px;
        }

        /* Features grid */
        .features-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1px; background: var(--parch-darker);
          border: 1px solid var(--parch-darker); border-radius: 16px; overflow: hidden;
        }
        .feature-card {
          background: var(--parchment); padding: 36px 32px;
          transition: background 0.2s;
        }
        .feature-card:hover { background: var(--gold-light); }
        .feature-icon {
          width: 48px; height: 48px; border-radius: 12px;
          background: var(--ink); display: flex; align-items: center;
          justify-content: center; font-size: 22px; margin-bottom: 18px;
        }
        .feature-tag {
          font-size: 10px; font-weight: 700; letter-spacing: 1.2px;
          text-transform: uppercase; color: var(--gold); margin-bottom: 8px;
        }
        .feature-title {
          font-family: var(--font-serif); font-size: 20px; font-weight: 700;
          color: var(--ink); margin-bottom: 10px; line-height: 1.3;
        }
        .feature-desc { font-size: 14px; color: var(--ink-muted); line-height: 1.7; }

        /* Workflow */
        .workflow-section { background: var(--ink); padding: 96px 48px; }
        .workflow-inner { max-width: 1160px; margin: 0 auto; }
        .workflow-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 32px; margin-top: 56px; }
        .workflow-step {
          position: relative; padding: 28px 24px;
          border: 1px solid rgba(248,244,237,0.08);
          border-radius: 14px; background: rgba(248,244,237,0.03);
          transition: background 0.2s;
        }
        .workflow-step:hover { background: rgba(248,244,237,0.06); }
        .step-num {
          font-family: var(--font-mono); font-size: 12px; font-weight: 500;
          color: var(--gold-soft); letter-spacing: 1px; margin-bottom: 16px;
          opacity: 0.7;
        }
        .step-title {
          font-family: var(--font-serif); font-size: 18px; font-weight: 700;
          color: var(--parchment); margin-bottom: 10px; line-height: 1.3;
        }
        .step-desc { font-size: 13px; color: rgba(248,244,237,0.5); line-height: 1.7; }
        .step-connector {
          position: absolute; top: 50%; right: -17px;
          width: 32px; height: 1px; background: rgba(200,131,10,0.3); z-index: 1;
        }

        /* AI section */
        .ai-section { padding: 96px 48px; background: var(--parch-dark); }
        .ai-inner { max-width: 1160px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: center; }
        .ai-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 28px; }
        .ai-chip {
          display: flex; align-items: center; gap: 6px; padding: 7px 14px;
          background: var(--parchment); border: 1px solid var(--parch-darker);
          border-radius: 8px; font-size: 13px; font-weight: 500; color: var(--ink-soft);
          cursor: default; transition: all 0.2s;
        }
        .ai-chip:hover { border-color: var(--gold); color: var(--ink); background: var(--gold-light); }
        .ai-mockup {
          background: var(--ink); border-radius: 14px; padding: 24px;
          box-shadow: 0 24px 64px rgba(15,13,10,0.2);
        }
        .ai-mockup-top {
          display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
        }
        .mock-dot { width: 10px; height: 10px; border-radius: 50%; }
        .mock-title { font-size: 12px; font-weight: 600; color: rgba(248,244,237,0.4); margin-left: auto; }
        .mock-text {
          font-family: var(--font-serif); font-size: 15px; line-height: 1.8;
          color: rgba(248,244,237,0.8); margin-bottom: 16px;
        }
        .mock-text em { color: var(--gold-soft); font-style: normal; }
        .mock-suggestion {
          background: rgba(248,244,237,0.05); border: 1px solid rgba(200,131,10,0.3);
          border-radius: 10px; padding: 14px 16px; margin-bottom: 12px;
        }
        .mock-sugg-label { font-size: 10px; font-weight: 700; color: var(--gold-soft); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; }
        .mock-sugg-text { font-size: 13px; color: rgba(248,244,237,0.65); line-height: 1.6; }
        .mock-actions { display: flex; gap: 8px; }
        .mock-btn-apply { padding: 6px 14px; background: var(--teal); color: #fff; border: none; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; font-family: var(--font-sans); }
        .mock-btn-discard { padding: 6px 12px; background: transparent; color: rgba(248,244,237,0.4); border: 1px solid rgba(248,244,237,0.1); border-radius: 6px; font-size: 11px; cursor: pointer; font-family: var(--font-sans); }

        /* Testimonials */
        .testimonials-section { padding: 96px 48px; }
        .testimonials-inner { max-width: 1160px; margin: 0 auto; }
        .testimonials-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; margin-top: 52px; }
        .testimonial-card {
          background: #fff; border: 1px solid var(--parch-darker);
          border-radius: 14px; padding: 32px 28px;
          display: flex; flex-direction: column; gap: 20px;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .testimonial-card:hover { box-shadow: 0 8px 32px rgba(15,13,10,0.08); transform: translateY(-3px); }
        .testimonial-stars { color: var(--gold); font-size: 14px; letter-spacing: 2px; }
        .testimonial-quote {
          font-family: var(--font-serif); font-size: 16px; font-style: italic;
          color: var(--ink-soft); line-height: 1.7;
        }
        .testimonial-author { display: flex; align-items: center; gap: 12px; border-top: 1px solid var(--parch-dark); padding-top: 18px; }
        .author-avatar {
          width: 38px; height: 38px; border-radius: 50%; background: var(--ink);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-serif); font-size: 16px; color: var(--gold-soft); font-weight: 700; flex-shrink: 0;
        }
        .author-name { font-size: 14px; font-weight: 600; color: var(--ink); }
        .author-role { font-size: 12px; color: var(--ink-muted); }

        /* CTA section */
        .cta-section {
          margin: 0 48px 96px; border-radius: 20px;
          background: linear-gradient(135deg, var(--ink) 0%, var(--ink-soft) 100%);
          padding: 80px 64px; text-align: center; position: relative; overflow: hidden;
        }
        .cta-section::before {
          content: '✒'; position: absolute; font-size: 240px; right: -20px; top: -40px;
          opacity: 0.04; font-family: var(--font-serif); color: #fff; pointer-events: none;
          line-height: 1;
        }
        .cta-title {
          font-family: var(--font-serif); font-size: clamp(28px, 4vw, 52px);
          font-weight: 900; color: var(--parchment); letter-spacing: -1.5px;
          line-height: 1.08; margin-bottom: 16px;
        }
        .cta-title em { font-style: italic; color: var(--gold-soft); }
        .cta-sub { font-size: 16px; color: rgba(248,244,237,0.6); max-width: 400px; margin: 0 auto 36px; line-height: 1.6; }
        .cta-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .btn-cta {
          padding: 15px 34px; background: var(--gold); color: var(--ink);
          border: none; border-radius: 10px; font-size: 15px; font-weight: 700;
          cursor: pointer; font-family: var(--font-sans); text-decoration: none;
          display: inline-flex; align-items: center; gap: 8px;
          transition: all 0.22s;
        }
        .btn-cta:hover { background: var(--gold-soft); transform: translateY(-2px); }
        .btn-cta-outline {
          padding: 15px 28px; background: transparent;
          border: 1.5px solid rgba(248,244,237,0.2);
          border-radius: 10px; font-size: 15px; font-weight: 500;
          color: rgba(248,244,237,0.75); cursor: pointer; font-family: var(--font-sans);
          text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
          transition: all 0.22s;
        }
        .btn-cta-outline:hover { border-color: rgba(248,244,237,0.5); color: var(--parchment); }

        /* Footer */
        .footer { background: var(--ink); padding: 40px 48px; display: flex; align-items: center; justify-content: space-between; }
        .footer-logo { font-family: var(--font-serif); font-size: 18px; font-weight: 700; color: var(--parchment); }
        .footer-logo .quill { color: var(--gold); }
        .footer-links { display: flex; gap: 24px; }
        .footer-link { font-size: 13px; color: rgba(248,244,237,0.4); text-decoration: none; transition: color 0.2s; }
        .footer-link:hover { color: rgba(248,244,237,0.8); }
        .footer-copy { font-size: 12px; color: rgba(248,244,237,0.25); }

        @media (max-width: 900px) {
          .nav { padding: 0 20px; }
          .nav-links { display: none; }
          .section { padding: 64px 20px; }
          .features-grid { grid-template-columns: 1fr; }
          .workflow-grid { grid-template-columns: 1fr 1fr; }
          .workflow-step:nth-child(2) .step-connector,
          .workflow-step:nth-child(4) .step-connector { display: none; }
          .ai-inner { grid-template-columns: 1fr; }
          .testimonials-grid { grid-template-columns: 1fr; }
          .stats-band { flex-direction: column; gap: 32px; padding: 48px 20px; }
          .stat-item { border-right: none; border-bottom: 1px solid rgba(248,244,237,0.08); padding: 0 0 32px; }
          .stat-item:last-child { border-bottom: none; padding-bottom: 0; }
          .cta-section { margin: 0 20px 64px; padding: 56px 28px; }
          .footer { flex-direction: column; gap: 20px; text-align: center; }
          .footer-links { flex-wrap: wrap; justify-content: center; }
        }
      `}}/>

      {/* NAV */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        {/* <a href="/" className="nav-logo"><span className="quill">✒</span> pushtaklekhan</a> */}
        <a href="/" className="nav-logo"><span className="quill">✒</span>Pushtak<span className="quill ml-[-8px]">lekhan</span></a>
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How it works</a>
          <a href="#ai" className="nav-link">AI Assistant</a>
          <Link href="/pricing" className="nav-link">Pricing</Link>
        </div>
        <div className="nav-cta">
          <Link href="/auth/login" className="btn-ghost">Sign in</Link>
          <Link href="/auth/register" className="btn-primary">Start writing →</Link>
          {/* <Link href="/pricing" className="nav-link">Pricing</Link> */}
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" ref={heroRef}>
        <div className="hero-eyebrow">
          <span className="dot" />
          AI-Native Book Writing Platform
        </div>

        <h1 className="hero-headline">
          Write the book<br /><em>you've been circling.</em>
        </h1>

        <p className="hero-sub">
          pushtaklekhan is the writing studio where your story, your characters, and your AI assistant all live in one place — so you can stay in the manuscript.
        </p>

        {/* Typewriter */}
        <div className="typewriter-block">
          {typed}<span className="cursor" />
        </div>

        <div className="hero-actions">
          <Link href="/auth/register" className="btn-hero">Start your book — free →</Link>
          <Link href="/auth/login" className="btn-hero-ghost">Sign in</Link>
        </div>

        <p className="hero-note">No credit card required. <span>Powered by Gemini AI.</span></p>

        <div className="scroll-hint">
          <div className="scroll-line" />
          scroll
        </div>
      </section>

      {/* STATS BAND */}
      <div className="stats-band">
        {STATS.map((s, i) => (
          <div key={i} className="stat-item" data-reveal>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <section id="features" className="section">
        <div data-reveal>
          <div className="section-eyebrow">What's inside</div>
          <h2 className="section-title">Every tool a serious author needs</h2>
          <p className="section-sub">
            Built for long-form writing — not blog posts. pushtaklekhan handles the structure so you can handle the story.
          </p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card" data-reveal data-reveal-delay={String((i % 3) + 1)}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-tag">{f.tag}</div>
              <div className="feature-title">{f.title}</div>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="workflow-section">
        <div className="workflow-inner">
          <div data-reveal>
            <div className="section-eyebrow" style={{ color: 'var(--gold-soft)' }}>How it works</div>
            <h2 className="section-title" style={{ color: 'var(--parchment)' }}>
              From blank page to finished book
            </h2>
            <p className="section-sub" style={{ color: 'rgba(248,244,237,0.5)' }}>
              Four stages. No overwhelm.
            </p>
          </div>
          <div className="workflow-grid">
            {WORKFLOW_STEPS.map((step, i) => (
              <div key={i} className="workflow-step" data-reveal data-reveal-delay={String(i + 1)}>
                <div className="step-num">{step.step}</div>
                <div className="step-title">{step.title}</div>
                <p className="step-desc">{step.desc}</p>
                {i < WORKFLOW_STEPS.length - 1 && <div className="step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI SECTION */}
      <section id="ai" className="ai-section">
        <div className="ai-inner">
          <div data-reveal>
            <div className="section-eyebrow">AI Writing Assistant</div>
            <h2 className="section-title">An AI that actually knows your book</h2>
            <p className="section-sub">
              Unlike a generic chatbot, pushtaklekhan's AI has context: your genre, your characters' personalities, your writing style. Every suggestion fits the story you're already telling.
            </p>
            <div className="ai-chips">
              {['✨ Fix grammar','♻ Rewrite','➕ Continue writing','📋 Summarize','🔭 Expand','🔍 Simplify','🎭 Adjust tone','💡 Beat writer\'s block','💬 Custom prompt','🖼️ Generate Images'].map(c => (
                <div key={c} className="ai-chip">{c}</div>
              ))}
            </div>
          </div>

          {/* AI mockup */}
          <div data-reveal data-reveal-delay="2">
            <div className="ai-mockup">
              <div className="ai-mockup-top">
                <div className="mock-dot" style={{ background:'#ff5f57' }}/>
                <div className="mock-dot" style={{ background:'#febc2e' }}/>
                <div className="mock-dot" style={{ background:'#28c840' }}/>
                <span className="mock-title">AI Writing Assistant · Claude</span>
              </div>
              <div className="mock-text">
                Lyra opened her eyes. The dust motes hung suspended in their golden columns, and for a moment — just a moment — she could see the <em>silver threads of energy</em> that connected each particle to the next…
              </div>
              <div className="mock-suggestion">
                <div className="mock-sugg-label">✨ Grammar Fix · Suggestion</div>
                <div className="mock-sugg-text">
                  Lyra's eyes opened slowly. Dust motes hung suspended in golden columns of light, and for one breathless moment, she glimpsed the silver threads of energy connecting each particle to the next — to the walls, to her own heartbeat.
                </div>
              </div>
              <div className="mock-actions">
                <button className="mock-btn-apply">✓ Apply</button>
                <button className="mock-btn-discard">✗ Discard</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials-section">
        <div className="testimonials-inner">
          <div data-reveal>
            <div className="section-eyebrow">From writers</div>
            <h2 className="section-title">Built for authors who finish</h2>
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="testimonial-card" data-reveal data-reveal-delay={String(i + 1)}>
                <div className="testimonial-stars">★★★★★</div>
                <p className="testimonial-quote">"{t.quote}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{t.avatar}</div>
                  <div>
                    <div className="author-name">{t.name}</div>
                    <div className="author-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-section" data-reveal>
        <h2 className="cta-title">
          The first chapter<br /> is waiting to be <em>written.</em>
        </h2>
        <p className="cta-sub">
          Join authors who stopped planning and started writing. Your manuscript is one click away.
        </p>
        <div className="cta-actions">
          <Link href="/auth/register" className="btn-cta">Open your first book →</Link>
          <Link href="/auth/login" className="btn-cta-outline">Sign in</Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-logo"><span className="quill">✒</span> Pushtak<span className="quill">lekhan</span></div>
        <div className="footer-links">
          <a href="#features" className="footer-link">Features</a>
          <a href="#how-it-works" className="footer-link">How it works</a>
          <a href="#ai" className="footer-link">AI</a>
          <Link href="/auth/login" className="footer-link">Sign in</Link>
          <Link href="/auth/register" className="footer-link">Register</Link>
        </div>
        <div className="footer-copy">© {new Date().getFullYear()} pushtaklekhan · Built by Shubham Meshram</div>
      </footer>
    </>
  );
}
