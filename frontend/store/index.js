// import { configureStore, createSlice } from '@reduxjs/toolkit';

// // ── Auth Slice ──
// const authSlice = createSlice({
//   name: 'auth',
//   initialState: { user: null, token: null, loading: false },
//   reducers: {
//     setCredentials: (state, { payload }) => {
//       state.user = payload.user;
//       state.token = payload.token;
//       if (typeof window !== 'undefined' && payload.token)
//         localStorage.setItem('inkwell_token', payload.token);
//     },
//     logout: (state) => {
//       state.user = null; state.token = null;
//       if (typeof window !== 'undefined') localStorage.removeItem('inkwell_token');
//     },
//     setUser: (state, { payload }) => { state.user = payload; },
//   },
// });

// // ── Editor Slice ──
// const editorSlice = createSlice({
//   name: 'editor',
//   initialState: {
//     activeBook: null,
//     activeChapterId: null,
//     activePageId: null,
//     chapters: [],
//     pages: {},
//     currentContent: '',
//     isDirty: false,
//     isSaving: false,
//     focusMode: false,
//     activeTab: 'write', // 'write' | 'characters' | 'plot' | 'analytics'
//   },
//   reducers: {
//     setActiveBook: (s, { payload }) => { s.activeBook = payload; },
//     setChapters: (s, { payload }) => { s.chapters = payload; },
//     addChapter: (s, { payload }) => { s.chapters.push(payload); },
//     updateChapter: (s, { payload }) => {
//       const i = s.chapters.findIndex(c => c._id === payload._id);
//       if (i >= 0) s.chapters[i] = payload;
//     },
//     removeChapter: (s, { payload }) => { s.chapters = s.chapters.filter(c => c._id !== payload); },
//     setPages: (s, { payload: { chapterId, pages } }) => { s.pages[chapterId] = pages; },
//     addPage: (s, { payload }) => {
//       const cId = payload.chapterId;
//       if (!s.pages[cId]) s.pages[cId] = [];
//       s.pages[cId].push(payload);
//     },
//     setActivePage: (s, { payload: { chapterId, pageId } }) => {
//       s.activeChapterId = chapterId; s.activePageId = pageId;
//     },
//     setContent: (s, { payload }) => { s.currentContent = payload; s.isDirty = true; },
//     setDirty: (s, { payload }) => { s.isDirty = payload; },
//     setSaving: (s, { payload }) => { s.isSaving = payload; },
//     setFocusMode: (s, { payload }) => { s.focusMode = payload; },
//     setActiveTab: (s, { payload }) => { s.activeTab = payload; },
//     removePage: (state, action) => {
//     const pageId = action.payload;
//         Object.keys(state.pages).forEach(chapterId => {
//           state.pages[chapterId] =
//             state.pages[chapterId].filter(
//               page => page._id !== pageId
//             );
//         });

//         if (state.activePageId === pageId) {
//           state.activePageId = null;
//         }
//       }
//         },
// });

// // ── AI Slice ──
// const aiSlice = createSlice({
//   name: 'ai',
//   initialState: { messages: [], loading: false },
//   reducers: {
//     addMessage: (s, { payload }) => { s.messages.push({ ...payload, id: Date.now() + Math.random() }); },
//     updateMessage: (s, { payload }) => {
//       const i = s.messages.findIndex(m => m.id === payload.id);
//       if (i >= 0) s.messages[i] = { ...s.messages[i], ...payload };
//     },
//     clearMessages: (s) => { s.messages = []; },
//     setLoading: (s, { payload }) => { s.loading = payload; },
//   },
// });

// // ── Characters Slice ──
// const charactersSlice = createSlice({
//   name: 'characters',
//   initialState: { list: [], loading: false },
//   reducers: {
//     setCharacters: (s, { payload }) => { s.list = payload; },
//     addCharacter: (s, { payload }) => { s.list.push(payload); },
//     updateCharacter: (s, { payload }) => {
//       const i = s.list.findIndex(c => c._id === payload._id);
//       if (i >= 0) s.list[i] = payload;
//     },
//     removeCharacter: (s, { payload }) => { s.list = s.list.filter(c => c._id !== payload); },
//     setCharsLoading: (s, { payload }) => { s.loading = payload; },
//   },
// });

// // subscription Slice 
// const subscriptionSlice = createSlice({
//   name: 'subscription',
//   initialState: {
//     plan: 'free',
//     status: 'none',
//     credits: { total: 100, remaining: 100, resetAt: null },
//     showUpgradeModal: false,
//     upgradeReason: '', // e.g. 'You've used all your AI credits for this period.'
//   },
//   reducers: {
//     setSubscriptionStatus: (s, { payload }) => {
//       s.plan = payload.subscription?.plan || s.plan;
//       s.status = payload.subscription?.status || s.status;
//       if (payload.credits) s.credits = payload.credits;
//     },
//     setCredits: (s, { payload }) => { s.credits = payload; },
//     deductCreditsLocally: (s, { payload }) => {
//       // Optimistic local update after a successful AI call — server is source of truth
//       s.credits.remaining = payload.remaining;
//     },
//     openUpgradeModal: (s, { payload }) => {
//       s.showUpgradeModal = true;
//       s.upgradeReason = payload?.reason || '';
//     },
//     closeUpgradeModal: (s) => { s.showUpgradeModal = false; s.upgradeReason = ''; },
//   },
// });


// export const { setCredentials, logout, setUser } = authSlice.actions;
// export const {
//   setActiveBook, setChapters, addChapter, updateChapter, removeChapter,
//   setPages, addPage, setActivePage, setContent, setDirty, setSaving,
//   setFocusMode, setActiveTab,removePage,
// } = editorSlice.actions;
// export const { addMessage, updateMessage, clearMessages, setLoading: setAiLoading } = aiSlice.actions;
// export const { setCharacters, addCharacter, updateCharacter: updateChar, removeCharacter, setCharsLoading } = charactersSlice.actions;


// export const {
//   setSubscriptionStatus, setCredits, deductCreditsLocally,
//   openUpgradeModal, closeUpgradeModal,
// } = subscriptionSlice.actions;


// const store = configureStore({
//   reducer: {
//     auth: authSlice.reducer,
//     editor: editorSlice.reducer,
//     ai: aiSlice.reducer,
//     characters: charactersSlice.reducer,
//     subscription:subscriptionSlice.reducer,
//   },
// });

// export default store;




// with localStorage login 

// import { configureStore, createSlice } from '@reduxjs/toolkit';

// // Retrieve initial Access Token safely on client load
// const getInitialToken = () => {
//   if (typeof window !== 'undefined') {
//     return localStorage.getItem('inkwell_token') || null;
//   }
//   return null;
// };

// // ── Auth Slice ──
// const authSlice = createSlice({
//   name: 'auth',
//   initialState: {
//     user: null,
//     token: getInitialToken(), // Strictly the short-lived Access Token
//     loading: false,
//     isInitialized: false,
//   },
//   reducers: {
//     setCredentials: (state, { payload }) => {
//       state.user = payload.user;
//       state.token = payload.token; // Access Token
      
//       if (typeof window !== 'undefined') {
//         if (state.token) {
//           localStorage.setItem('inkwell_token', state.token);
//         } else {
//           localStorage.removeItem('inkwell_token');
//         }
//       }
//     },
//     logout: (state) => {
//       state.user = null;
//       state.token = null;
//       if (typeof window !== 'undefined') {
//         localStorage.removeItem('inkwell_token');
//       }
//     },
//     setUser: (state, { payload }) => {
//       state.user = payload;
//     },
//     setInitialized: (state, { payload }) => {
//       state.isInitialized = payload;
//     },
//   },
// });

// // ── Editor Slice ──
// const editorSlice = createSlice({
//   name: 'editor',
//   initialState: {
//     activeBook: null,
//     activeChapterId: null,
//     activePageId: null,
//     chapters: [],
//     pages: {},
//     currentContent: '',
//     isDirty: false,
//     isSaving: false,
//     focusMode: false,
//     activeTab: 'write',
//   },
//   reducers: {
//     setActiveBook: (s, { payload }) => { s.activeBook = payload; },
//     setChapters: (s, { payload }) => { s.chapters = payload; },
//     addChapter: (s, { payload }) => { s.chapters.push(payload); },
//     updateChapter: (s, { payload }) => {
//       const i = s.chapters.findIndex(c => c._id === payload._id);
//       if (i >= 0) s.chapters[i] = payload;
//     },
//     removeChapter: (s, { payload }) => { s.chapters = s.chapters.filter(c => c._id !== payload); },
//     setPages: (s, { payload: { chapterId, pages } }) => { s.pages[chapterId] = pages; },
//     addPage: (s, { payload }) => {
//       const cId = payload.chapterId;
//       if (!s.pages[cId]) s.pages[cId] = [];
//       s.pages[cId].push(payload);
//     },
//     setActivePage: (s, { payload: { chapterId, pageId } }) => {
//       s.activeChapterId = chapterId;
//       s.activePageId = pageId;
//     },
//     setContent: (s, { payload }) => { s.currentContent = payload; s.isDirty = true; },
//     setDirty: (s, { payload }) => { s.isDirty = payload; },
//     setSaving: (s, { payload }) => { s.isSaving = payload; },
//     setFocusMode: (s, { payload }) => { s.focusMode = payload; },
//     setActiveTab: (s, { payload }) => { s.activeTab = payload; },
//     removePage: (state, action) => {
//       const pageId = action.payload;
//       Object.keys(state.pages).forEach(chapterId => {
//         state.pages[chapterId] = state.pages[chapterId].filter(
//           page => page._id !== pageId
//         );
//       });
//       if (state.activePageId === pageId) {
//         state.activePageId = null;
//       }
//     },
//   },
// });

// // ── AI Slice ──
// const aiSlice = createSlice({
//   name: 'ai',
//   initialState: { messages: [], loading: false },
//   reducers: {
//     addMessage: (s, { payload }) => { s.messages.push({ ...payload, id: Date.now() + Math.random() }); },
//     updateMessage: (s, { payload }) => {
//       const i = s.messages.findIndex(m => m.id === payload.id);
//       if (i >= 0) s.messages[i] = { ...s.messages[i], ...payload };
//     },
//     clearMessages: (s) => { s.messages = []; },
//     setLoading: (s, { payload }) => { s.loading = payload; },
//   },
// });

// // ── Characters Slice ──
// const charactersSlice = createSlice({
//   name: 'characters',
//   initialState: { list: [], loading: false },
//   reducers: {
//     setCharacters: (s, { payload }) => { s.list = payload; },
//     addCharacter: (s, { payload }) => { s.list.push(payload); },
//     updateCharacter: (s, { payload }) => {
//       const i = s.list.findIndex(c => c._id === payload._id);
//       if (i >= 0) s.list[i] = payload;
//     },
//     removeCharacter: (s, { payload }) => { s.list = s.list.filter(c => c._id !== payload); },
//     setCharsLoading: (s, { payload }) => { s.loading = payload; },
//   },
// });

// // ── Subscription Slice ──
// const subscriptionSlice = createSlice({
//   name: 'subscription',
//   initialState: {
//     plan: 'free',
//     status: 'none',
//     credits: { total: 100, remaining: 100, resetAt: null },
//     showUpgradeModal: false,
//     upgradeReason: '',
//   },
//   reducers: {
//     setSubscriptionStatus: (s, { payload }) => {
//       s.plan = payload.subscription?.plan || s.plan;
//       s.status = payload.subscription?.status || s.status;
//       if (payload.credits) s.credits = payload.credits;
//     },
//     setCredits: (s, { payload }) => { s.credits = payload; },
//     deductCreditsLocally: (s, { payload }) => {
//       s.credits.remaining = payload.remaining;
//     },
//     openUpgradeModal: (s, { payload }) => {
//       s.showUpgradeModal = true;
//       s.upgradeReason = payload?.reason || '';
//     },
//     closeUpgradeModal: (s) => { s.showUpgradeModal = false; s.upgradeReason = ''; },
//   },
// });

// export const { setCredentials, logout, setUser, setInitialized } = authSlice.actions;
// export const {
//   setActiveBook, setChapters, addChapter, updateChapter, removeChapter,
//   setPages, addPage, setActivePage, setContent, setDirty, setSaving,
//   setFocusMode, setActiveTab, removePage,
// } = editorSlice.actions;
// export const { addMessage, updateMessage, clearMessages, setLoading: setAiLoading } = aiSlice.actions;
// export const { setCharacters, addCharacter, updateCharacter: updateChar, removeCharacter, setCharsLoading } = charactersSlice.actions;
// export const {
//   setSubscriptionStatus, setCredits, deductCreditsLocally,
//   openUpgradeModal, closeUpgradeModal,
// } = subscriptionSlice.actions;

// const store = configureStore({
//   reducer: {
//     auth: authSlice.reducer,
//     editor: editorSlice.reducer,
//     ai: aiSlice.reducer,
//     characters: charactersSlice.reducer,
//     subscription: subscriptionSlice.reducer,
//   },
// });

// export default store;


import { configureStore, createSlice } from '@reduxjs/toolkit';

// ── Auth Slice (No localStorage, No Token State) ──
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    isInitialized: false,
  },
  reducers: {
    setCredentials: (state, { payload }) => {
      // payload expects { user }
      state.user = payload.user || payload;
    },
    logout: (state) => {
      state.user = null;
    },
    setUser: (state, { payload }) => {
      state.user = payload;
    },
    setInitialized: (state, { payload }) => {
      state.isInitialized = payload;
    },
  },
});

// ── Editor Slice ──
const editorSlice = createSlice({
  name: 'editor',
  initialState: {
    activeBook: null,
    activeChapterId: null,
    activePageId: null,
    chapters: [],
    pages: {},
    currentContent: '',
    isDirty: false,
    isSaving: false,
    focusMode: false,
    activeTab: 'write',
  },
  reducers: {
    setActiveBook: (s, { payload }) => { s.activeBook = payload; },
    setChapters: (s, { payload }) => { s.chapters = payload; },
    addChapter: (s, { payload }) => { s.chapters.push(payload); },
    updateChapter: (s, { payload }) => {
      const i = s.chapters.findIndex(c => c._id === payload._id);
      if (i >= 0) s.chapters[i] = payload;
    },
    removeChapter: (s, { payload }) => { s.chapters = s.chapters.filter(c => c._id !== payload); },
    setPages: (s, { payload: { chapterId, pages } }) => { s.pages[chapterId] = pages; },
    addPage: (s, { payload }) => {
      const cId = payload.chapterId;
      if (!s.pages[cId]) s.pages[cId] = [];
      s.pages[cId].push(payload);
    },
    setActivePage: (s, { payload: { chapterId, pageId } }) => {
      s.activeChapterId = chapterId;
      s.activePageId = pageId;
    },
    setContent: (s, { payload }) => { s.currentContent = payload; s.isDirty = true; },
    setDirty: (s, { payload }) => { s.isDirty = payload; },
    setSaving: (s, { payload }) => { s.isSaving = payload; },
    setFocusMode: (s, { payload }) => { s.focusMode = payload; },
    setActiveTab: (s, { payload }) => { s.activeTab = payload; },
    removePage: (state, action) => {
      const pageId = action.payload;
      Object.keys(state.pages).forEach(chapterId => {
        state.pages[chapterId] = state.pages[chapterId].filter(
          page => page._id !== pageId
        );
      });
      if (state.activePageId === pageId) {
        state.activePageId = null;
      }
    },
  },
});

// ── AI Slice ──
const aiSlice = createSlice({
  name: 'ai',
  initialState: { messages: [], loading: false },
  reducers: {
    addMessage: (s, { payload }) => { s.messages.push({ ...payload, id: Date.now() + Math.random() }); },
    updateMessage: (s, { payload }) => {
      const i = s.messages.findIndex(m => m.id === payload.id);
      if (i >= 0) s.messages[i] = { ...s.messages[i], ...payload };
    },
    clearMessages: (s) => { s.messages = []; },
    setLoading: (s, { payload }) => { s.loading = payload; },
  },
});

// ── Characters Slice ──
const charactersSlice = createSlice({
  name: 'characters',
  initialState: { list: [], loading: false },
  reducers: {
    setCharacters: (s, { payload }) => { s.list = payload; },
    addCharacter: (s, { payload }) => { s.list.push(payload); },
    updateCharacter: (s, { payload }) => {
      const i = s.list.findIndex(c => c._id === payload._id);
      if (i >= 0) s.list[i] = payload;
    },
    removeCharacter: (s, { payload }) => { s.list = s.list.filter(c => c._id !== payload); },
    setCharsLoading: (s, { payload }) => { s.loading = payload; },
  },
});

// ── Subscription Slice ──
const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState: {
    plan: 'free',
    status: 'none',
    credits: { total: 100, remaining: 100, resetAt: null },
    showUpgradeModal: false,
    upgradeReason: '',
  },
  reducers: {
    setSubscriptionStatus: (s, { payload }) => {
      s.plan = payload.subscription?.plan || s.plan;
      s.status = payload.subscription?.status || s.status;
      if (payload.credits) s.credits = payload.credits;
    },
    setCredits: (s, { payload }) => { s.credits = payload; },
    deductCreditsLocally: (s, { payload }) => {
      s.credits.remaining = payload.remaining;
    },
    openUpgradeModal: (s, { payload }) => {
      s.showUpgradeModal = true;
      s.upgradeReason = payload?.reason || '';
    },
    closeUpgradeModal: (s) => { s.showUpgradeModal = false; s.upgradeReason = ''; },
  },
});

export const { setCredentials, logout, setUser, setInitialized } = authSlice.actions;
export const {
  setActiveBook, setChapters, addChapter, updateChapter, removeChapter,
  setPages, addPage, setActivePage, setContent, setDirty, setSaving,
  setFocusMode, setActiveTab, removePage,
} = editorSlice.actions;
export const { addMessage, updateMessage, clearMessages, setLoading: setAiLoading } = aiSlice.actions;
export const { setCharacters, addCharacter, updateCharacter: updateChar, removeCharacter, setCharsLoading } = charactersSlice.actions;
export const {
  setSubscriptionStatus, setCredits, deductCreditsLocally,
  openUpgradeModal, closeUpgradeModal,
} = subscriptionSlice.actions;

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    editor: editorSlice.reducer,
    ai: aiSlice.reducer,
    characters: charactersSlice.reducer,
    subscription: subscriptionSlice.reducer,
  },
});

export default store;
