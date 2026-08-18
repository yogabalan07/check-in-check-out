import api from './api';

export const attendanceApi = {
  checkIn: (registerNumber: string, hall?: string) =>
    api.post('/attendance/check-in', { registerNumber, hall }),
  checkOut: (registerNumber: string, hall?: string) =>
    api.post('/attendance/check-out', { registerNumber, hall }),
  getAll: (params?: Record<string, any>) =>
    api.get('/attendance', { params }),
  getById: (id: string) =>
    api.get(`/attendance/${id}`),
};
