"use client";
import { useDispatch } from "react-redux";
import { setActiveBook, setActiveTab, setFocusMode } from "../../store";
import { booksAPI } from "../../lib/api";
import { s, TABS } from "./styles";
import CreditBalance from "../subscription/CreditBalance";

export default function Header({
  activeBook, bookId, isSaving, activeTab, focusMode, currentWords,
  typewriterMode, setTypewriterMode,
  saveCurrentPage, setShowPreview, setShowExport, runAI, handleBackToHome,
}) {
  const dispatch = useDispatch();

  if (focusMode) {
    return (
      <div style={s.focusBar}>
        <div style={s.focusInfo}>
          <span style={s.focusTitle}>{activeBook?.title}</span>
          <span style={s.focusWords}>{currentWords.toLocaleString()} words</span>
        </div>
        <div style={s.focusControls}>
          <button style={s.focusToggle} onClick={() => setTypewriterMode((t) => !t)}>
            {typewriterMode ? "📜 Typewriter ON" : "📜 Typewriter"}
          </button>
          <button style={s.exitFocusBtn} onClick={() => dispatch(setFocusMode(false))}>
            ✕ Exit Focus
          </button>
        </div>
      </div>
    );
  }

  return (
    <header style={s.header}>
      <button style={s.backBtn} onClick={handleBackToHome}>
        ← Library
      </button>
      <input
        style={s.bookTitleInput}
        value={activeBook?.title || ""}
        onChange={(e) => {
          dispatch(setActiveBook({ ...activeBook, title: e.target.value }));
          clearTimeout(window._titleTimer);
          window._titleTimer = setTimeout(() => booksAPI.update(bookId, { title: e.target.value }), 800);
        }}
      />
      <div style={s.headerRight}>
        <span style={{ ...s.saveDot, background: isSaving ? "#f5d98a" : "#d4860a" }} />

        <button
          style={{ ...s.hBtn, background: "#d4860a", color: "#fff", fontWeight: "bold", border: "none", padding: "4px 12px", marginRight: "8px", borderRadius: "4px", cursor: "pointer" }}
          onClick={async () => { await saveCurrentPage(); }}
        >
          💾 Save Now
        </button>

        <div style={s.tabSwitcher}>
          {TABS.map((t) => (
            <button
              key={t.id}
              style={{ ...s.tabBtn, ...(activeTab === t.id ? s.tabBtnActive : {}) }}
              onClick={() => {
                if (activeTab === "write") saveCurrentPage();
                dispatch(setActiveTab(t.id));
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <button style={s.hBtn} onClick={() => dispatch(setFocusMode(true))} title="Focus mode">⛶</button>
        <button style={s.hBtn} onClick={() => setShowPreview(true)} title="Preview book">👁</button>
        <button style={s.hBtn} onClick={() => setShowExport(true)}>⬇ Export</button>
        <button
          style={{ ...s.hBtn, background: "#d4860a", border: "none", color: "#fff" }}
          onClick={() => runAI("fix-grammar")}
        >
          ✨ AI Fix
        </button>
        <CreditBalance dark={true} />
      </div>
    </header>
  );
}
