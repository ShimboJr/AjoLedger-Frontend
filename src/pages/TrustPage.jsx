import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { meApi } from '../api/me.js';

// ── Tier config ────────────────────────────────────────────────────────────────

const TIER_CFG = {
  excellent: { color: '#10b981', bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200' },
  good:      { color: '#0f4c81', bg: 'bg-blue-50',     text: 'text-blue-800',     border: 'border-blue-200'    },
  fair:      { color: '#f59e0b', bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200'   },
  poor:      { color: '#ef4444', bg: 'bg-red-50',      text: 'text-red-700',      border: 'border-red-200'     },
  building:  { color: '#94a3b8', bg: 'bg-slate-50',    text: 'text-slate-600',    border: 'border-slate-200'   },
};

// ── Score ring ─────────────────────────────────────────────────────────────────

function ScoreRing({ score, tier, size = 96 }) {
  const cfg  = TIER_CFG[tier] ?? TIER_CFG.building;
  const r    = size * 0.4;
  const circ = 2 * Math.PI * r;
  const pct  = score !== null ? score / 100 : 0;
  const dash = pct * circ;
  const cx   = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e2e8f0" strokeWidth={size * 0.065} />
      {score !== null && (
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={cfg.color}
          strokeWidth={size * 0.065}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{ transition: 'stroke-dasharray 0.7s ease' }}
        />
      )}
      <text x={cx} y={cx - 4} textAnchor="middle" dominantBaseline="middle"
        style={{ fill: cfg.color, fontWeight: 800, fontSize: size * 0.22 }}>
        {score !== null ? score : '—'}
      </text>
      {score !== null && (
        <text x={cx} y={cx + size * 0.18} textAnchor="middle" dominantBaseline="middle"
          style={{ fill: '#94a3b8', fontSize: size * 0.12 }}>%</text>
      )}
    </svg>
  );
}

// ── Copy button ────────────────────────────────────────────────────────────────

function CopyButton({ text, id }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      id={id}
      onClick={handleCopy}
      className="btn-ghost text-xs px-3 py-2 shrink-0"
      style={{ minHeight: 44, minWidth: 64 }}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function TrustPage() {
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [toggling, setToggling] = useState(false);
  const [regenerating, setRegen]= useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [toast, setToast]       = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const load = useCallback(async () => {
    try {
      const data = await meApi.getTrust();
      setProfile(data);
    } catch {
      setError('Could not load your trust profile. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTogglePublic = async () => {
    if (!profile) return;
    setToggling(true);
    try {
      const updated = await meApi.patchTrust({ isPublic: !profile.isPublic });
      setProfile((p) => ({ ...p, ...updated }));
      showToast(updated.isPublic ? 'Profile is now public.' : 'Profile is now private.');
    } catch {
      showToast('Failed to update. Please try again.');
    } finally {
      setToggling(false);
    }
  };

  const handleRegenerate = async () => {
    setConfirmRegen(false);
    setRegen(true);
    try {
      const updated = await meApi.patchTrust({ regenerateSlug: true });
      setProfile((p) => ({ ...p, ...updated }));
      showToast('Link regenerated. Old link is now invalid.');
    } catch {
      showToast('Failed to regenerate link. Please try again.');
    } finally {
      setRegen(false);
    }
  };

  const cfg = TIER_CFG[profile?.tier] ?? TIER_CFG.building;

  if (loading) {
    return (
      <div className="page-container">
        <div className="animate-pulse space-y-4 pt-4">
          <div className="h-8 bg-slate-100 rounded-xl w-40" />
          <div className="card h-40" />
          <div className="card h-32" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div role="alert" className="card text-danger-700 bg-danger-50 border border-danger-200 text-sm p-4">
          {error}
        </div>
      </div>
    );
  }

  const isBuilding = profile?.tier === 'building';
  const waUrl = profile?.publicUrl
    ? `https://wa.me/?text=${encodeURIComponent(`Check my AjoLedger reliability score: ${profile.publicUrl}`)}`
    : '#';

  return (
    <div className="page-container">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          className="fixed top-4 inset-x-4 max-w-md mx-auto z-50 bg-slate-800 text-white text-sm rounded-xl px-4 py-3 shadow-xl"
        >
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900">My Reliability</h1>
        <p className="text-sm text-slate-500 mt-0.5">Your verified payment score</p>
      </div>

      {/* Score card */}
      <div className={`card flex items-center gap-5 mb-4 border ${cfg.border}`}>
        <ScoreRing score={profile?.score} tier={profile?.tier} size={96} />
        <div className="flex-1 min-w-0">
          <span className={`chip text-xs ${cfg.bg} ${cfg.text} ${cfg.border} border mb-1`}>
            {profile?.tier === 'building' ? 'Building' : profile?.tier?.charAt(0).toUpperCase() + profile?.tier?.slice(1)}
          </span>
          <p className="font-semibold text-slate-800 text-sm leading-snug">{profile?.label}</p>
          {isBuilding ? (
            <div className="mt-2">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(((profile?.resolved ?? 0) / 3) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {profile?.resolved ?? 0} of 3 payments needed to earn a score
              </p>
            </div>
          ) : (
            <div className="flex gap-4 mt-2 text-sm text-slate-500">
              <span><span className="font-bold text-emerald-600">{profile?.onTime}</span> on time</span>
              <span><span className="font-bold text-amber-500">{profile?.late}</span> late</span>
              <span><span className="font-bold text-red-500">{profile?.missed}</span> missed</span>
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="card mb-4">
        <p className="text-sm font-semibold text-slate-700 mb-2">How your score is calculated</p>
        <ul className="text-xs text-slate-500 space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold mt-0.5">●</span>
            <span><span className="font-semibold text-slate-700">On time</span> — full credit. Shows you're reliable.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 font-bold mt-0.5">●</span>
            <span><span className="font-semibold text-slate-700">Late</span> — half credit. Paid but after the due date.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 font-bold mt-0.5">●</span>
            <span><span className="font-semibold text-slate-700">Missed</span> — no credit. Obligation not fulfilled.</span>
          </li>
        </ul>
        <p className="text-[11px] text-slate-400 mt-3 border-t border-slate-100 pt-2">
          You need at least 3 completed obligations to earn a score.
          Circles joined: <strong>{profile?.circlesJoined ?? 0}</strong> ·
          Completed: <strong>{profile?.circlesCompleted ?? 0}</strong>
        </p>
      </div>

      {/* Share toggle */}
      <div className="card mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">Share my Trust Profile</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Anyone with the link will see your name, score, tier and counts — nothing else.
            </p>
          </div>
          {/* Toggle switch */}
          <button
            id="trust-public-toggle"
            role="switch"
            aria-checked={profile?.isPublic ?? false}
            onClick={handleTogglePublic}
            disabled={toggling}
            style={{ minWidth: 48, minHeight: 28 }}
            className={`relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              profile?.isPublic ? 'bg-primary-600' : 'bg-slate-200'
            } ${toggling ? 'opacity-50' : ''}`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                profile?.isPublic ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Privacy note */}
        <div className="mt-3 text-[11px] text-slate-400 bg-slate-50 rounded-lg p-2.5 space-y-1">
          <p className="font-semibold text-slate-500">What becomes public when on:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Display name (first name + last initial only, e.g. "Ada O.")</li>
            <li>Reliability score and tier</li>
            <li>On-time / late / missed counts</li>
            <li>Circles completed and member-since month</li>
          </ul>
          <p className="pt-1 font-medium text-slate-400">
            Your email, circle names, and amounts are <strong>never</strong> shown.
          </p>
        </div>

        {/* Private-link warning — shown when sharing is OFF but a slug exists */}
        {!profile?.isPublic && profile?.slug && (
          <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
            <span className="text-amber-500 text-sm shrink-0 mt-0.5" aria-hidden="true">⚠️</span>
            <p className="text-xs text-amber-700">
              <span className="font-semibold">Your profile link is private.</span>{' '}
              Anyone who opens your link sees "Profile not found." Toggle sharing <strong>on</strong> above to make it accessible.
            </p>
          </div>
        )}

        {/* Public link (when enabled) */}
        {profile?.isPublic && profile?.publicUrl && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-slate-600">Your public link</p>
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-200 pr-1 overflow-hidden">
              <p
                id="trust-public-url"
                className="flex-1 text-xs text-slate-600 px-3 py-2.5 truncate"
              >
                {profile.publicUrl}
              </p>
              <CopyButton text={profile.publicUrl} id="trust-copy-link" />
            </div>

            {/* WhatsApp share */}
            <a
              id="trust-whatsapp-btn"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: '#25D366', minHeight: 44 }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                <path d="M12.001 2C6.477 2 2 6.477 2 12c0 1.89.526 3.66 1.44 5.18L2 22l4.894-1.418A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12.001 2zm0 18a7.95 7.95 0 0 1-4.06-1.1l-.29-.17-3.007.87.896-2.916-.19-.3A7.96 7.96 0 0 1 4 12c0-4.41 3.59-8 8.001-8C16.41 4 20 7.59 20 12s-3.59 8-7.999 8zm4.51-5.833c-.247-.124-1.464-.723-1.691-.805-.226-.083-.39-.124-.556.125-.165.248-.64.805-.784.97-.145.163-.29.184-.537.062-.247-.124-1.044-.385-1.988-1.229-.735-.655-1.232-1.465-1.376-1.713-.144-.247-.015-.38.108-.504.11-.11.247-.288.371-.432.124-.145.165-.248.248-.413.083-.166.041-.31-.021-.433-.062-.124-.556-1.341-.762-1.836-.2-.48-.404-.415-.556-.423l-.474-.008c-.165 0-.432.062-.659.31-.226.247-.864.844-.864 2.06 0 1.215.886 2.389 1.01 2.554.124.165 1.74 2.656 4.217 3.726.59.254 1.05.406 1.408.52.592.188 1.131.162 1.558.098.475-.07 1.464-.598 1.67-1.175.206-.578.206-1.073.144-1.175-.062-.103-.226-.165-.474-.29z"/>
              </svg>
              Share on WhatsApp
            </a>

            {/* Regenerate link */}
            {!confirmRegen ? (
              <button
                id="trust-regen-btn"
                onClick={() => setConfirmRegen(true)}
                className="text-xs text-slate-400 underline hover:text-slate-600 transition-colors w-full text-center py-1"
                style={{ minHeight: 36 }}
              >
                Regenerate link (invalidates old link)
              </button>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                <p className="text-xs text-amber-700 font-medium">
                  This will invalidate your current link immediately. Anyone who saved it won't be able to use it.
                </p>
                <div className="flex gap-2">
                  <button
                    id="trust-regen-confirm-btn"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="btn-primary text-xs px-3 py-2 flex-1"
                    style={{ minHeight: 44 }}
                  >
                    {regenerating ? 'Regenerating…' : 'Yes, regenerate'}
                  </button>
                  <button
                    onClick={() => setConfirmRegen(false)}
                    className="btn-ghost text-xs px-3 py-2 flex-1"
                    style={{ minHeight: 44 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Back to circles */}
      <div className="text-center pt-2 pb-24">
        <Link to="/dashboard" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
          ← Back to Circles
        </Link>
      </div>
    </div>
  );
}
