import api from './axios.js';

export const paymentsApi = {
  /**
   * Initialise a Paystack checkout for the current user's pending obligation
   * in the given circle. Returns { authorizationUrl, reference }.
   */
  contribute: (circleId) =>
    api.post(`/circles/${circleId}/contribute`).then((r) => r.data.data),

  /**
   * Verify and settle a payment by reference (browser callback page).
   * Idempotent — safe to call on refresh.
   * Returns { payment, obligation, settled, alreadySettled, reason? }.
   */
  verify: (reference) =>
    api.get(`/payments/verify/${reference}`).then((r) => r.data.data),

  /**
   * Get the ledger entries for a circle (cursor-paginated, seq ascending).
   * Returns { entries, nextCursor, hasMore }.
   */
  getLedger: (circleId, { limit = 20, cursor = null } = {}) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor !== null) params.set('cursor', String(cursor));
    return api.get(`/circles/${circleId}/ledger?${params}`).then((r) => r.data.data);
  },

  /**
   * Re-verify the hash chain for a circle.
   * Returns { ok, checked, brokenAtSeq?, reason? }.
   */
  verifyLedger: (circleId) =>
    api.get(`/circles/${circleId}/ledger/verify`).then((r) => r.data.data),
};
