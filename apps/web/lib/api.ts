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
  enrolled: () => api.get('/users/enrolled-courses'),
  assignments: (courseId: string) => api.get(`/assignments/course/${courseId}`),
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
  availableCourses: () => api.get('/users/available-courses'),
  enrollFree: (courseId: string) => api.post(`/users/enroll-free/${courseId}`),
  favorites: () => api.get('/users/favorites'),
  toggleFavorite: (courseId: string) => api.post(`/users/favorites/${courseId}`),
  announcements: () => api.get('/users/announcements'),
  notifications: () => api.get('/users/notifications'),
  markNotificationsRead: () => api.patch('/users/notifications/read'),
};

// Live classes
export const classAPI = {
  getPublic: () => api.get('/classes/public'),
  getUpcoming: () => api.get('/classes/upcoming'),
  upcoming: () => api.get('/classes/upcoming'),
  create: (data: any) => api.post('/classes', data),
  join: (id: string) => api.get(`/classes/${id}/join`),
  start: (id: string) => api.patch(`/classes/${id}/start`),
  end: (id: string) => api.patch(`/classes/${id}/end`),
  cancel: (id: string) => api.delete(`/classes/${id}`),
  detail: (id: string) => api.get(`/classes/${id}/detail`),
  zoomSignature: (id: string) => api.get(`/classes/${id}/zoom-signature`),
  attendancePing: (id: string) => api.post(`/classes/${id}/attendance/ping`),
  myAttendance: (id: string) => api.get(`/classes/${id}/attendance/me`),
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

// Packages
export const packageAPI = {
  getAll: () => api.get('/packages'),
  getById: (id: string) => api.get(`/packages/${id}`),
  getMatrix: () => api.get('/packages/commission-matrix'),
  getCommissionMatrix: () => api.get('/packages/commission-matrix'),
  getMy: () => api.get('/packages/my'),
  createOrder: (data: any) => api.post('/packages/order', data),
  verify: (data: any) => api.post('/packages/verify', data),
};

// CRM
export const crmAPI = {
  createLead: (data: any) => api.post('/crm/leads', data),
  getLeads: (params?: any) => api.get('/crm/leads', { params }),
  getLead: (id: string) => api.get(`/crm/leads/${id}`),
  updateLead: (id: string, data: any) => api.patch(`/crm/leads/${id}`, data),
  stats: () => api.get('/crm/stats'),
};

// Blog
export const blogAPI = {
  getAll: (params?: any) => api.get('/blog', { params }),
  getBySlug: (slug: string) => api.get(`/blog/${slug}`),
};

// Analytics
export const analyticsAPI = {
  dashboard: () => api.get('/analytics/dashboard'),
  revenue: (period?: string) => api.get('/analytics/revenue', { params: { period } }),
  unitEconomics: () => api.get('/analytics/unit-economics'),
  users: (period?: string) => api.get('/analytics/users', { params: { period } }),
};

// Affiliate (updated)
export const affiliateAPI = {
  stats: () => api.get('/affiliate/stats'),
  referrals: () => api.get('/affiliate/referrals'),
  commissions: (params?: any) => api.get('/affiliate/commissions', { params }),
  withdraw: (data: any) => api.post('/affiliate/withdraw', data),
  withdrawals: () => api.get('/affiliate/withdrawals'),
  leaderboard: () => api.get('/affiliate/leaderboard'),
};

// Community
export const communityAPI = {
  posts: (params?: any) => api.get('/community/posts', { params }),
  createPost: (data: any) => api.post('/community/posts', data),
  like: (id: string) => api.post(`/community/posts/${id}/like`),
  comment: (id: string, content: string) => api.post(`/community/posts/${id}/comment`, { content }),
  deletePost: (id: string) => api.delete(`/community/posts/${id}`),
};

// AI Coach
export const aiCoachAPI = {
  chat: (message: string, context?: string) => api.post('/users/ai-coach', { message, context }),
};

// Mentor
export const mentorAPI = {
  myClasses: () => api.get('/classes/my'),
  myStudents: () => api.get('/courses/my-students'),
  addLesson: (courseId: string, data: any) => api.post(`/courses/${courseId}/lessons`, data),
  deleteLesson: (courseId: string, lessonId: string) => api.delete(`/courses/${courseId}/lessons/${lessonId}`),
  myQuizzes: () => api.get('/quizzes/my'),
  earnings: () => api.get('/wallet'),
  apply: (data: any) => api.post('/auth/mentor-apply', data),
  dashboard: () => api.get('/mentor/dashboard'),
  courses: () => api.get('/mentor/courses'),
  courseStudents: (courseId: string) => api.get(`/mentor/courses/${courseId}/students`),
  profile: () => api.get('/mentor/profile'),
  updateProfile: (data: any) => api.put('/mentor/profile', data),
};

// Admin Mentor API
export const adminMentorAPI = {
  list: (params?: any) => api.get('/admin/mentors', { params }),
  approve: (id: string) => api.patch(`/admin/mentors/${id}/approve`),
  reject: (id: string, reason: string) => api.patch(`/admin/mentors/${id}/reject`, { reason }),
  assignCourse: (id: string, courseId: string, maxStudents?: number) => api.post(`/admin/mentors/${id}/assign-course`, { courseId, maxStudents }),
  unassignCourse: (id: string, courseId: string) => api.delete(`/admin/mentors/${id}/assign-course/${courseId}`),
  givePackage: (id: string, packageTier: string) => api.patch(`/admin/mentors/${id}/give-package`, { packageTier }),
};

// Projects
export const projectAPI = {
  all: (params?: any) => api.get('/projects', { params }),
  my: () => api.get('/projects/my'),
  create: (data: any) => api.post('/projects', data),
  like: (id: string) => api.post(`/projects/${id}/like`),
  update: (id: string, data: any) => api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

// Partner Panel
export const partnerAPI = {
  dashboard: () => api.get('/partner/dashboard'),
  earnings: () => api.get('/partner/earnings'),
  leaderboard: () => api.get('/partner/leaderboard'),
  mType: () => api.get('/partner/m-type'),
  referrals: (params?: any) => api.get('/partner/referrals', { params }),
  crm: (params?: any) => api.get('/partner/crm', { params }),
  addLead: (data: any) => api.post('/partner/crm/lead', data),
  training: () => api.get('/partner/training'),
  kyc: () => api.get('/partner/kyc'),
  submitKyc: (data: any) => api.post('/partner/kyc', data),
  link: () => api.get('/partner/link'),
  qualification: () => api.get('/partner/qualification'),
  achievements: () => api.get('/partner/achievements'),
};

// Freelance
export const freelanceAPI = {
  all: (params?: any) => api.get('/freelance', { params }),
  my: () => api.get('/freelance/my'),
  create: (data: any) => api.post('/freelance', data),
  apply: (id: string) => api.post(`/freelance/${id}/apply`),
  update: (id: string, data: any) => api.patch(`/freelance/${id}`, data),
};

// Checkout
export const checkoutAPI = {
  getItem: (params: { type: 'package' | 'course'; tier?: string; courseId?: string }) =>
    api.get('/checkout/item', { params }),
  validateCode: (data: { code: string; codeType: 'promo' | 'coupon'; type: string; tier?: string; courseId?: string; amount: number }) =>
    api.post('/checkout/validate-code', data),
  createOrder: (data: { type: 'package' | 'course'; tier?: string; courseId?: string; paymentMode?: 'full' | 'emi'; promoCode?: string; couponCode?: string }) =>
    api.post('/checkout/create-order', data),
  verify: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string; type: string; tier?: string; courseId?: string; paymentMode?: string; promoCode?: string; couponCode?: string }) =>
    api.post('/checkout/verify', data),
  getEmiStatus: () => api.get('/checkout/emi'),
  payEmi: (data: { installmentId: string }) => api.post('/checkout/emi/pay', data),
  verifyEmi: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string; installmentId: string }) =>
    api.post('/checkout/emi/verify', data),
};

export const phonepeAPI = {
  createOrder: (data: { type: 'package' | 'course'; tier?: string; courseId?: string; promoCode?: string; couponCode?: string; isEmi?: boolean }) =>
    api.post('/phonepe/create-order', data),
  getStatus: (merchantOrderId: string, params: { type: string; tier?: string; courseId?: string; couponCode?: string; promoCode?: string; isEmi?: string }) =>
    api.get(`/phonepe/status/${merchantOrderId}`, { params }),
  getEmiStatus: () => api.get('/phonepe/emi'),
  payEmi: (data: { installmentId: string }) => api.post('/phonepe/emi/pay', data),
  verifyEmiStatus: (params: { installmentId: string; orderId: string }) => api.get('/phonepe/emi/status', { params }),
};

