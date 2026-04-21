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
  sessions: (courseId: string) => api.get(`/courses/${courseId}/sessions`),
  courseAssignments: (courseId: string) => api.get(`/courses/${courseId}/assignments`),
  submitAssignment: (assignmentId: string, formData: FormData) =>
    api.post(`/assignments/${assignmentId}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  requestReportCard: (courseId: string) => api.post(`/courses/${courseId}/request-report-card`),
  myReportCards: () => api.get('/courses/my-report-cards'),
  myPerformance: (courseId: string) => api.get(`/courses/${courseId}/my-performance`),
};

// Materials (Notes/PDFs)
export const materialAPI = {
  courseMaterials: (courseId: string, type?: string, batchId?: string) =>
    api.get('/materials', { params: { courseId, ...(type ? { type } : {}), ...(batchId ? { batchId } : {}) } }),
  create: (data: any) => api.post('/materials', data),
  delete: (id: string) => api.delete(`/materials/${id}`),
  incrementDownload: (id: string) => api.post(`/materials/${id}/download`),
  uploadFile: (file: File, kind: 'image' | 'document') => {
    const form = new FormData();
    form.append(kind, file);
    return api.post(`/upload/${kind}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
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

export const announcementAPI = {
  my: () => api.get('/announcements/my'),
};

export const ticketAPI = {
  create: (data: any) => api.post('/notifications/ticket', data),
  list: () => api.get('/notifications/tickets'),
  reply: (id: string, message: string) => api.post(`/notifications/tickets/${id}/reply`, { message }),
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
  livekitToken: (id: string) => api.get(`/classes/${id}/livekit-token`),
  startEgress: (id: string) => api.post(`/classes/${id}/egress/start`),
  stopEgress: (id: string) => api.post(`/classes/${id}/egress/stop`),
  attendancePing: (id: string) => api.post(`/classes/${id}/attendance/ping`),
  myAttendance: (id: string) => api.get(`/classes/${id}/attendance/me`),
  uploadRecording: (id: string, formData: FormData, onProgress?: (pct: number) => void) =>
    api.post(`/classes/${id}/recording`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e: any) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    }),
  summary: (id: string) => api.post(`/classes/${id}/summary`),
  quizzes: (id: string) => api.get(`/classes/${id}/quizzes`),
  getRoomControl: (id: string) => api.get(`/classes/${id}/room-control`),
  setRoomControl: (id: string, data: { mutedAll?: boolean; camOffAll?: boolean }) =>
    api.post(`/classes/${id}/room-control`, data),
  myRecordings: () => api.get('/classes/my-recordings'),
  saveNotes: (id: string, notes: string) => api.patch(`/classes/${id}/notes`, { notes }),
  getPoll: (id: string) => api.get(`/classes/${id}/poll`),
  createPoll: (id: string, data: { question: string; options: string[] }) => api.post(`/classes/${id}/poll`, data),
  votePoll: (id: string, optionIndex: number) => api.post(`/classes/${id}/poll/vote`, { optionIndex }),
  endPoll: (id: string) => api.delete(`/classes/${id}/poll`),
};

// Quizzes
export const quizAPI = {
  list: () => api.get('/quizzes/student/list'),
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
  kyc: () => api.get('/mentor/kyc'),
  submitKyc: (data: any) => api.post('/mentor/kyc', data),
  salaries: () => api.get('/mentor/salaries'),
  myClasses: () => api.get('/classes/my'),
  myStudents: () => api.get('/courses/my-students'),
  addLesson: (courseId: string, data: any) => api.post(`/courses/${courseId}/lessons`, data),
  deleteLesson: (courseId: string, lessonId: string) => api.delete(`/courses/${courseId}/lessons/${lessonId}`),
  addModule: (courseId: string, data: any) => api.post(`/mentor/courses/${courseId}/modules`, data),
  editModule: (courseId: string, moduleId: string, data: any) => api.patch(`/mentor/courses/${courseId}/modules/${moduleId}`, data),
  deleteModule: (courseId: string, moduleId: string) => api.delete(`/mentor/courses/${courseId}/modules/${moduleId}`),
  addLessonToModule: (courseId: string, moduleId: string, data: any) => api.post(`/mentor/courses/${courseId}/modules/${moduleId}/lessons`, data),
  editLesson: (courseId: string, moduleId: string, lessonId: string, data: any) => api.patch(`/mentor/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, data),
  deleteLessonFromModule: (courseId: string, moduleId: string, lessonId: string) => api.delete(`/mentor/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`),
  myQuizzes: () => api.get('/quizzes/my'),
  earnings: () => api.get('/wallet'),
  apply: (data: any) => api.post('/auth/mentor-apply', data),
  dashboard: () => api.get('/mentor/dashboard'),
  courses: () => api.get('/mentor/courses'),
  courseStudents: (courseId: string) => api.get(`/mentor/courses/${courseId}/students`),
  courseBatches: (courseId: string) => api.get(`/mentor/courses/${courseId}/batches`),
  courseSessions: (courseId: string) => api.get(`/mentor/courses/${courseId}/sessions`),
  courseAssignments: (courseId: string, batchId?: string) => api.get(`/mentor/courses/${courseId}/assignments`, { params: batchId ? { batch: batchId } : {} }),
  createAssignment: (courseId: string, data: any) => api.post(`/mentor/courses/${courseId}/assignments`, data),
  deleteAssignment: (assignmentId: string) => api.delete(`/mentor/assignments/${assignmentId}`),
  reviewAssignment: (assignmentId: string, studentId: string, data: { score: number; feedback?: string }) => api.post(`/assignments/${assignmentId}/review/${studentId}`, data),
  startBatch: (batchId: string, data?: any) => api.patch(`/mentor/batches/${batchId}/start`, data || {}),
  markBatchDay: (batchId: string) => api.patch(`/mentor/batches/${batchId}/mark-day`),
  batchPerformance: (batchId: string) => api.get(`/mentor/batches/${batchId}/performance`),
  courseDetail: (courseId: string) => api.get(`/mentor/courses/${courseId}/detail`),
  profile: () => api.get('/mentor/profile'),
  updateProfile: (data: any) => api.put('/mentor/profile', data),
  courseQuizzes: (courseId: string, batchId?: string) => api.get(`/mentor/courses/${courseId}/quizzes`, { params: batchId ? { batch: batchId } : {} }),
  createCourseQuiz: (courseId: string, data: any) => api.post(`/mentor/courses/${courseId}/quizzes`, data),
  deleteQuiz: (quizId: string) => api.delete(`/mentor/quizzes/${quizId}`),
  reportCards: () => api.get('/mentor/report-cards'),
  approveReportCard: (id: string) => api.patch(`/mentor/report-cards/${id}/approve`),
  rejectReportCard: (id: string, data: any) => api.patch(`/mentor/report-cards/${id}/reject`, data),
};

// Manager API
export const managerAPI = {
  stats:           ()                             => api.get('/manager/stats'),
  partners:        (params?: any)                 => api.get('/manager/partners', { params }),
  partnerDetail:   (id: string)                   => api.get(`/manager/partners/${id}`),
  leaderboard:     ()                             => api.get('/manager/leaderboard'),
  sendTip:         (partnerId: string, data: any) => api.post(`/manager/partners/${partnerId}/tips`, data),
  deleteTip:       (tipId: string)                => api.delete(`/manager/tips/${tipId}`),
  createGoal:      (partnerId: string, data: any) => api.post(`/manager/partners/${partnerId}/goals`, data),
  updateGoal:      (goalId: string, data: any)    => api.patch(`/manager/goals/${goalId}`, data),
  deleteGoal:      (goalId: string)               => api.delete(`/manager/goals/${goalId}`),
  myTips:          ()                             => api.get('/manager/my-tips'),
  myGoals:         ()                             => api.get('/manager/my-goals'),
  emiCommissions:  ()                             => api.get('/manager/emi-commissions'),
  withdrawHistory: ()                             => api.get('/manager/withdrawals'),
  requestWithdraw: (data: { amount: number })     => api.post('/manager/withdraw', data),
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
  dashboard: (params?: any) => api.get('/partner/dashboard', { params }),
  earnings: (params?: any) => api.get('/partner/earnings', { params }),
  leaderboard: (period?: string) => api.get('/partner/leaderboard', { params: period ? { period } : {} }),
  mType: () => api.get('/partner/m-type'),
  referrals: (params?: any) => api.get('/partner/referrals', { params }),
  crm: (params?: any) => api.get('/partner/crm', { params }),
  addLead: (data: any) => api.post('/partner/crm/lead', data),
  updateLead: (id: string, data: any) => api.patch(`/partner/crm/lead/${id}`, data),
  completeTraining: (id: string) => api.post(`/partner/training/${id}/complete`),
  training: () => api.get('/partner/training'),
  kyc: () => api.get('/partner/kyc'),
  submitKyc: (data: any) => api.post('/partner/kyc', data),
  link: () => api.get('/partner/link'),
  qualification: () => api.get('/partner/qualification'),
  achievements: () => api.get('/partner/achievements'),
  emiCommissions: () => api.get('/partner/emi-commissions'),
  withdrawHistory: () => api.get('/partner/withdrawals'),
  requestWithdraw: (data: { amount: number }) => api.post('/partner/withdraw', data),
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
  validateCode: (data: { code: string; codeType: 'promo' | 'coupon'; type: string; tier?: string; packageId?: string; courseId?: string; amount: number }) =>
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

// Sales Team
export const salesAPI = {
  stats: () => api.get('/sales/stats'),
  leads: (params?: any) => api.get('/sales/leads', { params }),
  updateLead: (id: string, data: any) => api.patch(`/sales/leads/${id}`, data),
  orders: (params?: any) => api.get('/sales/orders', { params }),
  createOrder: (data: any) => api.post('/sales/orders', data),
  getOrder: (id: string) => api.get(`/sales/orders/${id}`),
  verifyPayment: (id: string, data: any) => api.post(`/sales/orders/${id}/verify-payment`, data),
  generatePaymentLink: (id: string) => api.post(`/sales/orders/${id}/payment-link`),
  myLink: () => api.get('/sales/link'),
  packages: () => api.get('/sales/packages'),
  emiCommissions: () => api.get('/sales/emi-commissions'),
  kyc: () => api.get('/sales/kyc'),
  submitKyc: (data: any) => api.post('/sales/kyc', data),
  withdrawHistory: () => api.get('/sales/withdrawals'),
  requestWithdraw: (data: { amount: number }) => api.post('/sales/withdraw', data),
  earnings: (params?: any) => api.get('/sales/earnings', { params }),
  achievements: () => api.get('/sales/achievements'),
};

export const phonepeAPI = {
  createOrder: (data: { type: 'package' | 'course'; packageId?: string; tier?: string; courseId?: string; promoCode?: string; couponCode?: string; isEmi?: boolean; age?: string; state?: string }) =>
    api.post('/phonepe/create-order', data),
  getStatus: (merchantOrderId: string, params: { type: string; tier?: string; courseId?: string; couponCode?: string; promoCode?: string; isEmi?: string }) =>
    api.get(`/phonepe/status/${merchantOrderId}`, { params }),
  getEmiStatus: () => api.get('/phonepe/emi'),
  payEmi: (data: { installmentId: string }) => api.post('/phonepe/emi/pay', data),
  payEmiFromWallet: (data: { installmentId: string }) => api.post('/phonepe/emi/pay-wallet', data),
  verifyEmiStatus: (params: { installmentId: string; orderId: string }) => api.get('/phonepe/emi/status', { params }),
};



export const jobsAPI = {
  feed: (params?: any) => api.get('/jobs/feed', { params }),
  proposal: (data: { jobTitle: string; jobDescription?: string; platform: string; skills?: string[]; budget?: string }) =>
    api.post('/jobs/proposal', data),
  brandProfile: () => api.get('/jobs/brand/profile'),
  linkedinSummary: (data: { extraSkills?: string }) => api.post('/jobs/brand/linkedin', data),
};

export const tasksAPI = {
  list:   ()                => api.get('/tasks'),
  team:   ()                => api.get('/tasks/team'),
  create: (data: any)       => api.post('/tasks', data),
  update: (id: string, data: any) => api.patch(`/tasks/${id}`, data),
  remove: (id: string)      => api.delete(`/tasks/${id}`),
};

export const meetingsAPI = {
  list:         ()                     => api.get('/meetings'),
  create:       (data: any)            => api.post('/meetings', data),
  update:       (id: string, data: any)=> api.patch(`/meetings/${id}`, data),
  remove:       (id: string)           => api.delete(`/meetings/${id}`),
  livekitToken: (id: string)           => api.get(`/meetings/${id}/livekit-token`),
  start:        (id: string)           => api.patch(`/meetings/${id}/start`, {}),
  end:          (id: string)           => api.patch(`/meetings/${id}/end`, {}),
};

export const remindersAPI = {
  list:   ()                => api.get('/reminders'),
  create: (data: any)       => api.post('/reminders', data),
  remove: (id: string)      => api.delete(`/reminders/${id}`),
};
