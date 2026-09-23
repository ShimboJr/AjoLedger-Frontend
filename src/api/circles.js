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

  /**
   * Simulate a time-jump (DEMO_MODE only, organizer only).
   * action: 'pass-due-date' | 'close-cycle'
   */
  simulate: (id, action) =>
    api.post(`/circles/${id}/simulate`, { action }, { timeout: 60_000 }).then((r) => r.data.data),

  /**
   * Download the ledger as a CSV blob.
   * Uses Bearer token via axios so auth is preserved.
   * @returns {Promise<{ blob: Blob, filename: string }>}
   */
  downloadLedgerCsv: async (id) => {
    const response = await api.get(`/circles/${id}/ledger.csv`, {
      responseType: 'blob',
    });
    // Extract filename from Content-Disposition header
    const disposition = response.headers['content-disposition'] ?? '';
    const match = disposition.match(/filename="([^"]+)"/);
    const filename = match ? match[1] : `ledger-${id}.csv`;
    return { blob: response.data, filename };
  },
};

