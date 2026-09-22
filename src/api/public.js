/**
 * public.js — unauthenticated public API calls.
 * Uses a bare fetch (no Bearer token) so links work without login.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export const publicApi = {
  /**
   * GET /api/public/trust/:slug — fetch a public trust profile.
   * Returns null on 404 (unknown slug or private profile).
   */
  getTrustProfile: async (slug) => {
    const res = await fetch(`${BASE_URL}/api/public/trust/${encodeURIComponent(slug)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to load trust profile (${res.status})`);
    const json = await res.json();
    return json.data;
  },
};
