import api from './api';

export const participantApi = {
  getAll: (params?: Record<string, any>) =>
    api.get('/participants', { params }),
  getById: (id: string) =>
    api.get(`/participants/${id}`),
  create: (data: any) =>
    api.post('/participants', data),
  update: (id: string, data: any) =>
    api.put(`/participants/${id}`, data),
  delete: (id: string) =>
    api.delete(`/participants/${id}`),
  import: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/participants/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  exportCSV: (params?: Record<string, any>) =>
    api.get('/participants/export', {
      params,
      responseType: 'blob',
    }),
};
