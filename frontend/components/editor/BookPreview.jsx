"use client";
import { useState, useEffect } from "react";
import { booksAPI } from "../../lib/api";

export default function BookPreview({ bookId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("preview"); // 'preview' | 'toc'
  const [currentChapter, setCurrentChapter] = useState(0);

  // console.log(data);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const { data: d } = await booksAPI.export(bookId);
      setData(d);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const generateTOC = () => {
    if (!data) return [];
    let pageNum = 1;
    return data.chapters.map((ch, ci) => {
      const entry = {
        chapter: ch.title,
        chapterNum: ci + 1,
        page: pageNum,
        pages: ch.pages.map((pg, pi) => ({
          title: pg.title,
          page: pageNum + pi,
        })),
      };
      pageNum += ch.pages.length;
      return entry;
    });
  };

  const totalWords = () => {
    if (!data) return 0;
    return data.chapters.reduce(
      (sum, ch) =>
        sum +
        ch.pages.reduce((s, pg) => {
          const div = document.createElement("div");
          div.innerHTML = pg.content;
          return s + div.innerText.trim().split(/\s+/).filter(Boolean).length;
        }, 0),
      0,
    );
  };

  const toc = generateTOC();

  return (
    <div
      style={s.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={s.modal}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <div style={s.tabs}>
              {[
                ["preview", "📖 Preview"],
                ["toc", "📋 Contents"],
              ].map(([v, l]) => (
                <button
                  key={v}
                  style={{ ...s.tab, ...(activeView === v ? s.tabActive : {}) }}
                  onClick={() => setActiveView(v)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <button style={s.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {loading ? (
          <div style={s.loading}>Loading book preview…</div>
        ) : !data ? (
          <div style={s.loading}>Failed to load preview</div>
        ) : (
          <>
            {/* TABLE OF CONTENTS */}
            {activeView === "toc" && (
              <div style={s.body}>
                <div style={s.tocBook}>
                  <div style={s.tocTitle}>{data.book.title}</div>
                  {data.book.description && (
                    <div style={s.tocSubtitle}>{data.book.description}</div>
                  )}
                  <div style={s.tocMeta}>
                    {data.chapters.length} chapters ·{" "}
                    {data.chapters.reduce((s, c) => s + c.pages.length, 0)}{" "}
                    pages · {totalWords().toLocaleString()} words
                  </div>

                  <div style={s.tocDivider} />

                  <div style={s.tocHeading}>Table of Contents</div>
                  {toc.map((entry, i) => (
                    <div key={i}>
                      <div
                        style={s.tocChapter}
                        onClick={() => {
                          setCurrentChapter(i);
                          setActiveView("preview");
                        }}
                      >
                        <span style={s.tocChNum}>{entry.chapterNum}.</span>
                        <span style={s.tocChTitle}>{entry.chapter}</span>
                        <span style={s.tocDots} />
                        <span style={s.tocPage}>{entry.page}</span>
                      </div>
                      {entry.pages.map((pg, pi) => (
                        <div key={pi} style={s.tocPage2}>
                          <span style={{ marginLeft: 20, color: "#7a6e62" }}>
                            ·
                          </span>
                          <span style={s.tocPageTitle}>{pg.title}</span>
                          <span style={s.tocDots} />
                          <span style={s.tocPage}>{pg.page}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BOOK PREVIEW */}
            {activeView === "preview" && (
              <div style={s.body}>
                {/* Chapter nav */}
                <div style={s.chapterNav}>
                  {data.chapters.map((ch, i) => (
                    <button
                      key={i}
                      style={{
                        ...s.chNavBtn,
                        ...(currentChapter === i ? s.chNavActive : {}),
                      }}
                      onClick={() => setCurrentChapter(i)}
                    >
                      Ch. {i + 1}
                    </button>
                  ))}
                </div>

                {/* Rendered chapter */}
                {/* <div style={s.bookPage}> */}
                <div style={s.bookContainer}>
                  {/* Cover page for first chapter */}
                  {currentChapter === 0 && (
                    <div style={s.chapterIntro}>
                      <div style={s.coverTitle}>{data.book.title}</div>
                      {data.book.description && (
                        <div style={s.coverDesc}>{data.book.description}</div>
                      )}
                      <div style={s.coverMeta}>
                        {data.book.genre} · {data.chapters.length} chapters
                      </div>
                    </div>
                  )}

                  <div style={s.chapterIntro}>
                    <div style={s.chapterNumber}>
                      CHAPTER {currentChapter + 1}
                    </div>

                    <div style={s.chapterName}>
                      {data.chapters[currentChapter]?.title}
                    </div>

                    <div style={s.chapterDivider} />
                  </div>

                  {data.chapters[currentChapter]?.pages.map((pg, i) => (
                    <div key={pg._id} style={s.bookPage}>
                      <div style={s.pageHeader}>{pg.title}</div>

                      <div
                        className="prose-editor"
                        style={s.pageContent}
                        dangerouslySetInnerHTML={{
                          __html: pg.content,
                        }}
                      />

                      <div style={s.pageFooter}>{pg.pageNumber || i + 1}</div>
                    </div>
                  ))}

                  {/* Chapter nav arrows */}
                  <div style={s.chapterArrows}>
                    <button
                      style={s.arrowBtn}
                      disabled={currentChapter === 0}
                      onClick={() => setCurrentChapter((c) => c - 1)}
                    >
                      ← Previous Chapter
                    </button>
                    <button
                      style={s.arrowBtn}
                      disabled={currentChapter === data.chapters.length - 1}
                      onClick={() => setCurrentChapter((c) => c + 1)}
                    >
                      Next Chapter →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(26,22,18,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5000,
    padding: 20,
  },
  modal: {
    background: "#faf7f2",
    borderRadius: 14,
    width: "100%",
    maxWidth: 800,
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(26,22,18,0.25)",
  },
  header: {
    padding: "12px 20px",
    borderBottom: "1px solid #e0d8ca",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0,
    background: "#f0ebe0",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  tabs: {
    display: "flex",
    gap: 4,
    background: "#e0d8ca",
    borderRadius: 8,
    padding: 3,
  },
  tab: {
    background: "transparent",
    border: "none",
    padding: "5px 14px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "DM Sans, sans-serif",
    color: "#7a6e62",
  },
  tabActive: { background: "#fff", color: "#1a1612" },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#7a6e62",
    fontSize: 18,
    cursor: "pointer",
  },
  loading: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#7a6e62",
    fontSize: 14,
  },
  body: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "32px 20px",
    background: "#eee8de",
  },
  // TOC styles
  tocBook: {
    background: "#fff",
    borderRadius: 12,
    padding: "48px 56px",
    width: "100%",
    maxWidth: 620,
    boxShadow: "0 4px 24px rgba(26,22,18,0.1)",
  },
  tocTitle: {
    fontFamily: "Playfair Display, serif",
    fontSize: 32,
    fontWeight: 700,
    color: "#1a1612",
    textAlign: "center",
    marginBottom: 10,
  },
  tocSubtitle: {
    fontSize: 15,
    color: "#7a6e62",
    textAlign: "center",
    marginBottom: 8,
    fontStyle: "italic",
  },
  tocMeta: {
    fontSize: 12,
    color: "#c0b5a8",
    textAlign: "center",
    marginBottom: 32,
  },
  tocDivider: { borderTop: "2px solid #e0d8ca", marginBottom: 28 },
  tocHeading: {
    fontFamily: "Playfair Display, serif",
    fontSize: 16,
    fontWeight: 700,
    color: "#1a1612",
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginBottom: 20,
    textAlign: "center",
  },
  tocChapter: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 8,
    cursor: "pointer",
    padding: "4px 0",
  },
  tocChNum: {
    fontFamily: "Playfair Display, serif",
    fontSize: 14,
    color: "#d4860a",
    fontWeight: 700,
    minWidth: 24,
  },
  tocChTitle: {
    fontFamily: "Playfair Display, serif",
    fontSize: 15,
    fontWeight: 600,
    color: "#1a1612",
  },
  tocDots: { flex: 1, borderBottom: "1px dotted #c0b5a8", marginBottom: 3 },
  tocPage: { fontSize: 13, color: "#7a6e62", minWidth: 24, textAlign: "right" },
  tocPage2: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 4,
  },
  tocPageTitle: { fontSize: 12, color: "#7a6e62" },
  // Preview styles
  chapterNav: {
    display: "flex",
    gap: 4,
    marginBottom: 20,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  chNavBtn: {
    background: "#fff",
    border: "1px solid #e0d8ca",
    color: "#7a6e62",
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 11,
    cursor: "pointer",
    fontFamily: "DM Sans, sans-serif",
  },
  chNavActive: { background: "#1a1612", color: "#faf7f2", border: "none" },
  bookPage: {
    background: "#fff",
    borderRadius: 12,
    padding: "52px 64px",
    width: "100%",
    maxWidth: 660,
    boxShadow: "0 4px 24px rgba(26,22,18,0.12)",
    minHeight: 600,
  },
  coverPage: {
    textAlign: "center",
    marginBottom: 48,
    paddingBottom: 40,
    borderBottom: "2px solid #e0d8ca",
  },
  coverTitle: {
    fontFamily: "Playfair Display, serif",
    fontSize: 36,
    fontWeight: 700,
    color: "#1a1612",
    marginBottom: 12,
  },
  coverDesc: {
    fontSize: 15,
    color: "#7a6e62",
    fontStyle: "italic",
    maxWidth: 400,
    margin: "0 auto 12px",
    lineHeight: 1.6,
  },
  coverMeta: { fontSize: 12, color: "#c0b5a8", textTransform: "capitalize" },
  chapterTitle: {
    fontFamily: "Playfair Display, serif",
    fontSize: 24,
    fontWeight: 700,
    color: "#1a1612",
    marginBottom: 28,
    paddingBottom: 16,
    borderBottom: "1px solid #f0ebe0",
  },
  pageContent: {
    fontFamily: "Playfair Display, serif",
    fontSize: 17,
    lineHeight: 1.9,
    color: "#1a1612",
    marginBottom: 24,
  },
  pageBreak: {
    textAlign: "center",
    color: "#c0b5a8",
    fontSize: 18,
    letterSpacing: 12,
    margin: "28px 0",
    userSelect: "none",
  },
  chapterArrows: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 40,
    paddingTop: 20,
    borderTop: "1px solid #f0ebe0",
  },
  arrowBtn: {
    background: "transparent",
    border: "1px solid #e0d8ca",
    color: "#7a6e62",
    padding: "7px 14px",
    borderRadius: 7,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "DM Sans, sans-serif",
    ":disabled": { opacity: 0.3 },
  },
  bookContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 15,
    alignItems: "center",
  },

  pageHeader: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 13,
    color: "#8a8178",
    letterSpacing: "1px",
    textTransform: "uppercase",
    marginBottom: 30,
    paddingBottom: 12,
    borderBottom: "1px solid #e5dfd6",
  },

  pageFooter: {
    marginTop: 40,
    textAlign: "center",
    color: "#999",
    fontSize: 14,
  },

  chapterIntro: {
    width: "100%",
    maxWidth: 660,
    background: "#fff",
    borderRadius: 12,
    padding: "80px 60px",
    textAlign: "center",
    boxShadow: "0 4px 24px rgba(26,22,18,0.12)",
    marginBottom: 5,
  },

  chapterNumber: {
    fontSize: 12,
    letterSpacing: "4px",
    textTransform: "uppercase",
    color: "#9a8f82",
    marginBottom: 20,
    fontWeight: 600,
  },

  chapterName: {
    fontFamily: "Playfair Display, serif",
    fontSize: 42,
    fontWeight: 700,
    color: "#1a1612",
    marginBottom: 30,
  },

  chapterDivider: {
    width: 80,
    height: 2,
    background: "#d4c4ae",
    margin: "0 auto",
  },
};
