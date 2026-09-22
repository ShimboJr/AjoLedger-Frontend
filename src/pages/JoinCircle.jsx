import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { circlesApi } from '../api/circles.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatNaira } from '../utils/money.js';
import { Skeleton } from '../components/LoadingSkeleton.jsx';

const FREQ_LABEL = { weekly: 'week', biweekly: '2 weeks', monthly: 'month' };

export default function JoinCircle() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [preview, setPreview]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [joining, setJoining]   = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joined, setJoined]       = useState(false);

  // Load public preview (no auth required)
  useEffect(() => {
    circlesApi.preview(code)
      .then(setPreview)
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [code]);

  // Auto-redirect after successful join
  useEffect(() => {
    if (joined && preview?.circleId) {
      const timer = setTimeout(() => navigate(`/circles/${preview.circleId}`), 1200);
      return () => clearTimeout(timer);
    }
  }, [joined, preview, navigate]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading || authLoading) {
    return (
      <div className="page-container max-w-sm space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="card space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="page-container max-w-sm text-center space-y-4 pt-12">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        </div>
        <h1 className="font-display text-xl font-bold text-slate-900">Link not found</h1>
        <p className="text-sm text-slate-500">This invite link is invalid or has expired. Ask the organiser for a new one.</p>
        <Link to="/" className="btn-ghost text-sm">Go home</Link>
      </div>
    );
  }

  // ── Joined success ─────────────────────────────────────────────────────────
  if (joined) {
    return (
      <div className="page-container max-w-sm text-center space-y-3 pt-12">
        <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <h2 className="font-display text-xl font-bold text-slate-900">You're in!</h2>
        <p className="text-sm text-slate-500">Redirecting to the circle…</p>
      </div>
    );
  }

  if (!preview) return null;

  // ── Preview card ───────────────────────────────────────────────────────────
  async function handleJoin() {
    if (!user) {
      // Send to login with redirect back here
      navigate(`/login?redirect=/join/${code}`);
      return;
    }
    setJoinError('');
    setJoining(true);
    try {
      await circlesApi.join(code);
      setJoined(true);
    } catch (err) {
      const msg = err.response?.data?.error?.message ?? 'Could not join. Please try again.';
      // If already a member, redirect to the circle
      if (err.response?.status === 409 && msg.toLowerCase().includes('already')) {
        navigate(`/circles/${preview.circleId}`);
        return;
      }
      setJoinError(msg);
    } finally {
      setJoining(false);
    }
  }

  const spotsLeft = preview.spotsLeft;
  const canJoin = preview.joinable;

  return (
    <div className="page-container max-w-sm">
      <div className="mb-6 text-center space-y-1">
        <p className="text-sm text-slate-400">{preview.organizer.firstName} invites you to join</p>
        <h1 className="font-display text-2xl font-bold text-slate-900">{preview.name}</h1>
      </div>

      {/* Details card */}
      <div className="card space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Contribution</p>
            <p className="font-semibold text-slate-800">{formatNaira(preview.contributionKobo)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Frequency</p>
            <p className="font-semibold text-slate-800">Every {FREQ_LABEL[preview.frequency] ?? preview.frequency}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Max members</p>
            <p className="font-semibold text-slate-800">{preview.maxMembers}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Spots left</p>
            <p className={`font-semibold ${spotsLeft === 0 ? 'text-danger-600' : 'text-slate-800'}`}>
              {spotsLeft}
            </p>
          </div>
        </div>

        {/* Not joinable reason */}
        {!canJoin && preview.reason && (
          <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            {preview.reason}
          </div>
        )}
      </div>

      {/* Join error */}
      {joinError && (
        <div role="alert" className="mb-4 px-4 py-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-sm">
          {joinError}
        </div>
      )}

      {/* CTA */}
      {canJoin ? (
        user ? (
          <button
            id="join-circle-btn"
            onClick={handleJoin}
            disabled={joining}
            className="btn-primary w-full"
          >
            {joining ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Joining…
              </span>
            ) : `Join ${preview.name}`}
          </button>
        ) : (
          <div className="space-y-3">
            <button
              id="join-login-btn"
              onClick={() => navigate(`/login?redirect=/join/${code}`)}
              className="btn-primary w-full"
            >
              Sign in to join
            </button>
            <button
              onClick={() => navigate(`/register?redirect=/join/${code}`)}
              className="btn-ghost w-full"
            >
              Create an account
            </button>
          </div>
        )
      ) : (
        <Link to="/" className="btn-ghost w-full text-center block">
          Browse other circles
        </Link>
      )}
    </div>
  );
}
