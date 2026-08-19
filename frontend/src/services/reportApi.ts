import api from './api';

export const reportApi = {
  getAttendance: (params?: Record<string, any>) =>
    api.get('/reports/attendance', { params }),
  getCurrentlyInside: () =>
    api.get('/reports/currently-inside'),
  downloadCSV: (params?: Record<string, any>) =>
    api.get('/reports/attendance', { params: { ...params, format: 'csv' }, responseType: 'blob' }),
  downloadExcel: (params?: Record<string, any>) =>
    api.get('/reports/attendance', { params: { ...params, format: 'excel' }, responseType: 'blob' }),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getRecent: (limit?: number) => api.get('/dashboard/recent', { params: { limit } }),
};

export const hallApi = {
  getAll: () => api.get('/halls'),
  create: (data: { name: string; location?: string }) => api.post('/halls', data),
  update: (id: string, data: { name: string; location?: string }) => api.put(`/halls/${id}`, data),
  delete: (id: string) => api.delete(`/halls/${id}`),
};

export const qrApi = {
  generate: (type: string, hall?: string) =>
    api.get('/qr/generate', { params: { type, hall } }),
};
