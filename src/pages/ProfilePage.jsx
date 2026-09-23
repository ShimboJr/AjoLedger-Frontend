import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios.js';
import { formatMonthYear } from '../utils/dates.js';

// ── Skeleton loader ─────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="page-container animate-pulse" aria-label="Loading profile">
      {/* Avatar + name block */}
      <div className="flex flex-col items-center gap-3 pt-6 pb-8">
        <div className="w-16 h-16 rounded-full bg-slate-200" />
        <div className="h-6 w-36 bg-slate-200 rounded-lg" />
        <div className="h-4 w-48 bg-slate-100 rounded-lg" />
      </div>
      {/* Info card */}
      <div className="card h-16 mb-4" />
      {/* Trust link card */}
      <div className="card h-14 mb-4" />
      {/* Logout */}
      <div className="h-12 bg-slate-100 rounded-xl mt-8" />
    </div>
  );
}

// ── Avatar initials ──────────────────────────────────────────────────────────

function Avatar({ name }) {
  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')
    : '?';

  return (
    <div
      aria-hidden="true"
      className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white select-none shrink-0"
      style={{ background: 'linear-gradient(135deg, #0f4c81 0%, #1a6fba 100%)' }}
    >
      {initials}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user: ctxUser, logout } = useAuth();
  const navigate = useNavigate();

  // We fetch fresh data from /auth/me so we always show the latest state
  // (including createdAt which may not be on the in-memory ctxUser if it was
  // set from an older login response).
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setProfile(res.data.data.user);
    } catch {
      setError('Could not load your profile. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleLogout() {
    logout();          // clears localStorage token + resets in-memory user state
    navigate('/login', { replace: true });
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return <ProfileSkeleton />;

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="page-container">
        <div role="alert" className="card bg-red-50 border border-red-200 text-red-700 text-sm p-4 mt-6">
          {error}
        </div>
        {/* Still show logout even on error — user may want to try a different account */}
        <div className="pt-10">
          <button
            id="profile-logout-btn"
            onClick={handleLogout}
            className="w-full rounded-xl border-2 border-red-500 text-red-600 font-semibold text-sm py-3 transition-colors hover:bg-red-50 active:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
            style={{ minHeight: 48 }}
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  // Prefer fresh fetched data; fall back to AuthContext user
  const displayUser = profile ?? ctxUser;

  return (
    <div className="page-container">

      {/* ── Header: avatar, name, email ─────────────────────────────────── */}
      <div className="flex flex-col items-center gap-2 pt-6 pb-7">
        <Avatar name={displayUser?.name} />
        <h1
          id="profile-name"
          className="font-display text-xl font-bold text-slate-900 mt-1 text-center leading-tight"
        >
          {displayUser?.name ?? '—'}
        </h1>
        <p
          id="profile-email"
          className="text-sm text-slate-500 text-center"
        >
          {displayUser?.email ?? '—'}
        </p>
      </div>

      {/* ── Info card: Member since ──────────────────────────────────────── */}
      <div className="card mb-4 flex items-center gap-3">
        {/* Calendar icon */}
        <span
          aria-hidden="true"
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: '#e8f1fb' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0f4c81" className="w-5 h-5">
            <path
              fillRule="evenodd"
              d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Member since</p>
          <p id="profile-member-since" className="text-sm font-semibold text-slate-800">
            {displayUser?.createdAt ? formatMonthYear(displayUser.createdAt) : '—'}
          </p>
        </div>
      </div>

      {/* ── View Trust Profile link ──────────────────────────────────────── */}
      {/* TrustPage is built — link is safe. We guard defensively anyway. */}
      <Link
        id="profile-trust-link"
        to="/trust"
        className="card mb-4 flex items-center justify-between gap-3 hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#e8f1fb' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0f4c81" className="w-5 h-5">
              <path
                fillRule="evenodd"
                d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">My Trust Profile</p>
            <p className="text-xs text-slate-500">View score, tier, and sharing settings</p>
          </div>
        </div>
        {/* Chevron */}
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="w-4 h-4 text-slate-400 shrink-0"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </Link>

      {/* ── Logout button — visually distinct, red outline ───────────────── */}
      <div className="mt-8 border-t border-slate-100 pt-8">
        <button
          id="profile-logout-btn"
          onClick={handleLogout}
          className="w-full rounded-xl border-2 border-red-500 text-red-600 font-semibold text-sm py-3 transition-colors hover:bg-red-50 active:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
          style={{ minHeight: 48 }}
        >
          Log out
        </button>
      </div>

    </div>
  );
}
