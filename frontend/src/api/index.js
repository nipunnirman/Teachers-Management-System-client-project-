import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────
export const authAPI = {
  login:         (data)         => api.post('/auth/login', data),
  getMe:         ()             => api.get('/auth/me'),
  forgotPassword:(data)         => api.post('/auth/forgot-password', data),
  register:      (data)         => api.post('/auth/register', data),
  adminReset:    (id, data)     => api.put(`/auth/admin-reset-password/${id}`, data),
};

// ── Teachers ──────────────────────────────────────
export const teacherAPI = {
  getAll:   (params) => api.get('/teachers', { params }),
  getOne:   (id)     => api.get(`/teachers/${id}`),
  getMe:    ()       => api.get('/teachers/me'),
  update:   (id, d)  => api.put(`/teachers/${id}`, d),
  remove:   (id)     => api.delete(`/teachers/${id}`),
};

// ── Attendance ────────────────────────────────────
export const attendanceAPI = {
  mark:       (data)      => api.post('/attendance', data),
  getAll:     (params)    => api.get('/attendance', { params }),
  getMe:      (params)    => api.get('/attendance/me', { params }),
  edit:       (id, data)  => api.put(`/attendance/${id}`, data),
  monthReport:(id, params)=> api.get(`/attendance/report/${id}`, { params }),
};

// ── Leave ─────────────────────────────────────────
export const leaveAPI = {
  apply:   (data)        => api.post('/leaves', data),
  getAll:  (params)      => api.get('/leaves', { params }),
  review:  (id, data)    => api.put(`/leaves/${id}/review`, data),
  cancel:  (id)          => api.put(`/leaves/${id}/cancel`),
  balance: (id, params)  => api.get(`/leaves/balance/${id}`, { params }),
};

// ── Salary ────────────────────────────────────────
export const salaryAPI = {
  generate:  (data)     => api.post('/salary/generate', data),
  getAll:    (params)   => api.get('/salary', { params }),
  getMe:     ()         => api.get('/salary/me'),
  getOne:    (id)       => api.get(`/salary/${id}`),
  update:    (id, data) => api.put(`/salary/${id}`, data),
  markPaid:  (id)       => api.put(`/salary/${id}/mark-paid`),
};

// ── Timetable ─────────────────────────────────────
export const timetableAPI = {
  create:  (data)     => api.post('/timetable', data),
  getAll:  (params)   => api.get('/timetable', { params }),
  getMe:   (params)   => api.get('/timetable/me', { params }),
  update:  (id, data) => api.put(`/timetable/${id}`, data),
  remove:  (id)       => api.delete(`/timetable/${id}`),
};

// ── Notifications ─────────────────────────────────
export const notifAPI = {
  getAll:      (params) => api.get('/notifications', { params }),
  markRead:    (id)     => api.put(`/notifications/${id}/read`),
  markAllRead: ()       => api.put('/notifications/read-all'),
  announce:    (data)   => api.post('/notifications/announce', data),
  remove:      (id)     => api.delete(`/notifications/${id}`),
};

// ── Reports ───────────────────────────────────────
export const reportAPI = {
  dashboard:  () => api.get('/reports/dashboard'),
  attendance: (params) => api.get('/reports/attendance', { params }),
  leave:      (params) => api.get('/reports/leave', { params }),
  salary:     (params) => api.get('/reports/salary', { params }),
  workload:   (params) => api.get('/reports/workload', { params }),
};
