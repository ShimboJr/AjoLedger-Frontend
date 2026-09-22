import api from './axios.js';

export const meApi = {
  /** GET /api/me/trust — full profile including slug, isPublic, publicUrl */
  getTrust: () => api.get('/me/trust').then((r) => r.data.data),

  /**
   * PATCH /api/me/trust
   * @param {{ isPublic?: boolean, regenerateSlug?: boolean }} opts
   */
  patchTrust: (opts) => api.patch('/me/trust', opts).then((r) => r.data.data),
};
