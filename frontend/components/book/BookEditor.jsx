"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  booksAPI, chaptersAPI, pagesAPI, aiAPI, charactersAPI, versionsAPI,
} from "../../lib/api";
import {
  setActiveBook, setChapters, addChapter, updateChapter, removeChapter,
  setPages, addPage, setActivePage, setContent, setSaving, setDirty,
  setActiveTab, addMessage, setAiLoading, setCharacters, removePage,
} from "../../store";
import { callAI } from "../../lib/aiCall";
import { useTypewriterMode } from "../editor/EditorExtensions";

import Header from "./Header";
import Sidebar from "./Sidebar";
import Editor from "./Editor";
import AIPanel from "./AIPanel";
import { s, AI_CONFIG } from "./styles";

const VersionDiff = dynamic(() => import("../version/VersionDiff"), { ssr: false });
const BookPreview = dynamic(() => import("../editor/BookPreview"), { ssr: false });
const CharacterManager = dynamic(() => import("../characters/CharacterManager"), { ssr: false });
const WritingAnalytics = dynamic(() => import("../analytics/WritingAnalytics"), { ssr: false });
const PlotBoard = dynamic(() => import("../plot/PlotBoard"), { ssr: false });

export default function BookEditor({ bookId }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const {
    activeBook, chapters, pages, activeChapterId, activePageId,
    isSaving, focusMode, activeTab,
  } = useSelector((st) => st.editor);
  const { list: characters } = useSelector((st) => st.characters);

  // ── Refs shared across Header / Sidebar / Editor / AIPanel ──
  const editorRef = useRef(null);
  const latestContentRef = useRef("");
  const activePageIdRef = useRef(null);
  const autoSaveTimer = useRef(null);

  // ── State that more than one section needs ──
  const [typewriterMode, setTypewriterMode] = useState(false);
  const [rightPanel, setRightPanel] = useState("ai"); // 'ai' | 'versions' — toggled by both Editor's toolbar and AIPanel's tabs
  const [dailyGoal] = useState(2000);

  // ── Modal state (modals rendered here, triggered from Sidebar/Header) ──
  const [showExport, setShowExport] = useState(false);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [showRename, setShowRename] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const [showChapterNotes, setShowChapterNotes] = useState(false);
  const [chapterNotes, setChapterNotes] = useState("");
  const [showDiff, setShowDiff] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState({});

  useTypewriterMode(editorRef, typewriterMode && activeTab === "write");

  // ── Load book/chapters/pages on mount ──
  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  const loadAll = async () => {
    try {
      const [bookRes, chRes] = await Promise.all([booksAPI.get(bookId), chaptersAPI.list(bookId)]);
      dispatch(setActiveBook(bookRes.data.book));
      const chs = chRes.data.chapters || [];
      dispatch(setChapters(chs));

      const exp = {};
      chs.forEach((c) => (exp[c._id] = true));
      setExpandedChapters(exp);

      await Promise.all([...chs.map((ch) => loadPages(ch._id)), loadCharacters()]);

      const currentPageId = activePageIdRef.current;
      if (currentPageId) {
        const allPages = Object.values(pages).flat();
        const matchingPage = allPages.find((p) => p._id === currentPageId);
        if (matchingPage) {
          const parentCh = chs.find((c) => pages[c._id]?.some((p) => p._id === currentPageId));
          if (parentCh) {
            openPage(parentCh._id, matchingPage);
            return;
          }
        }
      }
      if (chs.length > 0) {
        const { data } = await pagesAPI.list(chs[0]._id);
        if (data.pages?.length > 0) openPage(chs[0]._id, data.pages[0]);
      }
    } catch (err) {
      console.error("Load all failed", err);
      toast.error("Failed to load book structure");
      router.push("/dashboard");
    }
  };

  const loadPages = async (chapterId) => {
    try {
      const { data } = await pagesAPI.list(chapterId);
      dispatch(setPages({ chapterId, pages: data.pages || [] }));
    } catch {}
  };

  const loadCharacters = async () => {
    try {
      const { data } = await charactersAPI.list(bookId);
      dispatch(setCharacters(data.characters || []));
    } catch {}
  };

  // ── Save / navigation — used by Header (save now, back to library),
  //    Sidebar (page switching), Editor (autosave), AIPanel (version restore) ──
  const saveCurrentPage = useCallback(async () => {
    const pageId = activePageIdRef.current;
    if (!pageId) return;
    const content = latestContentRef.current;
    dispatch(setSaving(true));
    try {
      await pagesAPI.update(pageId, { content });
      dispatch(setDirty(false));
    } catch (err) {
      console.error("SAVE FAILED", err);
    } finally {
      dispatch(setSaving(false));
    }
  }, [dispatch]);

  const openPage = useCallback(
    async (chapterId, page) => {
      clearTimeout(autoSaveTimer.current);
      await saveCurrentPage();
      const { data } = await pagesAPI.get(page._id);
      activePageIdRef.current = page._id;
      dispatch(setActivePage({ chapterId, pageId: page._id }));
      const content = data.page?.content || "";
      latestContentRef.current = content;
      dispatch(setContent(content));
      if (editorRef.current) editorRef.current.innerHTML = content;
    },
    [saveCurrentPage, dispatch],
  );

  const scheduleAutoSave = useCallback(() => {
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => saveCurrentPage(), 1500);
  }, [saveCurrentPage]);

  useEffect(() => {
    const handleBeforeUnload = () => saveCurrentPage();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveCurrentPage]);

  useEffect(() => {
    return () => saveCurrentPage();
  }, [saveCurrentPage]);

  const handleBackToHome = async () => {
    try {
      if (editorRef.current) latestContentRef.current = editorRef.current.innerHTML;
      toast.loading("Saving changes before leaving...");
      await saveCurrentPage();
      toast.dismiss();
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to save work before exiting structural view:", error);
      toast.dismiss();
      toast.error("Could not save your changes. Please check your internet connection.");
    }
  };

  // ── AI trigger — used by Header's "AI Fix", Editor's toolbar "ai-fix"
  //    command, and AIPanel's tool buttons ──
  const runAI = async (mode, extra = {}) => {
    const text = window.getSelection()?.toString().trim() || editorRef.current?.innerText?.trim() || "";
    if (text.length < 5) {
      toast.error("Select or write some text first");
      return;
    }
    const cfg = AI_CONFIG(extra)[mode];
    if (!cfg) return;
    const fn = aiAPI[cfg.apiKey];
    const ctx = {
      bookId,
      genre: activeBook?.genre,
      bookTitle: activeBook?.title,
      characters: characters.slice(0, 6).map((c) => ({ name: c.name, role: c.role, personality: c.personality })),
      ...extra,
    };
    const msgId = Date.now() + Math.random();
    dispatch(addMessage({ id: msgId, type: "loading", label: cfg.label }));
    dispatch(setAiLoading(true));
    try {
      const data = await callAI(fn, { text, ...ctx }, dispatch);
      if (!data) {
        dispatch(setAiLoading(false));
        return;
      }
      dispatch(
        addMessage({
          id: msgId + 1,
          type: "suggestion",
          label: cfg.label,
          text: data.result,
          canApply: cfg.canApply,
          applyMode: cfg.mode,
        }),
      );
      const { analyticsAPI } = await import("../../lib/api");
      analyticsAPI.track({ bookId, aiUsed: true }).catch(() => {});
    } catch {
      dispatch(addMessage({ id: msgId + 1, type: "error", label: cfg.label, text: "AI request failed. Please try again." }));
    } finally {
      dispatch(setAiLoading(false));
    }
  };

//   const runAI = async (mode, extra = {}) => {
//   // 1. Extract selection or fallback editor text
//   const selectedText = window.getSelection()?.toString().trim();
//   const fullText = editorRef.current?.innerText?.trim() || "";
//   const text = selectedText || fullText;

//   if (text.length < 5) {
//     toast.error("Select or write at least 5 characters first");
//     return;
//   }

//   // 2. Resolve AI Configuration
//   const configMap = typeof AI_CONFIG === "function" ? AI_CONFIG(extra) : AI_CONFIG;
//   const cfg = configMap?.[mode];

//   if (!cfg) {
//     console.error(`AI mode "${mode}" not found in AI_CONFIG`);
//     return;
//   }

//   const fn = aiAPI[cfg.apiKey];
//   if (typeof fn !== "function") {
//     console.error(`API method "${cfg.apiKey}" does not exist on aiAPI`);
//     return;
//   }

//   // 3. Assemble complete payload
//   const payload = {
//     text,
//     bookId,
//     genre: activeBook?.genre || "",
//     bookTitle: activeBook?.title || "",
//     characters: (characters || []).slice(0, 6).map((c) => ({
//       name: c.name,
//       role: c.role,
//       personality: c.personality,
//     })),
//     ...extra,
//   };

//   const msgId = Date.now() + Math.random();
//   dispatch(addMessage({ id: msgId, type: "loading", label: cfg.label }));
//   dispatch(setAiLoading(true));

//   try {
//     // 4. Call API via wrapper
//     const response = await callAI(fn, payload, dispatch);
    
//     // Safely parse output whether returned as res.data or direct object
//     const resultText = response?.result || response?.data?.result || response?.data;

//     if (!resultText) {
//       return; // Handled by finally block
//     }

//     // 5. Append suggestion message
//     dispatch(
//       addMessage({
//         id: msgId + 1,
//         type: "suggestion",
//         label: cfg.label,
//         text: resultText,
//         canApply: cfg.canApply ?? true,
//         applyMode: cfg.mode || mode,
//       })
//     );

//     // Track analytics asynchronously
//     import("../../lib/api")
//       .then(({ analyticsAPI }) => {
//         analyticsAPI.track({ bookId, aiUsed: true }).catch(() => {});
//       })
//       .catch(() => {});
//   } catch (err) {
//     console.error("runAI execution error:", err);
//     dispatch(
//       addMessage({
//         id: msgId + 1,
//         type: "error",
//         label: cfg.label,
//         text: "AI request failed. Please try again.",
//       })
//     );
//   } finally {
//     dispatch(setAiLoading(false));
//   }
// };

  // ── Chapter / page CRUD — driven by Sidebar UI, handled here since the
  //    related modals (add chapter / rename / notes) render at this level ──
  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) return;
    try {
      const { data } = await chaptersAPI.create({ bookId, title: newChapterTitle.trim() });
      dispatch(addChapter(data.chapter));
      setExpandedChapters((e) => ({ ...e, [data.chapter._id]: true }));
      await loadPages(data.chapter._id);
      setNewChapterTitle("");
      setShowAddChapter(false);
      toast.success("Chapter created");
    } catch {
      toast.error("Failed to create chapter");
    }
  };

  const handleDeleteChapter = async (chId) => {
    if (!confirm("Delete this chapter and all its pages?")) return;
    try {
      await chaptersAPI.delete(chId);
      dispatch(removeChapter(chId));
      toast.success("Chapter deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleAddPage = async (chapterId) => {
    try {
      const { data } = await pagesAPI.create({ chapterId, bookId });
      dispatch(addPage(data.page));
      openPage(chapterId, data.page);
    } catch {
      toast.error("Failed to add page");
    }
  };

  const handleDeletePage = async (pageId, chapterId) => {
    const chapterPages = pages[chapterId] || [];
    if (chapterPages.length === 1) {
      toast.error("A chapter must contain at least one page.");
      return;
    }
    if (!confirm("Delete this page permanently?")) return;
    try {
      await pagesAPI.delete(pageId);
      dispatch(removePage(pageId));
      const remainingPages = chapterPages.filter((p) => p._id !== pageId);
      if (activePageId === pageId) openPage(chapterId, remainingPages[0]);
      toast.success("Page deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete page");
    }
  };

  const handleRename = async () => {
    if (!renameVal.trim() || !showRename) return;
    try {
      if (showRename.type === "chapter") {
        if (editorRef.current) latestContentRef.current = editorRef.current.innerHTML;
        await saveCurrentPage();
        const { data } = await chaptersAPI.update(showRename.id, { title: renameVal.trim() });
        dispatch(updateChapter(data.chapter));
      } else {
        await pagesAPI.update(showRename.id, { title: renameVal.trim() });
        if (activeChapterId) await loadPages(activeChapterId);
      }
      setShowRename(null);
      toast.success("Renamed successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to rename");
    }
  };

  const saveChapterNotes = async () => {
    if (!activeChapterId) return;
    try {
      const { data } = await chaptersAPI.update(activeChapterId, { notes: chapterNotes });
      dispatch(updateChapter(data.chapter));
      toast.success("Notes saved");
      setShowChapterNotes(false);
    } catch {
      toast.error("Failed to save notes");
    }
  };

  const handleExport = async (fmt) => {
    setShowExport(false);
    const toastId = toast.loading(`Preparing ${fmt}...`);
    try {
      let response, extension, mimeType;
      switch (fmt) {
        case "PDF": response = await booksAPI.exportPdf(bookId); extension = "pdf"; mimeType = "application/pdf"; break;
        case "DOCX": response = await booksAPI.exportDocx(bookId); extension = "docx"; mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"; break;
        case "EPUB": response = await booksAPI.exportEpub(bookId); extension = "epub"; mimeType = "application/epub+zip"; break;
        default: throw new Error("Unsupported format");
      }
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${activeBook?.title || "book"}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${fmt} exported successfully`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error(`Failed to export ${fmt}`, { id: toastId });
    }
  };

  // ── Computed values shared by Header / Sidebar / Editor ──
  const totalWords = Object.values(pages).flat().reduce((sum, p) => sum + (p.wordCount || 0), 0);
  const totalPagesCount = Object.values(pages).flat().length;
  const activeChapter = chapters.find((c) => c._id === activeChapterId);
  const activePage = Object.values(pages).flat().find((p) => p._id === activePageId);
  const editorText = editorRef.current?.innerText || "";
  const currentWords = editorText.trim().split(/\s+/).filter(Boolean).length;
  const todayProgress = Math.min(Math.round((currentWords / dailyGoal) * 100), 100);

  return (
    <div style={{ ...s.root, ...(focusMode ? s.rootFocus : {}) }}>
      <Header
        activeBook={activeBook}
        bookId={bookId}
        isSaving={isSaving}
        activeTab={activeTab}
        focusMode={focusMode}
        currentWords={currentWords}
        typewriterMode={typewriterMode}
        setTypewriterMode={setTypewriterMode}
        saveCurrentPage={saveCurrentPage}
        setShowPreview={setShowPreview}
        setShowExport={setShowExport}
        runAI={runAI}
        handleBackToHome={handleBackToHome}
      />

      <div style={s.workspace}>
        {activeTab === "write" && !focusMode && (
          <Sidebar
            chapters={chapters}
            pages={pages}
            activeChapterId={activeChapterId}
            activePageId={activePageId}
            expandedChapters={expandedChapters}
            setExpandedChapters={setExpandedChapters}
            charactersCount={characters.length}
            totalWords={totalWords}
            totalPagesCount={totalPagesCount}
            dailyGoal={dailyGoal}
            currentWords={currentWords}
            todayProgress={todayProgress}
            openPage={openPage}
            handleAddPage={handleAddPage}
            handleDeletePage={handleDeletePage}
            handleDeleteChapter={handleDeleteChapter}
            setShowAddChapter={setShowAddChapter}
            setShowRename={setShowRename}
            setRenameVal={setRenameVal}
            setChapterNotes={setChapterNotes}
            setShowChapterNotes={setShowChapterNotes}
          />
        )}

        <div style={s.mainArea}>
          {activeTab === "write" && (
            <Editor
              bookId={bookId}
              editorRef={editorRef}
              latestContentRef={latestContentRef}
              focusMode={focusMode}
              activeChapter={activeChapter}
              activePage={activePage}
              activeBook={activeBook}
              isSaving={isSaving}
              dailyGoal={dailyGoal}
              currentWords={currentWords}
              editorText={editorText}
              totalWords={totalWords}
              rightPanel={rightPanel}
              setRightPanel={setRightPanel}
              typewriterMode={typewriterMode}
              setTypewriterMode={setTypewriterMode}
              scheduleAutoSave={scheduleAutoSave}
              runAI={runAI}
              setShowDiff={setShowDiff}
            />
          )}

          {activeTab === "characters" && (
            <div style={s.tabContent}>
              <CharacterManager bookId={bookId} />
            </div>
          )}
          {activeTab === "plot" && (
            <div style={s.tabContent}>
              <PlotBoard />
            </div>
          )}
          {activeTab === "analytics" && (
            <div style={s.tabContent}>
              <WritingAnalytics bookId={bookId} wordCountGoal={activeBook?.wordCountGoal} />
            </div>
          )}
        </div>

        {activeTab === "write" && !focusMode && (
          <AIPanel
            bookId={bookId}
            activeBook={activeBook}
            editorRef={editorRef}
            latestContentRef={latestContentRef}
            activePageId={activePageId}
            rightPanel={rightPanel}
            setRightPanel={setRightPanel}
            runAI={runAI}
            scheduleAutoSave={scheduleAutoSave}
          />
        )}
      </div>

      {/* ── Modals ── */}
      {showExport && (
        <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && setShowExport(false)}>
          <div style={s.modal}>
            <h2 style={s.modalTitle}>Export Book</h2>
            <p style={{ fontSize: 13, color: "#7a6e62", marginBottom: 18 }}>
              All chapters merged with Table of Contents.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
              {[["PDF", "📄"], ["DOCX", "📝"], ["EPUB", "📚"]].map(([fmt, icon]) => (
                <div key={fmt} style={s.exportOpt} onClick={() => handleExport(fmt)}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{fmt}</div>
                </div>
              ))}
            </div>
            <button style={s.cancelBtn} onClick={() => setShowExport(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showAddChapter && (
        <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && setShowAddChapter(false)}>
          <div style={s.modal}>
            <h2 style={s.modalTitle}>New Chapter</h2>
            <input
              style={s.modalInput}
              placeholder="Chapter title…"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddChapter()}
              autoFocus
            />
            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={() => setShowAddChapter(false)}>Cancel</button>
              <button style={s.primaryBtn} onClick={handleAddChapter}>Create</button>
            </div>
          </div>
        </div>
      )}

      {showRename && (
        <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && setShowRename(null)}>
          <div style={s.modal}>
            <h2 style={s.modalTitle}>Rename {showRename.type === "chapter" ? "Chapter" : "Page"}</h2>
            <input
              style={s.modalInput}
              value={renameVal}
              onChange={(e) => setRenameVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
            />
            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={() => setShowRename(null)}>Cancel</button>
              <button style={s.primaryBtn} onClick={handleRename}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showChapterNotes && (
        <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && setShowChapterNotes(false)}>
          <div style={s.modal}>
            <h2 style={s.modalTitle}>Chapter Notes</h2>
            <p style={{ fontSize: 12, color: "#7a6e62", marginBottom: 10 }}>
              Private notes for this chapter — plot reminders, research, ideas.
            </p>
            <textarea
              style={{ ...s.modalInput, minHeight: 160, resize: "vertical", fontFamily: "DM Sans,sans-serif" }}
              value={chapterNotes}
              onChange={(e) => setChapterNotes(e.target.value)}
              placeholder="Plot outline, character motivations, research notes…"
            />
            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={() => setShowChapterNotes(false)}>Cancel</button>
              <button style={s.primaryBtn} onClick={saveChapterNotes}>Save Notes</button>
            </div>
          </div>
        </div>
      )}

      {showDiff && (
        <VersionDiff
          pageId={activePageId}
          onClose={() => setShowDiff(false)}
          onRestore={async (vId) => {
            const { data } = await versionsAPI.restore(vId);
            if (editorRef.current && data.content) {
              editorRef.current.innerHTML = data.content;
              scheduleAutoSave();
            }
          }}
        />
      )}

      {showPreview && <BookPreview bookId={bookId} onClose={() => setShowPreview(false)} />}
    </div>
  );
}
