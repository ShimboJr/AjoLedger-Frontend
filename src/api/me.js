import api from './axios.js';

export const meApi = {
  /** GET /api/me/trust */
  getTrust: () => api.get('/me/trust').then((r) => r.data.data),
};
