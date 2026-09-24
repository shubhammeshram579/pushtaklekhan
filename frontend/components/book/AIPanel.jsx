// "use client";
// import { useState, useRef } from "react";
// import dynamic from "next/dynamic";
// import { useDispatch, useSelector } from "react-redux";
// import toast from "react-hot-toast";
// import { addMessage, setAiLoading } from "../../store";
// import { aiAPI } from "../../lib/api";
// import { s, AI_TOOLS, TONES, WRITERS_BLOCK_TYPES } from "./styles";

// const VersionHistory = dynamic(() => import("../version/VersionHistory"), { ssr: false });

// export default function AIPanel({
//   bookId, activeBook, editorRef, activePageId,
//   rightPanel, setRightPanel, runAI, scheduleAutoSave,
// }) {
//   const dispatch = useDispatch();
//   const { messages, loading: aiLoading } = useSelector((st) => st.ai);
//   const { list: characters } = useSelector((st) => st.characters);

//   console.log("messages",messages)
//   console.log("characters",characters)

//   const [aiPrompt, setAiPrompt] = useState("");
//   const [showToneMenu, setShowToneMenu] = useState(false);
//   const [showWBMenu, setShowWBMenu] = useState(false);
//   const [isImageMode, setIsImageMode] = useState(false);
//   const [showImgMenu, setShowImgMenu] = useState(false);
//   const aiOutputRef = useRef(null);

//   const scrollAI = () =>
//     setTimeout(() => {
//       if (aiOutputRef.current) aiOutputRef.current.scrollTop = aiOutputRef.current.scrollHeight;
//     }, 60);

//   const applyAppliedStateLocally = (msgId) => {
//     dispatch(addMessage({ id: msgId, _applied: true }));
//   };

//   const applySuggestion = (msg) => {
//     if (!editorRef.current) return;

//     if (msg.isImage || msg.imageUrl || msg.applyMode === "image") {
//       const imgUrl = msg.imageUrl || msg.text;
//       if (!imgUrl) {
//         toast.error("No valid image URL found.");
//         return;
//       }
//       const imgHtml = `<img src="${imgUrl}" alt="AI generated art" style="max-width:100%;border-radius:8px;margin:12px 0;cursor:pointer;" /><p><br></p>`;
//       editorRef.current.focus();
//       document.execCommand("insertHTML", false, imgHtml);
//       toast.success("Image applied to editor ✓");
//       return;
//     }

//     if (msg.applyMode === "append") {
//       const p = document.createElement("p");
//       p.textContent = msg.text;
//       editorRef.current.appendChild(p);
//     } else {
//       const sel = window.getSelection();
//       if (sel?.toString().trim()) {
//         const range = sel.getRangeAt(0);
//         range.deleteContents();
//         range.insertNode(document.createTextNode(msg.text));
//       } else {
//         editorRef.current.innerHTML = msg.text.replace(/\n/g, "<br>");
//       }
//     }
//     toast.success("Applied ✓");
//   };

//   const sendCustomPrompt = async () => {
//     if (!aiPrompt.trim()) return;
//     const prompt = aiPrompt.trim();
//     setAiPrompt("");
//     setShowImgMenu(false);
//     dispatch(addMessage({ id: Date.now(), type: "user", text: prompt }));

//     if (isImageMode) {
//       const loadingId = Date.now() + Math.random();
//       dispatch(addMessage({ id: loadingId, type: "loading", label: "🎨 Generating Image..." }));
//       dispatch(setAiLoading(true));
//       scrollAI();
//       try {
//         const response = await aiAPI.generateImage({ prompt, bookId, timeout: 60000 });
//         const rawImage = response?.data?.data?.imageBase64 || response?.data?.imageBase64;
//         if (rawImage) {
//           const fullBase64Url = rawImage.startsWith("data:image") ? rawImage : `data:image/jpeg;base64,${rawImage}`;
//           dispatch(
//             addMessage({
//               id: Date.now() + Math.random(),
//               type: "assistant",
//               label: "🎨 Generated Image",
//               text: fullBase64Url,
//               imageUrl: fullBase64Url,
//               isImage: true,
//               canApply: true,
//               applyMode: "image",
//             }),
//           );
//         } else {
//           throw new Error("No image data returned");
//         }
//       } catch (err) {
//         console.error("Image Generation Error:", err);
//         dispatch(addMessage({ type: "error", text: "Failed to generate image. Please try again." }));
//       } finally {
//         dispatch(setAiLoading(false));
//         setIsImageMode(false);
//         scrollAI();
//       }
//       return;
//     }

//     dispatch(setAiLoading(true));
//     scrollAI();
//     try {
//       const { data } = await aiAPI.custom({
//         prompt,
//         context: editorRef.current?.innerText?.slice(0, 800),
//         bookId,
//         genre: activeBook?.genre,
//         bookTitle: activeBook?.title,
//         characters: characters.slice(0, 5).map((c) => ({ name: c.name, role: c.role, personality: c.personality })),
//       });
//       dispatch(addMessage({ type: "assistant", text: data.result }));
//     } catch {
//       dispatch(addMessage({ type: "error", text: "AI request failed." }));
//     } finally {
//       dispatch(setAiLoading(false));
//       scrollAI();
//     }
//   };

//   return (
//     <aside style={s.aiPanel}>
//       <div style={s.panelTabs}>
//         {[["ai", "🤖 AI"], ["versions", "🕘 Versions"]].map(([v, l]) => (
//           <button
//             key={v}
//             style={{ ...s.panelTab, ...(rightPanel === v ? s.panelTabActive : {}) }}
//             onClick={() => setRightPanel(v)}
//           >
//             {l}
//           </button>
//         ))}
//       </div>

//       {rightPanel === "ai" && (
//         <>
//           <div style={s.aiHeader}>
//             <div style={s.aiOrb}><div style={s.aiOrbInner} /></div>
//             <div>
//               <div style={s.aiTitle}>AI Assistant</div>
//               <div style={s.aiSub}>Context-aware · Claude</div>
//             </div>
//           </div>

//           <div style={s.aiTools}>
//             {AI_TOOLS.map(([icon, label, mode]) => (
//               <button
//                 key={mode}
//                 style={s.aiToolBtn}
//                 onClick={() => {
//                   if (mode === "tone-menu") { setShowToneMenu((t) => !t); setShowWBMenu(false); return; }
//                   if (mode === "writers-block") { setShowWBMenu((t) => !t); setShowToneMenu(false); return; }
//                   setShowToneMenu(false);
//                   setShowWBMenu(false);
//                   runAI(mode);
//                 }}
//               >
//                 <span>{icon}</span>
//                 <span style={{ fontSize: 9, marginTop: 2 }}>{label}</span>
//               </button>
//             ))}
//           </div>

//           {showToneMenu && (
//             <div style={s.subMenu}>
//               <div style={s.subMenuTitle}>Select tone</div>
//               {TONES.map((t) => (
//                 <button key={t} style={s.subMenuBtn} onClick={() => { runAI("tone", { tone: t }); setShowToneMenu(false); }}>
//                   {t.charAt(0).toUpperCase() + t.slice(1)}
//                 </button>
//               ))}
//             </div>
//           )}

//           {showWBMenu && (
//             <div style={s.subMenu}>
//               <div style={s.subMenuTitle}>Idea type</div>
//               {WRITERS_BLOCK_TYPES.map((t) => (
//                 <button key={t.id} style={s.subMenuBtn} onClick={() => { runAI("writers-block", { type: t.id }); setShowWBMenu(false); }}>
//                   {t.label}
//                 </button>
//               ))}
//             </div>
//           )}

//           <div style={s.aiOutput} ref={aiOutputRef}>
//             {messages.length === 0 && (
//               <div style={s.welcomeBubble}>
//                 <div style={s.bLabel}>Welcome</div>
//                 <div style={s.bText}>
//                   Select text and use the tools above, or type a prompt below. I have full context of your book,
//                   genre, and characters. Never auto-replaces — you always approve.
//                 </div>
//               </div>
//             )}

//             {messages.map((msg, i) => {
//               if (msg.type === "loading") {
//                 return (
//                   <div key={msg.id || i} style={s.bubble}>
//                     <div style={s.bLabel}>{msg.label}</div>
//                     <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
//                       {[0, 1, 2].map((k) => (
//                         <div key={k} style={{ width: 6, height: 6, borderRadius: "50%", background: "#d4860a", opacity: 0.6 }} />
//                       ))}
//                     </div>
//                   </div>
//                 );
//               }
//               if (msg.type === "user") {
//                 return (
//                   <div key={msg.id || i} style={{ ...s.bubble, background: "#f0ebe0", borderLeft: "3px solid #d4860a" }}>
//                     <div style={s.bLabel}>You</div>
//                     <div style={s.bText}>{msg.text}</div>
//                   </div>
//                 );
//               }
//               const isImageMsg = msg.isImage || !!msg.imageUrl;
//               const imageUrl = msg.imageUrl || (isImageMsg ? msg.text : null);
//               return (
//                 <div key={msg.id || i} style={{ ...s.bubble, borderLeft: msg.type === "error" ? "3px solid #993c1d" : "3px solid #0f6e56" }}>
//                   <div style={s.bLabel}>{msg.label || "💬 Assistant"}</div>
//                   {isImageMsg ? (
//                     <div style={{ position: "relative", marginTop: 8 }}>
//                       <a
//                         href={imageUrl}
//                         download="generated-cover.jpg"
//                         title="Download Image"
//                         style={{ position: "absolute", top: 10, right: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", color: "#fff", borderRadius: "50%", textDecoration: "none", fontSize: 18, zIndex: 10, cursor: "pointer" }}
//                       >
//                         ⬇
//                       </a>
//                       <img
//                         src={imageUrl}
//                         alt="Generated Art"
//                         crossOrigin="anonymous"
//                         style={{ width: "100%", maxHeight: "320px", objectFit: "contain", borderRadius: "8px", border: "1px solid #e2d9c8", display: "block" }}
//                       />
//                     </div>
//                   ) : (
//                     <div style={s.bText}>{msg.text}</div>
//                   )}

//                   {(msg.canApply || isImageMsg) && !msg._applied && (
//                     <div style={s.bActions}>
//                       <button
//                         style={s.applyBtn}
//                         onClick={() => { applySuggestion(msg); applyAppliedStateLocally(msg.id); }}
//                       >
//                         ✓ Apply
//                       </button>
//                       <button style={s.discardBtn} onClick={() => applyAppliedStateLocally(msg.id)}>✗</button>
//                     </div>
//                   )}

//                   {msg._applied && (
//                     <div style={{ fontSize: 10, color: "#0f6e56", fontWeight: 600, marginTop: 6 }}>Applied ✓</div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>

//           {isImageMode && (
//             <div style={{ alignSelf: "flex-start", backgroundColor: "#e3f2fd", color: "#0d47a1", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
//               🎨 Image Generation Mode
//               <span style={{ cursor: "pointer", fontWeight: "bold" }} onClick={() => setIsImageMode(false)}>✕</span>
//             </div>
//           )}

//           <div style={s.aiInputRow}>
//             <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
//               <button
//                 type="button"
//                 style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#666", padding: "0 8px" }}
//                 onClick={() => setShowImgMenu(!showImgMenu)}
//               >
//                 +
//               </button>
//               {showImgMenu && (
//                 <div style={{ position: "absolute", bottom: "40px", left: "0", backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 10, minWidth: "160px" }}>
//                   <button
//                     type="button"
//                     style={{ width: "100%", padding: "10px 12px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}
//                     onClick={() => { setIsImageMode(true); setShowImgMenu(false); }}
//                   >
//                     🎨 Generate Image
//                   </button>
//                 </div>
//               )}
//             </div>

//             <textarea
//               style={s.aiInput}
//               value={aiPrompt}
//               placeholder={isImageMode ? "Describe the scene illustration you want..." : "Ask the AI anything…"}
//               onChange={(e) => setAiPrompt(e.target.value)}
//               onKeyDown={(e) => {
//                 if (e.key === "Enter" && !e.shiftKey) {
//                   e.preventDefault();
//                   sendCustomPrompt();
//                 }
//               }}
//               rows={2}
//             />
//             <button style={s.sendBtn} onClick={sendCustomPrompt}>→</button>
//           </div>
//         </>
//       )}

//       {rightPanel === "versions" && (
//         <VersionHistory
//           pageId={activePageId}
//           onRestore={(content) => {
//             if (editorRef.current) {
//               editorRef.current.innerHTML = content;
//               scheduleAutoSave();
//             }
//           }}
//         />
//       )}
//     </aside>
//   );
// }


"use client";
import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { addMessage, setAiLoading, setContent } from "../../store";
import { aiAPI } from "../../lib/api";
import { s, AI_TOOLS, TONES, WRITERS_BLOCK_TYPES } from "./styles";

const VersionHistory = dynamic(() => import("../version/VersionHistory"), { ssr: false });

export default function AIPanel({
  bookId, activeBook, editorRef, activePageId,
  rightPanel, setRightPanel, runAI, scheduleAutoSave, latestContentRef,
}) {
  const dispatch = useDispatch();
  const { messages, loading: aiLoading } = useSelector((st) => st.ai);
  const { list: characters } = useSelector((st) => st.characters);

  const [aiPrompt, setAiPrompt] = useState("");
  const [showToneMenu, setShowToneMenu] = useState(false);
  const [showWBMenu, setShowWBMenu] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false);
  const [showImgMenu, setShowImgMenu] = useState(false);
  const aiOutputRef = useRef(null);

  const scrollAI = () =>
    setTimeout(() => {
      if (aiOutputRef.current) aiOutputRef.current.scrollTop = aiOutputRef.current.scrollHeight;
    }, 60);

  const applyAppliedStateLocally = (msgId) => {
    dispatch(addMessage({ id: msgId, _applied: true }));
  };

  const applySuggestion = (msg) => {
    if (!editorRef.current) return;

    if (msg.isImage || msg.imageUrl || msg.applyMode === "image") {
      const imgUrl = msg.imageUrl || msg.text;
      if (!imgUrl) {
        toast.error("No valid image URL found.");
        return;
      }
      const imgHtml = `<img src="${imgUrl}" alt="AI generated art" style="max-width:100%;border-radius:8px;margin:12px 0;cursor:pointer;" /><p><br></p>`;
      editorRef.current.focus();
      document.execCommand("insertHTML", false, imgHtml);

      // --- CRITICAL PERSISTENCE FIX ---
      // Update local content state and schedule auto-save to persist in DB
      if (latestContentRef) {
        latestContentRef.current = editorRef.current.innerHTML;
        dispatch(setContent(latestContentRef.current));
      }
      if (typeof scheduleAutoSave === "function") {
        scheduleAutoSave();
      }

      toast.success("Image applied to editor ✓");
      return;
    }

    if (msg.applyMode === "append") {
      const p = document.createElement("p");
      p.textContent = msg.text;
      editorRef.current.appendChild(p);
    } else {
      const sel = window.getSelection();
      if (sel?.toString().trim()) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(msg.text));
      } else {
        editorRef.current.innerHTML = msg.text.replace(/\n/g, "<br>");
      }
    }

    // Trigger auto-save on text insertion
    if (latestContentRef) {
      latestContentRef.current = editorRef.current.innerHTML;
      dispatch(setContent(latestContentRef.current));
    }
    if (typeof scheduleAutoSave === "function") {
      scheduleAutoSave();
    }

    toast.success("Applied ✓");
  };

  const sendCustomPrompt = async () => {
    if (!aiPrompt.trim()) return;
    const prompt = aiPrompt.trim();
    setAiPrompt("");
    setShowImgMenu(false);
    dispatch(addMessage({ id: Date.now(), type: "user", text: prompt }));

    if (isImageMode) {
      const loadingId = Date.now() + Math.random();
      dispatch(addMessage({ id: loadingId, type: "loading", label: "🎨 Generating Image..." }));
      dispatch(setAiLoading(true));
      scrollAI();
      try {
        const response = await aiAPI.generateImage({ prompt, bookId, timeout: 60000 });
        
        // Retrieve Cloudinary URL from API response
        const hostedUrl = response?.data?.data?.url || response?.data?.url;

        if (hostedUrl) {
          dispatch(
            addMessage({
              id: Date.now() + Math.random(),
              type: "assistant",
              label: "🎨 Generated Image",
              text: hostedUrl,
              imageUrl: hostedUrl,
              isImage: true,
              canApply: true,
              applyMode: "image",
            })
          );
        } else {
          throw new Error("No image URL returned");
        }
      } catch (err) {
        console.error("Image Generation Error:", err);
        dispatch(addMessage({ type: "error", text: "Failed to generate image. Please try again." }));
      } finally {
        dispatch(setAiLoading(false));
        setIsImageMode(false);
        scrollAI();
      }
      return;
    }

    dispatch(setAiLoading(true));
    scrollAI();
    try {
      const { data } = await aiAPI.custom({
        prompt,
        context: editorRef.current?.innerText?.slice(0, 800),
        bookId,
        genre: activeBook?.genre,
        bookTitle: activeBook?.title,
        characters: characters.slice(0, 5).map((c) => ({ name: c.name, role: c.role, personality: c.personality })),
      });
      dispatch(addMessage({ type: "assistant", text: data.result }));
    } catch {
      dispatch(addMessage({ type: "error", text: "AI request failed." }));
    } finally {
      dispatch(setAiLoading(false));
      scrollAI();
    }
  };

  return (
    <aside style={s.aiPanel}>
      <div style={s.panelTabs}>
        {[["ai", "🤖 AI"], ["versions", "🕘 Versions"]].map(([v, l]) => (
          <button
            key={v}
            style={{ ...s.panelTab, ...(rightPanel === v ? s.panelTabActive : {}) }}
            onClick={() => setRightPanel(v)}
          >
            {l}
          </button>
        ))}
      </div>

      {rightPanel === "ai" && (
        <>
          <div style={s.aiHeader}>
            <div style={s.aiOrb}><div style={s.aiOrbInner} /></div>
            <div>
              <div style={s.aiTitle}>AI Assistant</div>
              <div style={s.aiSub}>Context-aware · Claude</div>
            </div>
          </div>

          <div style={s.aiTools}>
            {AI_TOOLS.map(([icon, label, mode]) => (
              <button
                key={mode}
                style={s.aiToolBtn}
                onClick={() => {
                  if (mode === "tone-menu") { setShowToneMenu((t) => !t); setShowWBMenu(false); return; }
                  if (mode === "writers-block") { setShowWBMenu((t) => !t); setShowToneMenu(false); return; }
                  setShowToneMenu(false);
                  setShowWBMenu(false);
                  runAI(mode);
                }}
              >
                <span>{icon}</span>
                <span style={{ fontSize: 9, marginTop: 2 }}>{label}</span>
              </button>
            ))}
          </div>

          {showToneMenu && (
            <div style={s.subMenu}>
              <div style={s.subMenuTitle}>Select tone</div>
              {TONES.map((t) => (
                <button key={t} style={s.subMenuBtn} onClick={() => { runAI("tone", { tone: t }); setShowToneMenu(false); }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          )}

          {showWBMenu && (
            <div style={s.subMenu}>
              <div style={s.subMenuTitle}>Idea type</div>
              {WRITERS_BLOCK_TYPES.map((t) => (
                <button key={t.id} style={s.subMenuBtn} onClick={() => { runAI("writers-block", { type: t.id }); setShowWBMenu(false); }}>
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <div style={s.aiOutput} ref={aiOutputRef}>
            {messages.length === 0 && (
              <div style={s.welcomeBubble}>
                <div style={s.bLabel}>Welcome</div>
                <div style={s.bText}>
                  Select text and use the tools above, or type a prompt below. I have full context of your book,
                  genre, and characters. Never auto-replaces — you always approve.
                </div>
              </div>
            )}

            {messages.map((msg, i) => {
              if (msg.type === "loading") {
                return (
                  <div key={msg.id || i} style={s.bubble}>
                    <div style={s.bLabel}>{msg.label}</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                      {[0, 1, 2].map((k) => (
                        <div key={k} style={{ width: 6, height: 6, borderRadius: "50%", background: "#d4860a", opacity: 0.6 }} />
                      ))}
                    </div>
                  </div>
                );
              }
              if (msg.type === "user") {
                return (
                  <div key={msg.id || i} style={{ ...s.bubble, background: "#f0ebe0", borderLeft: "3px solid #d4860a" }}>
                    <div style={s.bLabel}>You</div>
                    <div style={s.bText}>{msg.text}</div>
                  </div>
                );
              }
              const isImageMsg = msg.isImage || !!msg.imageUrl;
              const imageUrl = msg.imageUrl || (isImageMsg ? msg.text : null);
              return (
                <div key={msg.id || i} style={{ ...s.bubble, borderLeft: msg.type === "error" ? "3px solid #993c1d" : "3px solid #0f6e56" }}>
                  <div style={s.bLabel}>{msg.label || "💬 Assistant"}</div>
                  {isImageMsg ? (
                    <div style={{ position: "relative", marginTop: 8 }}>
                      <a
                        href={imageUrl}
                        download="generated-cover.jpg"
                        target="_blank"
                        rel="noreferrer"
                        title="Download Image"
                        style={{ position: "absolute", top: 10, right: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", color: "#fff", borderRadius: "50%", textDecoration: "none", fontSize: 18, zIndex: 10, cursor: "pointer" }}
                      >
                        ⬇
                      </a>
                      <img
                        src={imageUrl}
                        alt="Generated Art"
                        crossOrigin="anonymous"
                        style={{ width: "100%", maxHeight: "320px", objectFit: "contain", borderRadius: "8px", border: "1px solid #e2d9c8", display: "block" }}
                      />
                    </div>
                  ) : (
                    <div style={s.bText}>{msg.text}</div>
                  )}

                  {(msg.canApply || isImageMsg) && !msg._applied && (
                    <div style={s.bActions}>
                      <button
                        style={s.applyBtn}
                        onClick={() => { applySuggestion(msg); applyAppliedStateLocally(msg.id); }}
                      >
                        ✓ Apply
                      </button>
                      <button style={s.discardBtn} onClick={() => applyAppliedStateLocally(msg.id)}>✗</button>
                    </div>
                  )}

                  {msg._applied && (
                    <div style={{ fontSize: 10, color: "#0f6e56", fontWeight: 600, marginTop: 6 }}>Applied ✓</div>
                  )}
                </div>
              );
            })}
          </div>

          {isImageMode && (
            <div style={{ alignSelf: "flex-start", backgroundColor: "#e3f2fd", color: "#0d47a1", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
              🎨 Image Generation Mode
              <span style={{ cursor: "pointer", fontWeight: "bold" }} onClick={() => setIsImageMode(false)}>✕</span>
            </div>
          )}

          <div style={s.aiInputRow}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <button
                type="button"
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#666", padding: "0 8px" }}
                onClick={() => setShowImgMenu(!showImgMenu)}
              >
                +
              </button>
              {showImgMenu && (
                <div style={{ position: "absolute", bottom: "40px", left: "0", backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 10, minWidth: "160px" }}>
                  <button
                    type="button"
                    style={{ width: "100%", padding: "10px 12px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}
                    onClick={() => { setIsImageMode(true); setShowImgMenu(false); }}
                  >
                    🎨 Generate Image
                  </button>
                </div>
              )}
            </div>

            <textarea
              style={s.aiInput}
              value={aiPrompt}
              placeholder={isImageMode ? "Describe the scene illustration you want..." : "Ask the AI anything…"}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendCustomPrompt();
                }
              }}
              rows={2}
            />
            <button style={s.sendBtn} onClick={sendCustomPrompt}>→</button>
          </div>
        </>
      )}

      {rightPanel === "versions" && (
        <VersionHistory
          pageId={activePageId}
          onRestore={(content) => {
            if (editorRef.current) {
              editorRef.current.innerHTML = content;
              scheduleAutoSave();
            }
          }}
        />
      )}
    </aside>
  );
}