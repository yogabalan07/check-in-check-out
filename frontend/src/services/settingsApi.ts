import api from './api';
import { HackathonSettings } from '../types';

export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: Partial<HackathonSettings>) => api.put('/settings', data),
};