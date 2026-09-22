import api from './axios.js';

export const circlesApi = {
  /** Create a new circle. Sends kobo on the wire. */
  create: (data) => api.post('/circles', data).then((r) => r.data.data),

  /** List all circles the current user belongs to. */
  list: () => api.get('/circles').then((r) => r.data.data),

  /** Get full circle detail (members only). */
  get: (id) => api.get(`/circles/${id}`).then((r) => r.data.data),

  /** Public preview by invite code — no auth required. */
  preview: (code) => api.get(`/circles/join/${code}`).then((r) => r.data.data),

  /** Join a circle by invite code (auth required). */
  join: (code) => api.post(`/circles/join/${code}`).then((r) => r.data.data),

  /** Reorder payout positions. `order` is an array of user IDs in desired order. */
  reorder: (id, order) =>
    api.patch(`/circles/${id}/payout-order`, { order }).then((r) => r.data.data),

  /** Start a circle — locks membership and creates all cycles. */
  start: (id) => api.post(`/circles/${id}/start`).then((r) => r.data.data),
};
