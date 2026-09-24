"use client";
import { s } from "./styles";

export default function Sidebar({
  chapters, pages, activeChapterId, activePageId,
  expandedChapters, setExpandedChapters,
  charactersCount, totalWords, totalPagesCount, dailyGoal, currentWords, todayProgress,
  openPage, handleAddPage, handleDeletePage, handleDeleteChapter,
  setShowAddChapter, setShowRename, setRenameVal, setChapterNotes, setShowChapterNotes,
}) {
  const toggleExpand = (chId) => setExpandedChapters((e) => ({ ...e, [chId]: !e[chId] }));

  return (
    <aside style={s.sidebar}>
      <div style={s.sideTop}>
        <span style={s.sideLabel}>Structure</span>
        <button style={s.addChBtn} onClick={() => setShowAddChapter(true)}>+ Ch</button>
      </div>

      <div style={s.sideScroll}>
        {chapters.map((ch) => (
          <div key={ch._id}>
            <div style={{ ...s.chRow, ...(activeChapterId === ch._id ? s.chRowActive : {}) }}>
              <span style={s.chChevron} onClick={() => toggleExpand(ch._id)}>
                {expandedChapters[ch._id] ? "▾" : "▸"}
              </span>
              <span style={s.chName} onClick={() => toggleExpand(ch._id)}>{ch.title}</span>
              <button
                style={s.chBtn}
                title="Notes"
                onClick={() => {
                  setChapterNotes(ch.notes || "");
                  setShowChapterNotes(true);
                }}
              >
                📝
              </button>
              <button
                style={s.chBtn}
                onClick={() => {
                  setShowRename({ type: "chapter", id: ch._id });
                  setRenameVal(ch.title);
                }}
              >
                ✎
              </button>
              <button style={s.chBtn} onClick={() => handleDeleteChapter(ch._id)}>✕</button>
            </div>

            {expandedChapters[ch._id] && (
              <div style={s.pagesList}>
                {(pages[ch._id] || []).map((pg) => (
                  <div key={pg._id} style={{ ...s.pageRow, ...(activePageId === pg._id ? s.pageRowActive : {}) }}>
                    <div style={{ display: "flex", alignItems: "center", flex: 1 }} onClick={() => openPage(ch._id, pg)}>
                      <span style={s.pageDot} />
                      <span style={s.pageName}>{pg.title}</span>
                      <span style={s.pageWords}>{pg.wordCount || 0}w</span>
                    </div>
                    <button style={s.chBtn} onClick={() => handleDeletePage(pg._id, ch._id)}>🗑</button>
                  </div>
                ))}
                <button style={s.addPageBtn} onClick={() => handleAddPage(ch._id)}>+ Page</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={s.sideStats}>
        <div style={s.statsGrid}>
          {[
            ["Words", totalWords > 999 ? (totalWords / 1000).toFixed(1) + "k" : totalWords],
            ["Pages", totalPagesCount],
            ["Chs", chapters.length],
            ["Cast", charactersCount],
          ].map(([l, v]) => (
            <div key={l} style={s.statBox}>
              <div style={s.statVal}>{v}</div>
              <div style={s.statLbl}>{l}</div>
            </div>
          ))}
        </div>

        {dailyGoal > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "rgba(250,247,242,0.35)", marginBottom: 3 }}>
              <span>Today's goal</span>
              <span>{currentWords}/{dailyGoal}</span>
            </div>
            <div style={{ background: "rgba(250,247,242,0.1)", borderRadius: 4, height: 4 }}>
              <div style={{ width: `${todayProgress}%`, background: "#d4860a", height: "100%", borderRadius: 4, transition: "width 0.4s" }} />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
