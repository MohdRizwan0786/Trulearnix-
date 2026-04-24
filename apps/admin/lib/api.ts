import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.trulearnix.com/api',
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('adminToken') || (typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if already on login page — prevents infinite loop
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        Cookies.remove('adminToken');
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminName');
          localStorage.removeItem('adminRole');
        }
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const adminAPI = {
  // Auth
  login: (data: any) => api.post('/auth/login', data),
  // Dashboard
  dashboard: () => api.get('/admin/dashboard'),
  // Analytics
  analyticsDashboard: () => api.get('/analytics/dashboard'),
  analyticsFunnel: () => api.get('/analytics/funnel'),
  analyticsOverview: (params: any) => api.get('/analytics/overview', { params }),
  analyticsRevenue: (period?: string, from?: string, to?: string) => api.get('/analytics/revenue', { params: { period, from, to } }),
  analyticsUsers: (period?: string, from?: string, to?: string) => api.get('/analytics/users', { params: { period, from, to } }),
  unitEconomics: () => api.get('/analytics/unit-economics'),
  // Users
  createUser: (data: any) => api.post('/admin/users/create', data),
  users: (params?: any) => api.get('/admin/users', { params }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  resetUserPassword: (id: string, password: string) => api.patch(`/admin/users/${id}/reset-password`, { password }),
  toggleUser: (id: string) => api.patch(`/admin/users/${id}/toggle`),
  updateUserRole: (id: string, role: string) => api.patch(`/admin/users/${id}/role`, { role }),
  updateUserPackage: (id: string, packageTier: string) => api.patch(`/admin/users/${id}/package`, { packageTier }),
  setIndustrialEarning: (id: string, data: any) => api.patch(`/admin/users/${id}/industrial-earning`, data),
  // Courses — admin sees all statuses
  allCourses: (params?: any) => api.get('/admin/courses/all', { params }),
  getCourse: (id: string) => api.get(`/admin/courses/${id}`),
  createCourse: (data: any) => api.post('/admin/courses/create', data),
  updateCourse: (id: string, data: any) => api.put(`/admin/courses/${id}`, data),
  pendingCourses: () => api.get('/admin/courses/pending'),
  approveCourse: (id: string) => api.patch(`/admin/courses/${id}/approve`),
  rejectCourse: (id: string, reason: string) => api.patch(`/admin/courses/${id}/reject`, { reason }),
  deleteCourse: (id: string) => api.delete(`/admin/courses/${id}`),
  updateUserProfile: (id: string, data: any) => api.patch(`/admin/users/${id}/profile`, data),
  // Batches
  batches: (courseId: string) => api.get('/admin/batches', { params: { courseId } }),
  batchStudents: (batchId: string) => api.get(`/admin/batches/${batchId}/students`),
  batchPerformance: (batchId: string) => api.get(`/admin/batches/${batchId}/performance`),
  createBatch: (data: any) => api.post('/admin/batches', data),
  closeBatch: (id: string) => api.patch(`/admin/batches/${id}/close`),
  reopenBatch: (id: string, data?: any) => api.patch(`/admin/batches/${id}/reopen`, data),
  startBatch: (id: string) => api.patch(`/admin/batches/${id}/start`),
  markBatchDay: (id: string) => api.patch(`/admin/batches/${id}/mark-day`),
  transferStudent: (data: any) => api.post('/admin/batches/transfer', data),
  // Packages
  packages: () => api.get('/admin/packages'),
  createPackage: (data: any) => api.post('/admin/packages', data),
  updatePackage: (id: string, data: any) => api.put(`/admin/packages/${id}`, data),
  deletePackage: (id: string) => api.delete(`/admin/packages/${id}`),
  updatePackageEarner: (soldPkgId: string, data: any) => api.patch(`/admin/packages/${soldPkgId}/earner`, data),
  platformSettings: () => api.get('/admin/platform-settings'),
  updatePlatformSettings: (data: any) => api.put('/admin/platform-settings', data),
  generateEarlyAccessToken: (label: string) => api.post('/admin/platform-settings/early-access-token', { label }),
  deleteEarlyAccessToken: (token: string) => api.delete(`/admin/platform-settings/early-access-token/${encodeURIComponent(token)}`),
  // Purchases
  purchases: (params?: any) => api.get('/admin/purchases', { params }),
  purchaseInvoice: (id: string) => api.get(`/admin/purchases/${id}/invoice`),
  paymentInvoice: (id: string) => api.get(`/admin/payments/${id}/invoice`),
  // Commissions
  commissions: (params?: any) => api.get('/admin/commissions', { params }),
  // Withdrawals
  withdrawals: (params?: any) => api.get('/admin/withdrawals', { params }),
  processWithdrawal: (id: string, data: any) => api.patch(`/admin/withdrawals/${id}`, data),
  hrApproveWithdrawal: (id: string) => api.patch(`/admin/withdrawals/${id}/hr-approve`),
  hrRejectWithdrawal: (id: string, reason: string) => api.patch(`/admin/withdrawals/${id}/hr-reject`, { reason }),
  completeWithdrawal: (id: string, transactionRef?: string) => api.patch(`/admin/withdrawals/${id}/complete`, { transactionRef }),
  // CRM
  leads: (params?: any) => api.get('/crm/leads', { params }),
  getLead: (id: string) => api.get(`/crm/leads/${id}`),
  createLead: (data: any) => api.post('/crm/leads', data),
  updateLead: (id: string, data: any) => api.patch(`/crm/leads/${id}`, data),
  deleteLead: (id: string) => api.delete(`/crm/leads/${id}`),
  importLeads: (data: any) => api.post('/crm/leads/import', data),
  crmStats: () => api.get('/crm/stats'),
  // Blog
  allBlogs: (params?: any) => api.get('/blog/admin/all', { params }),
  createBlog: (data: any) => api.post('/blog', data),
  updateBlog: (id: string, data: any) => api.put(`/blog/${id}`, data),
  deleteBlog: (id: string) => api.delete(`/blog/${id}`),
  // Tickets
  tickets: (params?: any) => api.get('/admin/tickets', { params }),
  updateTicket: (id: string, data: any) => api.patch(`/admin/tickets/${id}`, data),
  // Notifications broadcast
  broadcastNotify: (data: any) => api.post('/admin/notify', data),
  // Live classes
  allClasses: (params?: any) => api.get('/classes', { params }),
  createClass: (data: any) => api.post('/classes', data),
  getClass: (id: string) => api.get(`/classes/${id}/detail`),
  startClass: (id: string) => api.patch(`/classes/${id}/start`),
  endClass: (id: string) => api.patch(`/classes/${id}/end`),
  cancelClass: (id: string) => api.delete(`/classes/${id}`),
  getAttendance: (id: string) => api.get(`/classes/${id}/attendance`),
  getRecordings: (params?: any) => api.get('/classes/admin/recordings', { params }),
  deleteRecording: (classId: string) => api.delete(`/classes/${classId}/recording`),
  updateLessonVideoUrl: (courseId: string, lessonId: string, videoUrl: string) =>
    api.patch(`/admin/courses/${courseId}/lessons/${lessonId}/video-url`, { videoUrl }),
  updateBatchLessonVideoUrl: (courseId: string, lessonId: string, batchId: string, videoUrl: string) =>
    api.patch(`/admin/courses/${courseId}/lessons/${lessonId}/batch-video-url`, { batchId, videoUrl }),
  livekitToken: (id: string) => api.get(`/classes/${id}/livekit-token`),
  getRoomControl: (id: string) => api.get(`/classes/${id}/room-control`),
  setRoomControl: (id: string, data: any) => api.post(`/classes/${id}/room-control`, data),
  // Webinars & Workshops
  allWebinars: (params?: any) => api.get('/webinars', { params }),
  createWebinar: (data: any) => api.post('/webinars', data),
  getWebinar: (id: string) => api.get(`/webinars/${id}`),
  updateWebinar: (id: string, data: any) => api.patch(`/webinars/${id}`, data),
  startWebinar: (id: string) => api.patch(`/webinars/${id}/start`),
  startWebinarRecording: (id: string) => api.patch(`/webinars/${id}/recording/start`),
  endWebinar: (id: string) => api.patch(`/webinars/${id}/end`),
  cancelWebinar: (id: string) => api.delete(`/webinars/${id}`),
  webinarLivekitToken: (id: string) => api.get(`/webinars/${id}/livekit-token`),
  getWebinarRoomControl: (id: string) => api.get(`/webinars/${id}/room-control`),
  setWebinarRoomControl: (id: string, data: any) => api.post(`/webinars/${id}/room-control`, data),
  getWebinarReport: (id: string) => api.get(`/webinars/${id}/report`),
  courseBatches: (courseId: string) => api.get(`/admin/batches?course=${courseId}`),
  // Coupons
  // KYC Management
  kycList: (params?: any) => api.get('/admin/kyc', { params }),
  kycAction: (userId: string, data: any) => api.patch(`/admin/kyc/${userId}`, data),
  // Partner Training
  partnerTraining: () => api.get('/admin/partner-training'),
  createTrainingModule: (data: any) => api.post('/admin/partner-training', data),
  updateTrainingModule: (id: string, data: any) => api.patch(`/admin/partner-training/${id}`, data),
  deleteTrainingModule: (id: string) => api.delete(`/admin/partner-training/${id}`),
  // Qualifications
  qualifications: () => api.get('/admin/qualifications'),
  createQualification: (data: any) => api.post('/admin/qualifications', data),
  updateQualification: (id: string, data: any) => api.patch(`/admin/qualifications/${id}`, data),
  deleteQualification: (id: string) => api.delete(`/admin/qualifications/${id}`),
  // Achievements
  achievements: () => api.get('/admin/achievements'),
  createAchievement: (data: any) => api.post('/admin/achievements', data),
  updateAchievement: (id: string, data: any) => api.patch(`/admin/achievements/${id}`, data),
  deleteAchievement: (id: string) => api.delete(`/admin/achievements/${id}`),
  // Coupons
  coupons: () => api.get('/coupons'),
  createCoupon: (data: any) => api.post('/coupons', data),
  updateCoupon: (id: string, data: any) => api.patch(`/coupons/${id}`, data),
  deleteCoupon: (id: string) => api.delete(`/coupons/${id}`),
  // Tasks (Kanban)
  tasks: () => api.get('/tasks'),
  taskTeam: () => api.get('/tasks/team'),
  createTask: (data: any) => api.post('/tasks', data),
  updateTask: (id: string, data: any) => api.patch(`/tasks/${id}`, data),
  deleteTask: (id: string) => api.delete(`/tasks/${id}`),
  // Study Materials
  materials: (params?: any) => api.get('/materials', { params }),
  createMaterial: (data: any) => api.post('/materials', data),
  deleteMaterial: (id: string) => api.delete(`/materials/${id}`),
  // Goals
  goals: (params?: any) => api.get('/goals', { params }),
  createGoal: (data: any) => api.post('/goals', data),
  updateGoal: (id: string, data: any) => api.patch(`/goals/${id}`, data),
  updateGoalKR: (goalId: string, krIndex: number, data: any) => api.patch(`/goals/${goalId}/kr/${krIndex}`, data),
  deleteGoal: (id: string) => api.delete(`/goals/${id}`),
  // Reminders
  reminders: () => api.get('/reminders'),
  createReminder: (data: any) => api.post('/reminders', data),
  deleteReminder: (id: string) => api.delete(`/reminders/${id}`),
  // Popups
  getPopups: () => api.get('/popups'),
  createPopup: (data: any) => api.post('/popups', data),
  updatePopup: (id: string, data: any) => api.put(`/popups/${id}`, data),
  togglePopup: (id: string) => api.patch(`/popups/${id}/toggle`),
  deletePopup: (id: string) => api.delete(`/popups/${id}`),
  // Site Content (CMS)
  getSiteContent: (section: string) => api.get(`/site-content/${section}`),
  saveSiteContent: (section: string, data: any) => api.put(`/site-content/${section}`, data),
  // Media / Uploads
  uploadFile: (formData: FormData) => api.post('/upload/any', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadImage: (formData: FormData) => api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadVideo: (formData: FormData) => api.post('/upload/video', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  listMedia: (type?: string) => api.get('/upload/media/list', { params: type ? { type } : {} }),
  deleteMedia: (id: string) => api.delete(`/upload/media/${id}`),
  // TruLance
  trulanceProjects: (params?: any) => api.get('/admin/trulance/projects', { params }),
  updateTrulanceProject: (id: string, data: any) => api.patch(`/admin/trulance/projects/${id}`, data),
  deleteTrulanceProject: (id: string) => api.delete(`/admin/trulance/projects/${id}`),
  trulanceFreelancers: (params?: any) => api.get('/admin/trulance/freelancers', { params }),
  // Mentor Management
  createMentor: (data: any) => api.post('/admin/mentors', data),
  mentors: (params?: any) => api.get('/admin/mentors', { params }),
  approveMentor: (id: string) => api.patch(`/admin/mentors/${id}/approve`),
  rejectMentor: (id: string, reason?: string) => api.patch(`/admin/mentors/${id}/reject`, { reason }),
  assignCourse: (mentorId: string, courseId: string, maxStudents?: number) =>
    api.post(`/admin/mentors/${mentorId}/assign-course`, { courseId, maxStudents }),
  unassignCourse: (mentorId: string, courseId: string) =>
    api.delete(`/admin/mentors/${mentorId}/assign-course/${courseId}`),
  giveMentorPackage: (id: string, packageTier: string) =>
    api.patch(`/admin/mentors/${id}/give-package`, { packageTier }),
  // Finance
  financeOverview: (period?: string) => api.get('/finance/overview', { params: { period } }),
  financePnl: (year?: number) => api.get('/finance/pnl', { params: { year } }),
  financeTds: (year?: number) => api.get('/finance/tds', { params: { year } }),
  financeGst: (year?: number) => api.get('/finance/gst', { params: { year } }),
  financeExpenses: (params?: any) => api.get('/finance/expenses', { params }),
  addExpense: (data: any) => api.post('/finance/expenses', data),
  deleteExpense: (id: string) => api.delete(`/finance/expenses/${id}`),
  financeChart: (period?: string) => api.get('/finance/revenue-chart', { params: { period } }),
  financeCommissions: (params?: any) => api.get('/finance/commissions', { params }),

  // Marketing
  marketingOverview: () => api.get('/marketing/overview'),
  getTemplates: (params?: any) => api.get('/marketing/templates', { params }),
  createTemplate: (data: any) => api.post('/marketing/templates', data),
  updateTemplate: (id: string, data: any) => api.put(`/marketing/templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/marketing/templates/${id}`),
  getCampaigns: (params?: any) => api.get('/marketing/campaigns', { params }),
  createCampaign: (data: any) => api.post('/marketing/campaigns', data),
  sendCampaign: (id: string) => api.post(`/marketing/campaigns/${id}/send`),
  deleteCampaign: (id: string) => api.delete(`/marketing/campaigns/${id}`),
  getChats: (params?: any) => api.get('/marketing/chats', { params }),
  getChat: (phone: string) => api.get(`/marketing/chats/${phone}`),
  sendWhatsApp: (phone: string, message: string) => api.post(`/marketing/chats/${phone}/send`, { message }),
  sendSingleEmail: (data: any) => api.post('/marketing/send-email', data),
  getChatbotFlows: () => api.get('/marketing/chatbot'),
  createChatbotFlow: (data: any) => api.post('/marketing/chatbot', data),
  updateChatbotFlow: (id: string, data: any) => api.put(`/marketing/chatbot/${id}`, data),
  toggleChatbotFlow: (id: string) => api.patch(`/marketing/chatbot/${id}/toggle`),
  deleteChatbotFlow: (id: string) => api.delete(`/marketing/chatbot/${id}`),
  // Employees
  employees: (params?: any) => api.get('/admin/employees', { params }),
  createEmployee: (data: any) => api.post('/admin/employees', data),
  // Salespersons
  createSalesperson: (data: any) => api.post('/admin/salespersons', data),
  // Partner Managers
  createPartnerManager: (data: any) => api.post('/admin/partner-managers', data),
  updateEmployee: (id: string, data: any) => api.patch(`/admin/employees/${id}`, data),
  deleteEmployee: (id: string) => api.delete(`/admin/employees/${id}`),
  employeePerformance: (id: string) => api.get(`/admin/employees/${id}/performance`),
  userReferrals: (id: string, params?: any) => api.get(`/admin/users/${id}/referrals`, { params }),
  // Learners
  learners: (params?: any) => api.get('/admin/learners', { params }),
  learnerBrand: (id: string) => api.get(`/admin/learners/${id}/brand`),
  // Jobs
  jobs: (params?: any) => api.get('/admin/jobs', { params }),
  updateJobStatus: (id: string, status: string) => api.patch(`/admin/jobs/${id}/status`, { status }),
  deleteJob: (id: string) => api.delete(`/admin/jobs/${id}`),
  // Announcements
  announcements: (params?: any) => api.get('/announcements', { params }),
  createAnnouncement: (data: any) => api.post('/announcements', data),
  updateAnnouncement: (id: string, data: any) => api.patch(`/announcements/${id}`, data),
  deleteAnnouncement: (id: string) => api.delete(`/announcements/${id}`),
  // Partners
  partners: (params?: any) => api.get('/admin/partners', { params }),
  setPromoDiscount: (id: string, percent: number) => api.patch(`/admin/partners/${id}/promo-discount`, { promoDiscountPercent: percent }),
  managers: () => api.get('/admin/managers'),
  managerPerformance: (managerId: string) => api.get(`/admin/managers/${managerId}/performance`),
  assignManager: (partnerId: string, managerId: string | null) => api.patch(`/admin/partners/${partnerId}/assign-manager`, { managerId }),
  // Sales Team
  salespersons: (params?: any) => api.get('/admin/salespersons', { params }),
  salesOrders: (params?: any) => api.get('/admin/sales-orders', { params }),
  salesStats: () => api.get('/admin/sales-stats'),
  pendingApprovals: (params?: any) => api.get('/admin/sales-orders/pending-approval', { params }),
  approveSalesOrder: (id: string) => api.post(`/admin/sales-orders/${id}/approve`),
  rejectSalesOrder: (id: string) => api.post(`/admin/sales-orders/${id}/reject`),
  assignLeads: (leadIds: string[], salespersonId: string) => api.post('/admin/leads/assign', { leadIds, salespersonId }),
  crmLeads: (params?: any) => api.get('/crm/leads', { params }),
  // NOVA AI Agent
  novaConfig: () => api.get('/nova/config'),
  updateNovaConfig: (data: any) => api.put('/nova/config', data),
  novaChat: (message: string) => api.post('/nova/chat', { message }),
  novaHistory: () => api.get('/nova/history'),
  novaClearHistory: () => api.delete('/nova/history'),
  novaPulse: () => api.get('/nova/pulse'),
  novaActionLog: () => api.get('/nova/action-log'),
  novaSendWhatsApp: (phone: string, message: string) => api.post('/nova/send-whatsapp', { phone, message }),
  novaBroadcast: (phones: string[], message: string) => api.post('/nova/broadcast', { phones, message }),
  novaFounderReport: (period: string) => api.post('/nova/founder-report', { period }),
  novaEmployeeReports: (date?: string) => api.get('/nova/employee-reports', { params: date ? { date } : {} }),
  novaEmployeeReportById: (id: string) => api.get(`/nova/employee-reports/${id}`),
  novaSendMorningBriefings: () => api.post('/nova/send-morning-briefings'),
  novaRequestEodReports: () => api.post('/nova/request-eod-reports'),
  novaSendTeamReport: () => api.post('/nova/send-team-report'),
  novaManualReport: (id: string, text: string) => api.post(`/nova/manual-report/${id}`, { text }),
  novaEmployeeTasks: (id: string) => api.get(`/nova/employee-tasks/${id}`),
  // Reports
  reportCommission: (params?: any) => api.get('/admin/reports/commission', { params }),
  reportSales: (params?: any) => api.get('/admin/reports/sales', { params }),
  reportPerformance: (params?: any) => api.get('/admin/reports/performance', { params }),
  reportTeam: (params?: any) => api.get('/admin/reports/team', { params }),
  reportLearners: (params?: any) => api.get('/admin/reports/learners', { params }),
  // EMI
  emi: (params?: any) => api.get('/admin/emi', { params }),
  emiMarkPaid: (installmentId: string) => api.patch(`/admin/emi/${installmentId}/mark-paid`),
  emiCollectWallet: (installmentId: string) => api.post(`/admin/emi/${installmentId}/collect-wallet`),
  emiToggleAccess: (packagePurchaseId: string, lock: boolean) => api.patch(`/admin/emi/${packagePurchaseId}/toggle-access`, { lock }),
  // Report Cards
  reportCards: (status?: string) => api.get('/admin/report-cards', { params: { status } }),
  approveReportCard: (id: string) => api.patch(`/admin/report-cards/${id}/approve`),
  rejectReportCard: (id: string, data: any) => api.patch(`/admin/report-cards/${id}/reject`, data),
  // Mentor Salaries
  mentorSalaries: (params?: any) => api.get('/admin/mentor-salaries', { params }),
  createMentorSalary: (data: any) => api.post('/admin/mentor-salaries', data),
  approveMentorSalary: (id: string) => api.patch(`/admin/mentor-salaries/${id}/approve`),
  markMentorSalaryPaid: (id: string) => api.patch(`/admin/mentor-salaries/${id}/mark-paid`),
  deleteMentorSalary: (id: string) => api.delete(`/admin/mentor-salaries/${id}`),
  mentorsList: () => api.get('/admin/mentors-list'),
  // Employee Salaries
  employeeSalaries: (params?: any) => api.get('/admin/employee-salaries', { params }),
  createEmployeeSalary: (data: any) => api.post('/admin/employee-salaries', data),
  approveEmployeeSalary: (id: string) => api.patch(`/admin/employee-salaries/${id}/approve`),
  markEmployeeSalaryPaid: (id: string) => api.patch(`/admin/employee-salaries/${id}/mark-paid`),
  deleteEmployeeSalary: (id: string) => api.delete(`/admin/employee-salaries/${id}`),
  employeesForSalary: () => api.get('/admin/employees-for-salary'),
  updateEmployeeKyc: (id: string, data: any) => api.patch(`/admin/employees/${id}/kyc`, data),
  // Attendance
  attendance: (params?: any) => api.get('/admin/attendance', { params }),
  attendanceSummary: (params?: any) => api.get('/admin/attendance/summary', { params }),
  markAttendance: (data: any) => api.post('/admin/attendance/mark', data),
  bulkMarkAttendance: (data: any) => api.post('/admin/attendance/bulk-mark', data),
  calculateSalary: (params: any) => api.get('/admin/attendance/calculate-salary', { params }),
  // Holidays
  holidays: (params?: any) => api.get('/admin/holidays', { params }),
  createHoliday: (data: any) => api.post('/admin/holidays', data),
  deleteHoliday: (id: string) => api.delete(`/admin/holidays/${id}`),
  // Meetings
  meetings: () => api.get('/meetings'),
  meetingAnalytics: () => api.get('/meetings/analytics'),
  createMeeting: (data: any) => api.post('/meetings', data),
  updateMeeting: (id: string, data: any) => api.patch(`/meetings/${id}`, data),
  startMeeting: (id: string) => api.patch(`/meetings/${id}/start`),
  endMeeting: (id: string) => api.patch(`/meetings/${id}/end`),
  deleteMeeting: (id: string) => api.delete(`/meetings/${id}`),
  meetingLivekitToken: (id: string) => api.get(`/meetings/${id}/livekit-token`),
  // Security
  securityDashboard: () => api.get('/admin/security/dashboard'),
  securityLogs: (params?: any) => api.get('/admin/security/logs', { params }),
  securityBlocked: () => api.get('/admin/security/blocked'),
  securityBlock: (data: any) => api.post('/admin/security/block', data),
  securityUnblock: (ip: string) => api.delete(`/admin/security/block/${encodeURIComponent(ip)}`),
};

export default api;
