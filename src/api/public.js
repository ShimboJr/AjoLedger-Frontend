/**
 * public.js — unauthenticated public API calls.
 * Uses a bare fetch (no Bearer token) so links work without login.
 *
 * VITE_API_URL is already "/api"-suffixed (e.g. "https://api.example.com/api").
 * The public endpoint lives at /api/public/..., so we must NOT prepend the
 * full VITE_API_URL — we only need the origin (scheme + host + port).
 * We derive it by stripping the trailing "/api" segment when present.
 */

const API_URL  = import.meta.env.VITE_API_URL ?? '';
// Strip the "/api" suffix so we can compose paths without doubling it.
const ORIGIN   = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;

export const publicApi = {
  /**
   * GET /api/public/trust/:slug — fetch a public trust profile.
   * Returns null on 404 (unknown slug or private profile).
   */
  getTrustProfile: async (slug) => {
    const res = await fetch(`${ORIGIN}/api/public/trust/${encodeURIComponent(slug)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to load trust profile (${res.status})`);
    const json = await res.json();
    return json.data;
  },
};
