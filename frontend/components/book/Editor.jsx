"use client";
import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { setContent, setFocusMode } from "../../store";
import { uploadsAPI, analyticsAPI } from "../../lib/api";
import {
  handleKeyboardShortcuts, SlashMenu, FloatingToolbar, ImageToolbar,
  insertTable, smartTypography,
} from "../editor/EditorExtensions";
import { s, PAGE_WORD_LIMIT, PAGE_CHAR_LIMIT } from "./styles";

const InlineComments = dynamic(() => import("../editor/InlineComments"), { ssr: false });

export default function Editor({
  bookId, editorRef, latestContentRef,
  focusMode, activeChapter, activePage, activeBook,
  isSaving, dailyGoal, currentWords, editorText, totalWords,
  rightPanel, setRightPanel, typewriterMode, setTypewriterMode,
  scheduleAutoSave, runAI, setShowDiff,
}) {
  const dispatch = useDispatch();

  const [selectedImg, setSelectedImg] = useState(null);
  const [slashMenu, setSlashMenu] = useState(null);
  const [copiedStyle, setCopiedStyle] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [prevWordCount, setPrevWordCount] = useState(0);
  const trackTimer = useRef(null);

  const scheduleTrack = () => {
    clearTimeout(trackTimer.current);
    trackTimer.current = setTimeout(() => {
      const text = editorRef.current?.innerText || "";
      const wc = text.trim().split(/\s+/).filter(Boolean).length;
      const added = Math.max(0, wc - prevWordCount);
      if (added > 0) {
        analyticsAPI.track({ bookId, wordsAdded: added }).catch(() => {});
        setPrevWordCount(wc);
      }
    }, 5000);
  };

  const handleEditorInput = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || "";
    const words = text.trim().split(/\s+/).filter(Boolean);
    const chars = text.length;

    if (words.length >= PAGE_WORD_LIMIT || chars >= PAGE_CHAR_LIMIT) {
      toast.error("Limit reached!");
      editorRef.current.innerHTML = latestContentRef.current;
      return;
    }

    latestContentRef.current = editorRef.current.innerHTML;
    dispatch(setContent(latestContentRef.current));
    scheduleAutoSave();
    scheduleTrack();
  };

  const handleEditorClick = (e) => {
    if (e.target.tagName === "IMG") setSelectedImg(e.target);
    else setSelectedImg(null);
  };

  const handleEditorKeyDown = (e) => {
    if (handleKeyboardShortcuts(e, editorRef.current)) return;

    if (e.key === "/") {
      const sel = window.getSelection();
      if (sel?.rangeCount) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const before = range.startContainer.textContent?.slice(0, range.startOffset) || "";
        if (!before.trim() || before.endsWith("\n")) {
          setTimeout(() => setSlashMenu({ x: rect.left, y: rect.bottom }), 10);
        }
      }
    } else if (e.key === "Escape") {
      setSlashMenu(null);
    } else if (slashMenu && e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Enter") {
      if (e.key.length !== 1) setSlashMenu(null);
    }
  };

  const executeSlashCmd = (cmd) => {
    setSlashMenu(null);
    const sel = window.getSelection();
    if (sel?.rangeCount) {
      const range = sel.getRangeAt(0);
      const node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const pos = range.startOffset;
        node.textContent = text.slice(0, pos - 1) + text.slice(pos);
        range.setStart(node, pos - 1);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    editorRef.current?.focus();
    if (cmd === "table") insertTable(3, 3);
    else if (cmd === "hr") {
      document.execCommand("insertHTML", false, '<hr style="border:none;border-top:2px solid #e0d8ca;margin:24px 0;"/><p><br></p>');
    } else if (cmd === "ul") document.execCommand("insertUnorderedList");
    else if (cmd === "ol") document.execCommand("insertOrderedList");
    else if (cmd === "quote") document.execCommand("formatBlock", false, "blockquote");
    else if (cmd === "code") document.execCommand("insertHTML", false, "<code>code</code>&nbsp;");
    else if (["h1", "h2", "h3", "p"].includes(cmd)) document.execCommand("formatBlock", false, cmd);
    scheduleAutoSave();
  };

  const fmt = (cmd) => {
    editorRef.current?.focus();
    if (["h1", "h2", "h3"].includes(cmd)) document.execCommand("formatBlock", false, cmd);
    else if (cmd === "quote") document.execCommand("formatBlock", false, "blockquote");
    else if (cmd === "code")
      document.execCommand("insertHTML", false, `<code>${window.getSelection()?.toString() || "code"}</code>`);
    else if (cmd === "table") insertTable(3, 3);
    else if (cmd === "ai-fix") runAI("fix-grammar");
    else document.execCommand(cmd);
    scheduleAutoSave();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const id = toast.loading("Uploading image…");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await uploadsAPI.uploadImage(fd);
      editorRef.current?.focus();
      document.execCommand(
        "insertHTML", false,
        `<img src="${data.url}" alt="image" data-public-id="${data.publicId}" style="max-width:100%;border-radius:8px;margin:12px 0;cursor:pointer;" />`,
      );
      toast.success("Image inserted — click image to resize/align", { id });
    } catch {
      toast.error("Upload failed", { id });
    }
    e.target.value = "";
  };

  const copyFormat = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      toast.error("Select text first to copy its formatting");
      return;
    }
    let node = selection.anchorNode;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    const computed = window.getComputedStyle(node);
    setCopiedStyle({
      fontWeight: computed.fontWeight,
      fontStyle: computed.fontStyle,
      textDecorationLine: computed.textDecorationLine,
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      fontSize: computed.fontSize,
      fontFamily: computed.fontFamily,
    });
    toast.success("Formatting copied!");
  };

  const pasteFormat = () => {
    if (!copiedStyle) {
      toast.error("No formatting copied yet!");
      return;
    }
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      toast.error("Select the target text to apply formatting");
      return;
    }
    const span = document.createElement("span");
    Object.assign(span.style, copiedStyle);
    const range = selection.getRangeAt(0);
    try {
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.addRange(newRange);
      handleEditorInput();
      toast.success("Formatting applied ✓");
    } catch (e) {
      toast.error("Could not apply formatting across multiple elements");
    }
  };

  return (
    <div style={s.editorArea}>
      {!focusMode && (
        <div style={s.toolbar}>
          {[["B", "bold", { fontWeight: 700 }], ["I", "italic", { fontStyle: "italic" }], ["U", "underline", { textDecoration: "underline" }]].map(
            ([l, c, st]) => (
              <button key={c} style={{ ...s.tbtn, ...st }} onClick={() => fmt(c)}>{l}</button>
            ),
          )}
          <span style={s.sep} />
          {[["H1", "h1"], ["H2", "h2"], ["H3", "h3"]].map(([l, c]) => (
            <button key={c} style={s.tbtn} onClick={() => fmt(c)}>{l}</button>
          ))}
          <span style={s.sep} />
          <button style={s.tbtn} onClick={() => fmt("insertUnorderedList")}>≡</button>
          <button style={s.tbtn} onClick={() => fmt("insertOrderedList")}>⒈</button>
          <button style={s.tbtn} onClick={() => fmt("quote")}>"</button>
          <button style={s.tbtn} onClick={() => fmt("code")}>{"{}"}</button>
          <button style={s.tbtn} title="Insert table" onClick={() => fmt("table")}>⊞</button>
          <span style={s.sep} />
          <label style={{ ...s.tbtn, cursor: "pointer" }} title="Upload image">
            🖼
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
          </label>
          <span style={s.sep} />
          <button style={s.tbtn} onClick={() => document.execCommand("undo")}>↩</button>
          <button style={s.tbtn} onClick={() => document.execCommand("redo")}>↪</button>
          <span style={{ marginLeft: "auto" }} />

          <button type="button" onClick={copyFormat} style={{ ...s.tbtn, fontSize: 10 }} title="Copy Text Formatting">
            🖌️ <span>Copy Format</span>
          </button>
          <button type="button" onClick={pasteFormat} disabled={!copiedStyle} style={{ ...s.tbtn, fontSize: 10 }} title="Apply Copied Formatting to Selected Text">
            📋 <span>Paste Format</span>
          </button>

          <button
            style={{ ...s.tbtn, fontSize: 10, ...(rightPanel === "versions" ? s.tbtnActive : {}) }}
            onClick={() => setRightPanel((p) => (p === "versions" ? "ai" : "versions"))}
          >
            🕘 History
          </button>
          <button
            style={{ ...s.tbtn, fontSize: 10, ...(rightPanel === "comments" ? s.tbtnActive : {}) }}
            onClick={() => {
              setRightPanel((p) => (p === "comments" ? "ai" : "comments"));
              setShowComments((p) => !p);
            }}
          >
            💬 Comments
          </button>
          <button style={{ ...s.tbtn, fontSize: 10 }} onClick={() => setShowDiff(true)}>⟺ Diff</button>
          <button
            style={{ ...s.tbtn, fontSize: 10, ...(typewriterMode ? s.tbtnActive : {}) }}
            onClick={() => setTypewriterMode((t) => !t)}
          >
            📜
          </button>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <FloatingToolbar onFormat={fmt} />

        {selectedImg && (
          <ImageToolbar img={selectedImg} onClose={() => setSelectedImg(null)} onChange={handleEditorInput} />
        )}

        {slashMenu && (
          <SlashMenu position={slashMenu} onSelect={executeSlashCmd} onClose={() => setSlashMenu(null)} />
        )}

        <div style={{ ...s.editorScroll, ...(focusMode ? s.editorScrollFocus : {}) }}>
          <div style={{ ...s.paper, ...(focusMode ? s.paperFocus : {}) }}>
            {!focusMode && (
              <div style={s.pageHeading}>{activeChapter?.title} — {activePage?.title}</div>
            )}
            <div
              id="inkwell-editor"
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="prose-editor"
              data-placeholder="Begin your story here… (type / for commands)"
              style={{ ...s.editor, ...(focusMode ? s.editorFocus : {}) }}
              onInput={handleEditorInput}
              onClick={handleEditorClick}
              onKeyDown={handleEditorKeyDown}
              onKeyUp={smartTypography}
            />
          </div>
        </div>

        {showComments && !focusMode && <InlineComments editorRef={editorRef} enabled={showComments} />}
      </div>

      <div style={s.statusBar}>
        <span>📝 {currentWords.toLocaleString()} words</span>
        <span>📄 {editorText.length.toLocaleString()} chars</span>
        {activeBook?.wordCountGoal > 0 && (
          <span>🎯 {Math.round((totalWords / activeBook.wordCountGoal) * 100)}% of goal</span>
        )}
        <span>☀️ {currentWords}/{dailyGoal} today</span>
        <span style={{ fontSize: 10, color: "#c0b5a8" }}>/ for commands · Ctrl+B/I/U · Ctrl+1/2/3</span>
        {focusMode && (
          <button style={s.exitFocusSmall} onClick={() => dispatch(setFocusMode(false))}>Exit Focus</button>
        )}
        <span style={{ marginLeft: "auto", fontStyle: "italic", color: isSaving ? "#d4860a" : "#7a6e62", fontSize: 11 }}>
          {isSaving ? "Saving…" : "All changes saved"}
        </span>
      </div>
    </div>
  );
}
