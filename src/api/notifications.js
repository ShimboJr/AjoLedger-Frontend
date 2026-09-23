import api from './axios.js';

export const notificationsApi = {
  /** GET /api/notifications — newest first, with unreadCount */
  list: () => api.get('/notifications').then((r) => r.data.data),

  /** PATCH /api/notifications/:id/read — mark one notification as read */
  readOne: (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data.data),

  /** POST /api/notifications/read-all */
  readAll: () => api.post('/notifications/read-all').then((r) => r.data.data),
};
