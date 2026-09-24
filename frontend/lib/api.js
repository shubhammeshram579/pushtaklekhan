// import axios from 'axios';

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

// api.interceptors.request.use((config) => {
//   if (typeof window !== 'undefined') {
//     const token = localStorage.getItem('inkwell_token');
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// api.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     if (err.response?.status === 401 && typeof window !== 'undefined') {
//       localStorage.removeItem('inkwell_token');
//       window.location.href = '/auth/login';
//     }
//     return Promise.reject(err);
//   }
// );

// with localstorege login 
// import axios from 'axios';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   withCredentials: true,
// });

// // -------------------------------------------------------------
// // 1. REQUEST INTERCEPTOR (Attach token to all outgoing requests)
// // -------------------------------------------------------------
// api.interceptors.request.use(
//   (config) => {
//     if (typeof window !== 'undefined') {
//       const token = localStorage.getItem('inkwell_token');
//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // -------------------------------------------------------------
// // 2. RESPONSE INTERCEPTOR (Queue requests & Handle Token Refresh)
// // -------------------------------------------------------------
// let isRefreshing = false;
// let failedQueue = [];

// const processQueue = (error, token = null) => {
//   failedQueue.forEach((prom) => {
//     if (error) {
//       prom.reject(error);
//     } else {
//       prom.resolve(token);
//     }
//   });
//   failedQueue = [];
// };

// api.interceptors.response.use(
//   (res) => res,
//   async (err) => {
//     const originalRequest = err.config;

//     // Prevent handling if config is missing or request already retried once
//     if (!originalRequest) {
//       return Promise.reject(err);
//     }

//     if (err.response?.status === 401 && !originalRequest._retry) {
//       // Prevent infinite loops on authentication endpoints
//       if (
//         originalRequest.url?.includes('/auth/refresh-token') ||
//         originalRequest.url?.includes('/auth/login')
//       ) {
//         return Promise.reject(err);
//       }

//       // If another request is currently refreshing the token, queue incoming ones
//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         })
//           .then((token) => {
//             originalRequest.headers.Authorization = `Bearer ${token}`;
//             return api(originalRequest);
//           })
//           .catch((queueErr) => Promise.reject(queueErr));
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       try {
//         const { data } = await axios.post(
//           `${API_BASE_URL}/auth/refresh-token`,
//           {},
//           { withCredentials: true }
//         );

//         // Safely extract token first
//         const newAccessToken = data?.data?.accessToken || data?.accessToken;

//         if (!newAccessToken) {
//           throw new Error('No access token returned from refresh endpoint');
//         }

//         if (typeof window !== 'undefined') {
//           localStorage.setItem('inkwell_token', newAccessToken);
//         }

//         // Process queued requests with new token
//         processQueue(null, newAccessToken);
//         isRefreshing = false;

//         // Retry original initial request with new token
//         originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
//         return api(originalRequest);
//       } catch (refreshErr) {
//         processQueue(refreshErr, null);
//         isRefreshing = false;

//         if (typeof window !== 'undefined') {
//           localStorage.removeItem('inkwell_token');
//           // Optional: redirect to login page if refresh token is invalid/expired
//           // window.location.href = '/login';
//         }

//         return Promise.reject(refreshErr);
//       }
//     }

//     return Promise.reject(err);
//   }
// );



import axios from 'axios';
import store, { logout } from '../store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Essential: Sends and receives HttpOnly cookies automatically
});

// -------------------------------------------------------------
// RESPONSE INTERCEPTOR (Automatic Token Refreshing via Cookie)
// -------------------------------------------------------------
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (!originalRequest) {
      return Promise.reject(err);
    }

    if (err.response?.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop on auth endpoints
      if (
        originalRequest.url?.includes('/auth/refresh-token') ||
        originalRequest.url?.includes('/auth/login')
      ) {
        return Promise.reject(err);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((queueErr) => Promise.reject(queueErr));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Trigger server endpoint: replaces cookies automatically via Set-Cookie header
        await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        processQueue(null);
        isRefreshing = false;

        // Retry original request (browser will attach new accessToken cookie)
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr);
        isRefreshing = false;

        // Clear user state on absolute refresh failure
        store.dispatch(logout());

        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (d) => api.post('/auth/register', d),
  verifyRegistrationOTP: (d) => api.post('/auth/verify-registration-otp', d),
  login: (d) => api.post('/auth/login', d),
  forgotPassword: (d) => api.post('/auth/forgot-password', d),
  resetPassword: (d) => api.post('/auth/reset-password', d),
  refreshToken: () => api.post('/auth/refresh-token'),
  logout: () => api.post('/auth/logout'),

  getMe: () => api.get('/auth/me'),
  updateMe: (d) => api.put('/auth/me', d),
  changePassword: (d) => api.put('/auth/change-password', d),
};

export const booksAPI = {
  create: (d) => api.post('/books', d),
  list: (p) => api.get('/books', { params: p }),
  get: (id) => api.get(`/books/${id}`),
  update: (id, d) => api.put(`/books/${id}`, d),
  delete: (id) => api.delete(`/books/${id}`),
  export: (id) => api.get(`/books/${id}/export`),
  exportDocx: (id) =>
    api.get(
      `/books/${id}/export/docx`,
      {
        responseType: "blob",
      }
    ),

    
     exportPdf: (id) =>
    api.get(
      `/books/${id}/export/pdf`,
      {
        responseType: "blob",
      }
    ),

  exportEpub: (id) =>
    api.get(
      `/books/${id}/export/epub`,
      {
        responseType: "blob",
      }
    ),
};

export const chaptersAPI = {
  create: (d) => api.post('/chapters', d),
  list: (bookId) => api.get(`/chapters/${bookId}`),
  update: (id, d) => api.put(`/chapters/${id}`, d),
  delete: (id) => api.delete(`/chapters/${id}`),
  reorder: (d) => api.patch('/chapters/reorder', d),
};

export const pagesAPI = {
  create: (d) => api.post('/pages', d),
  list: (chapterId) => api.get(`/pages/${chapterId}`),
  get: (id) => api.get(`/pages/single/${id}`),
  update: (id, d) => api.put(`/pages/${id}`, d),
  delete: (id) => api.delete(`/pages/${id}`),
  getDrafts: (id) => api.get(`/pages/${id}/drafts`),
};

export const aiAPI = {
  fixGrammar: (d) => api.post('/ai/fix-grammar', d),
  rewrite: (d) => api.post('/ai/rewrite', d),
  continueWriting: (d) => api.post('/ai/continue-writing', d),
  summarize: (d) => api.post('/ai/summarize', d),
  expand: (d) => api.post('/ai/expand', d),
  simplify: (d) => api.post('/ai/simplify', d),
  tone: (d) => api.post('/ai/tone', d),
  writersBlock: (d) => api.post('/ai/writers-block', d),
  custom: (d) => api.post('/ai/custom', d),
  generateImage: (d) => api.post('/ai/generate-image', d),
};

export const uploadsAPI = {
  uploadImage: (fd) => api.post('/uploads/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteImage: (publicId) => api.delete('/uploads/image', { data: { publicId } }),
};

export const charactersAPI = {
  create: (d) => api.post('/characters', d),
  list: (bookId) => api.get(`/characters/${bookId}`),
  get: (id) => api.get(`/characters/single/${id}`),
  update: (id, d) => api.put(`/characters/${id}`, d),
  delete: (id) => api.delete(`/characters/${id}`),
};

export const versionsAPI = {
  create: (d) => api.post('/versions', d),
  list: (pageId) => api.get(`/versions/${pageId}`),
  get: (id) => api.get(`/versions/single/${id}`),
  restore: (id) => api.post(`/versions/${id}/restore`),
  delete: (id) => api.delete(`/versions/${id}`),
};

export const analyticsAPI = {
  track: (d) => api.post('/analytics/track', d),
  getBook: (bookId) => api.get(`/analytics/book/${bookId}`),
  getDashboard: () => api.get('/analytics/dashboard'),
};

// new update
export const subscriptionAPI = {
  getPlans: () => api.get('/subscription/plans'),
  getStatus: () => api.get('/subscription/me'),
  createOrder: (planId) => api.post('/subscription/create-order', { planId }),
  verifyPayment: (data) => api.post('/subscription/verify', data),
  cancel: () => api.post('/subscription/cancel'),
  getHistory: () => api.get('/subscription/history'),
};

export const creditsAPI = {
  getBalance: () => api.get('/credits/balance'),
  getHistory: (limit) => api.get('/credits/history', { params: { limit } }),
  getUsageSummary: () => api.get('/credits/usage-summary'),
};


export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),

  getUsers: (params) => api.get('/admin/users', { params }),
  getUserDetail: (id) => api.get(`/admin/users/${id}`),
  blockUser: (id, reason) => api.patch(`/admin/users/${id}/block`, { reason }),
  unblockUser: (id) => api.patch(`/admin/users/${id}/unblock`),
  changeRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  grantCredits: (id, amount, reason) => api.patch(`/admin/users/${id}/credits`, { amount, reason }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  getAIUsage: () => api.get('/admin/ai-usage'),
  getRevenue: () => api.get('/admin/revenue'),
  getStorage: () => api.get('/admin/storage'),

  getReports: (status) => api.get('/admin/reports', { params: { status } }),
  reviewReport: (id, data) => api.patch(`/admin/reports/${id}`, data),
};


export default api;
