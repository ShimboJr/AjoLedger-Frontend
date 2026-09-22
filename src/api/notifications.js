import api from './axios.js';

export const notificationsApi = {
  /** GET /api/notifications — newest first, with unreadCount */
  list: () => api.get('/notifications').then((r) => r.data.data),

  /** POST /api/notifications/read-all */
  readAll: () => api.post('/notifications/read-all').then((r) => r.data.data),
};
