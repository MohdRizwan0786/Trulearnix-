import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken') || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = Cookies.get('refreshToken') || localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`, { refreshToken });
        Cookies.set('accessToken', data.accessToken, { expires: 7 });
        localStorage.setItem('accessToken', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  verifyOTP: (data: any) => api.post('/auth/verify-otp', data),
  resendOTP: (data: any) => api.post('/auth/resend-otp', data),
  forgotPassword: (data: any) => api.post('/auth/forgot-password', data),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
  logout: () => api.post('/auth/logout'),
};

// Courses
export const courseAPI = {
  getAll: (params?: any) => api.get('/courses', { params }),
  getBySlug: (slug: string) => api.get(`/courses/${slug}`),
  getContent: (id: string) => api.get(`/courses/${id}/content`),
  create: (data: any) => api.post('/courses', data),
  update: (id: string, data: any) => api.put(`/courses/${id}`, data),
  submit: (id: string) => api.patch(`/courses/${id}/submit`),
  myMentorCourses: () => api.get('/courses/my-courses'),
  markLesson: (id: string, lessonId: string) => api.post(`/courses/${id}/progress`, { lessonId }),
  addReview: (id: string, data: any) => api.post(`/courses/${id}/review`, data),
};

// Payments
export const paymentAPI = {
  createOrder: (data: any) => api.post('/payments/create-order', data),
  verify: (data: any) => api.post('/payments/verify', data),
  history: () => api.get('/payments/history'),
};

// User
export const userAPI = {
  me: () => api.get('/users/me'),
  update: (data: any) => api.put('/users/me', data),
  enrolledCourses: () => api.get('/users/enrolled-courses'),
  notifications: () => api.get('/users/notifications'),
  markNotificationsRead: () => api.patch('/users/notifications/read'),
};

// Live classes
export const classAPI = {
  upcoming: () => api.get('/classes/upcoming'),
  create: (data: any) => api.post('/classes', data),
  join: (id: string) => api.get(`/classes/${id}/join`),
  start: (id: string) => api.patch(`/classes/${id}/start`),
  end: (id: string) => api.patch(`/classes/${id}/end`),
  cancel: (id: string) => api.delete(`/classes/${id}`),
};

// Quizzes
export const quizAPI = {
  get: (id: string) => api.get(`/quizzes/${id}`),
  submit: (id: string, answers: any) => api.post(`/quizzes/${id}/submit`, { answers }),
  create: (data: any) => api.post('/quizzes', data),
  update: (id: string, data: any) => api.put(`/quizzes/${id}`, data),
};

// Certificates
export const certAPI = {
  claim: (courseId: string) => api.post(`/certificates/claim/${courseId}`),
  mine: () => api.get('/certificates/my'),
  verify: (id: string) => api.get(`/certificates/verify/${id}`),
};

// Wallet
export const walletAPI = {
  get: () => api.get('/wallet'),
  withdraw: (data: any) => api.post('/wallet/withdraw', data),
  transactions: (params?: any) => api.get('/wallet/transactions', { params }),
};

// Affiliate
export const affiliateAPI = {
  stats: () => api.get('/affiliate/stats'),
  referrals: () => api.get('/affiliate/referrals'),
};

// Admin
export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (params?: any) => api.get('/admin/users', { params }),
  toggleUser: (id: string) => api.patch(`/admin/users/${id}/toggle`),
  pendingCourses: () => api.get('/admin/courses/pending'),
  approveCourse: (id: string) => api.patch(`/admin/courses/${id}/approve`),
  rejectCourse: (id: string, reason: string) => api.patch(`/admin/courses/${id}/reject`, { reason }),
  tickets: (params?: any) => api.get('/admin/tickets', { params }),
  updateTicket: (id: string, data: any) => api.patch(`/admin/tickets/${id}`, data),
};
