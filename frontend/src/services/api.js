import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/college/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach JWT to every request ──
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auto-refresh on 401 ──
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh: refreshToken });
        localStorage.setItem('access_token', res.data.access);
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
        return apiClient(originalRequest);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──
export const auth = {
  register: (data) => apiClient.post('/auth/register/', data),
  login: (data) => apiClient.post('/auth/login/', data),
  facultyLogin: (data) => apiClient.post('/auth/faculty-login/', data),
  studentLogin: (data) => apiClient.post('/auth/student-login/', data),
  adminLogin: (data) => apiClient.post('/auth/admin-login/', data),
  logout: (refresh) => apiClient.post('/auth/logout/', { refresh }),
  getCurrentUser: () => apiClient.get('/auth/current-user/'),
  changePassword: (data) => apiClient.post('/auth/change-password/', data),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password/', { email }),
  resetPassword: (token, password, email) => apiClient.post('/auth/reset-password/', { token, password, email }),
  getRegistrationOptions: () => apiClient.get('/auth/registration-options/'),
  getDepartmentsList: () => apiClient.get('/auth/departments-list/'),
};

// ── File upload helper ──
const uploadWithFile = (url, formData) => {
  const token = localStorage.getItem('access_token');
  return axios.put(`${API_BASE_URL}${url}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data', Authorization: token ? `Bearer ${token}` : undefined },
  });
};

// ── Students ──
export const students = {
  list: (params = {}) => apiClient.get('/students/', { params }),
  detail: (id) => apiClient.get(`/students/${id}/`),
  create: (data) => apiClient.post('/students/', data),
  update: (id, data) => apiClient.put(`/students/${id}/`, data),
  patch: (id, data) => apiClient.patch(`/students/${id}/`, data),
  updateWithFile: (id, formData) => uploadWithFile(`/students/${id}/`, formData),
  delete: (id) => apiClient.delete(`/students/${id}/`),
  addStudent: (data) => apiClient.post('/students/add-student/', data),
  myProfile: () => apiClient.get('/students/my_profile/'),
  feeSummary: () => apiClient.get('/students/fee_summary/'),
};

// ── Faculty ──
export const faculty = {
  list: (params = {}) => apiClient.get('/faculty/', { params }),
  detail: (id) => apiClient.get(`/faculty/${id}/`),
  create: (data) => apiClient.post('/faculty/', data),
  update: (id, data) => apiClient.put(`/faculty/${id}/`, data),
  patch: (id, data) => apiClient.patch(`/faculty/${id}/`, data),
  updateWithFile: (id, formData) => uploadWithFile(`/faculty/${id}/`, formData),
  delete: (id) => apiClient.delete(`/faculty/${id}/`),
  myProfile: () => apiClient.get('/faculty/my_profile/'),
};

// ── Courses ──
export const courses = {
  list: (params = {}) => apiClient.get('/courses/', { params }),
  detail: (id) => apiClient.get(`/courses/${id}/`),
  create: (data) => apiClient.post('/courses/', data),
  update: (id, data) => apiClient.put(`/courses/${id}/`, data),
  delete: (id) => apiClient.delete(`/courses/${id}/`),
};

// ── Departments ──
export const departments = {
  list: (params = {}) => apiClient.get('/departments/', { params }),
  detail: (id) => apiClient.get(`/departments/${id}/`),
  create: (data) => apiClient.post('/departments/', data),
  update: (id, data) => apiClient.put(`/departments/${id}/`, data),
  delete: (id) => apiClient.delete(`/departments/${id}/`),
};

// ── Fee Structures ──
export const feeStructures = {
  list: (params = {}) => apiClient.get('/fee-structures/', { params }),
  detail: (id) => apiClient.get(`/fee-structures/${id}/`),
  create: (data) => apiClient.post('/fee-structures/', data),
  update: (id, data) => apiClient.put(`/fee-structures/${id}/`, data),
  delete: (id) => apiClient.delete(`/fee-structures/${id}/`),
};

// ── Payments ──
export const payments = {
  list: (params = {}) => apiClient.get('/payments/', { params }),
  detail: (id) => apiClient.get(`/payments/${id}/`),
  create: (data) => apiClient.post('/payments/', data),
  update: (id, data) => apiClient.put(`/payments/${id}/`, data),
  patch: (id, data) => apiClient.patch(`/payments/${id}/`, data),
  delete: (id) => apiClient.delete(`/payments/${id}/`),
  myPayments: () => apiClient.get('/payments/my_payments/'),
  createOrder: (id) => apiClient.post(`/payments/${id}/create_razorpay_order/`),
  verifyPayment: (id, data) => apiClient.post(`/payments/${id}/verify_payment/`, data),
  sendNotification: (id, data) => apiClient.post(`/payments/${id}/send_notification/`, data),
  bulkCreate: (data) => apiClient.post('/payments/bulk_create/', data),
};

// ── Grades ──
export const grades = {
  list: (params = {}) => apiClient.get('/grades/', { params }),
  detail: (id) => apiClient.get(`/grades/${id}/`),
  create: (data) => apiClient.post('/grades/', data),
  update: (id, data) => apiClient.put(`/grades/${id}/`, data),
  delete: (id) => apiClient.delete(`/grades/${id}/`),
  myGrades: () => apiClient.get('/grades/my_grades/'),
};

// ── Attendance ──
export const attendance = {
  list: (params = {}) => apiClient.get('/attendance/', { params }),
  create: (data) => apiClient.post('/attendance/', data),
  update: (id, data) => apiClient.put(`/attendance/${id}/`, data),
  delete: (id) => apiClient.delete(`/attendance/${id}/`),
  myAttendance: () => apiClient.get('/attendance/my_attendance/'),
};

// ── Assignments ──
export const assignments = {
  list: (params = {}) => apiClient.get('/assignments/', { params }),
  create: (data) => apiClient.post('/assignments/', data),
  update: (id, data) => apiClient.put(`/assignments/${id}/`, data),
  delete: (id) => apiClient.delete(`/assignments/${id}/`),
  myCourseAssignments: () => apiClient.get('/assignments/my_course_assignments/'),
};

// ── Assignment Submissions ──
export const assignmentSubmissions = {
  list: (params = {}) => apiClient.get('/assignment-submissions/', { params }),
  detail: (id) => apiClient.get(`/assignment-submissions/${id}/`),
  create: (data) => apiClient.post('/assignment-submissions/', data),
  update: (id, data) => apiClient.put(`/assignment-submissions/${id}/`, data),
  delete: (id) => apiClient.delete(`/assignment-submissions/${id}/`),
  mySubmissions: () => apiClient.get('/assignment-submissions/my_submissions/'),
  courseSubmissions: () => apiClient.get('/assignment-submissions/course_submissions/'),
  approveSubmission: (id, data) => apiClient.post(`/assignment-submissions/${id}/approve_submission/`, data),
  rejectSubmission: (id, data) => apiClient.post(`/assignment-submissions/${id}/reject_submission/`, data),
};

// ── Notifications ──
export const notifications = {
  list: (params = {}) => apiClient.get('/notifications/', { params }),
  create: (data) => apiClient.post('/notifications/', data),
  delete: (id) => apiClient.delete(`/notifications/${id}/`),
  myNotifications: () => apiClient.get('/notifications/my_notifications/'),
  markRead: (id) => apiClient.post(`/notifications/${id}/mark_read/`),
};

// ── Enrollments ──
export const enrollments = {
  list: (params = {}) => apiClient.get('/course-enrollments/', { params }),
  myEnrollments: () => apiClient.get('/course-enrollments/my_enrollments/'),
};

// ── Timetable ──
export const timetable = {
  list: (params = {}) => apiClient.get('/timetable/', { params }),
  detail: (id) => apiClient.get(`/timetable/${id}/`),
  create: (data) => apiClient.post('/timetable/', data),
  update: (id, data) => apiClient.put(`/timetable/${id}/`, data),
  delete: (id) => apiClient.delete(`/timetable/${id}/`),
};

// ── Stats ──
export const stats = {
  getCounts: () => apiClient.get('/stats/'),
};

// ── Attendance by semester ──
export const attendanceBySemester = {
  list: (semester) => apiClient.get('/attendance/by-semester/', { params: { semester } }),
};

export default apiClient;
