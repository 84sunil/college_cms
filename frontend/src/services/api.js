import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/college/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(
          `${API_BASE_URL}/auth/token/refresh/`,
          { refresh: refreshToken }
        );

        localStorage.setItem('access_token', response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Authentication endpoints
export const auth = {
  register: (userData) => apiClient.post('/auth/register/', userData),
  login: (credentials) => apiClient.post('/auth/login/', credentials),
  facultyLogin: (credentials) => apiClient.post('/auth/faculty-login/', credentials),
  studentLogin: (credentials) => apiClient.post('/auth/student-login/', credentials),
  adminLogin: (credentials) => apiClient.post('/auth/admin-login/', credentials),
  logout: (refreshToken) => apiClient.post('/auth/logout/', { refresh: refreshToken }),
  getCurrentUser: () => apiClient.get('/auth/current-user/'),
  changePassword: (passwordData) => apiClient.post('/auth/change-password/', passwordData),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password/', { email }),
  resetPassword: (token, password, email) => apiClient.post('/auth/reset-password/', { token, password, email }),
  getRegistrationOptions: () => apiClient.get('/auth/registration-options/'),
  getDepartmentsList: () => apiClient.get('/auth/departments-list/'),
};

// Helper function for file uploads with multipart/form-data
const uploadWithFile = async (url, formData) => {
  const token = localStorage.getItem('access_token');
  return axios.put(url, formData, {
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });
};

// Students endpoints
export const students = {
  list: (page = 1) => apiClient.get('/students/', { params: { page } }),
  detail: (id) => apiClient.get(`/students/${id}/`),
  create: (data) => apiClient.post('/students/', data),
  update: (id, data) => apiClient.put(`/students/${id}/`, data),
  updateWithFile: (id, formData) => uploadWithFile(`${API_BASE_URL}/students/${id}/`, formData),
  delete: (id) => apiClient.delete(`/students/${id}/`),
  addStudent: (data) => apiClient.post('/students/add-student/', data),
};

// Faculty endpoints
export const faculty = {
  list: (page = 1) => apiClient.get('/faculty/', { params: { page } }),
  detail: (id) => apiClient.get(`/faculty/${id}/`),
  create: (data) => apiClient.post('/faculty/', data),
  update: (id, data) => apiClient.put(`/faculty/${id}/`, data),
  updateWithFile: (id, formData) => uploadWithFile(`${API_BASE_URL}/faculty/${id}/`, formData),
  delete: (id) => apiClient.delete(`/faculty/${id}/`),
};

// Courses endpoints
export const courses = {
  list: (page = 1) => apiClient.get('/courses/', { params: { page } }),
  detail: (id) => apiClient.get(`/courses/${id}/`),
  create: (data) => apiClient.post('/courses/', data),
  update: (id, data) => apiClient.put(`/courses/${id}/`, data),
  delete: (id) => apiClient.delete(`/courses/${id}/`),
};

// Departments endpoints
export const departments = {
  list: (page = 1) => apiClient.get('/departments/', { params: { page } }),
  detail: (id) => apiClient.get(`/departments/${id}/`),
  create: (data) => apiClient.post('/departments/', data),
  update: (id, data) => apiClient.put(`/departments/${id}/`, data),
  delete: (id) => apiClient.delete(`/departments/${id}/`),
};

// Payments endpoints
export const payments = {
  list: (page = 1) => apiClient.get('/payments/', { params: { page } }),
  detail: (id) => apiClient.get(`/payments/${id}/`),
  create: (data) => apiClient.post('/payments/', data),
  update: (id, data) => apiClient.put(`/payments/${id}/`, data),
  delete: (id) => apiClient.delete(`/payments/${id}/`),
  myPayments: () => apiClient.get('/payments/my_payments/'),
  sendNotification: (id, data) => apiClient.post(`/payments/${id}/send-notification/`, data),
};

// Grades endpoints
export const grades = {
  list: (page = 1) => apiClient.get('/grades/', { params: { page } }),
  detail: (id) => apiClient.get(`/grades/${id}/`),
  create: (data) => apiClient.post('/grades/', data),
  update: (id, data) => apiClient.put(`/grades/${id}/`, data),
  delete: (id) => apiClient.delete(`/grades/${id}/`),
  myGrades: () => apiClient.get('/grades/my_grades/'),
};

export const attendance = {
  list: (page = 1) => apiClient.get('/attendance/', { params: { page } }),
  create: (data) => apiClient.post('/attendance/', data),
  myAttendance: () => apiClient.get('/attendance/my_attendance/'),
};

export const assignments = {
  list: (page = 1) => apiClient.get('/assignments/', { params: { page } }),
  create: (data) => apiClient.post('/assignments/', data),
  update: (id, data) => apiClient.put(`/assignments/${id}/`, data),
  delete: (id) => apiClient.delete(`/assignments/${id}/`),
  myCourseAssignments: () => apiClient.get('/assignments/my_course_assignments/'),
};

export const notifications = {
  list: (page = 1) => apiClient.get('/notifications/', { params: { page } }),
  create: (data) => apiClient.post('/notifications/', data),
  delete: (id) => apiClient.delete(`/notifications/${id}/`),
  myNotifications: () => apiClient.get('/notifications/my_notifications/'),
};

export const enrollments = {
  list: (page = 1) => apiClient.get('/course-enrollments/', { params: { page } }),
  myEnrollments: () => apiClient.get('/course-enrollments/my_enrollments/'),
};

// Dashboard stats endpoint
export const stats = {
  getCounts: () => apiClient.get('/stats/'),
};

// Timetable endpoints
export const timetable = {
  list: (page = 1) => apiClient.get('/timetable/', { params: { page } }),
  detail: (id) => apiClient.get(`/timetable/${id}/`),
  create: (data) => apiClient.post('/timetable/', data),
  update: (id, data) => apiClient.put(`/timetable/${id}/`, data),
  delete: (id) => apiClient.delete(`/timetable/${id}/`),
  byCourse: (courseId) => apiClient.get(`/timetable/?course=${courseId}`),
};

// Attendance endpoints with semester filtering
export const attendanceBySemester = {
  list: (semester) => apiClient.get('/attendance/by-semester/', { params: { semester } }),
};

// Assignment Submission endpoints
export const assignmentSubmissions = {
  list: (page = 1) => apiClient.get('/assignment-submissions/', { params: { page } }),
  detail: (id) => apiClient.get(`/assignment-submissions/${id}/`),
  create: (data) => apiClient.post('/assignment-submissions/', data),
  update: (id, data) => apiClient.put(`/assignment-submissions/${id}/`, data),
  delete: (id) => apiClient.delete(`/assignment-submissions/${id}/`),
  mySubmissions: () => apiClient.get('/assignment-submissions/my_submissions/'),
  courseSubmissions: () => apiClient.get('/assignment-submissions/course_submissions/'),
  approveSubmission: (id, data) => apiClient.post(`/assignment-submissions/${id}/approve_submission/`, data),
  rejectSubmission: (id, data) => apiClient.post(`/assignment-submissions/${id}/reject_submission/`, data),
};

export default apiClient;
