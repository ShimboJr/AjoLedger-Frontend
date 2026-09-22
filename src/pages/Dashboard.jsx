import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { circlesApi } from '../api/circles.js';
import { meApi } from '../api/me.js';
import { formatNaira } from '../utils/money.js';
import { formatDate, relativeDays } from '../utils/dates.js';
import { CircleCardSkeleton } from '../components/LoadingSkeleton.jsx';
import StatusChip from '../components/StatusChip.jsx';

const FREQ_LABEL = { weekly: 'weekly', biweekly: 'every 2 weeks', monthly: 'monthly' };

const STATUS_CHIP = {
  forming:   'chip chip-amber',
  active:    'chip chip-green',
  completed: 'chip bg-slate-100 text-slate-500',
};

// ── Tier config ───────────────────────────────────────────────────────────────

const TIER_CFG = {
  excellent: { color: '#10b981', label: 'Exceptional — always pays on time' },
  good:      { color: '#0f4c81', label: 'Reliable — rarely misses' },
  fair:      { color: '#f59e0b', label: 'Developing — occasional delays' },
  poor:      { color: '#ef4444', label: 'Needs improvement' },
  building:  { color: '#94a3b8', label: 'Building your history' },
};

// ── Reliability card ──────────────────────────────────────────────────────────

function ReliabilityCard({ trust }) {
  if (!trust) return null;
  const { score, tier, onTime, late, missed, resolved } = trust;
  const cfg = TIER_CFG[tier] ?? TIER_CFG.building;
  const isBuilding = tier === 'building';

  // SVG ring
  const r    = 30;
  const circ = 2 * Math.PI * r;
  const pct  = score !== null ? score / 100 : 0;
  const dash = pct * circ;

  return (
    <Link to="/trust" className="card flex items-center gap-4 mb-4 hover:shadow-md transition-shadow active:scale-[0.99]" id="dashboard-reliability-card">
      {/* Score ring */}
      <div className="shrink-0">
        <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
          {/* Track */}
          <circle cx="36" cy="36" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
          {/* Progress */}
          {!isBuilding && (
            <circle
              cx="36" cy="36" r={r}
              fill="none"
              stroke={cfg.color}
              strokeWidth="6"
              strokeDasharray={`${dash} ${circ}`}
              strokeLinecap="round"
              transform="rotate(-90 36 36)"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          )}
          {/* Label inside ring */}
          <text x="36" y="36" textAnchor="middle" dominantBaseline="middle" className="text-xs" style={{ fill: cfg.color, fontWeight: 700, fontSize: 14 }}>
            {isBuilding ? '—' : `${score}`}
          </text>
          {!isBuilding && (
            <text x="36" y="47" textAnchor="middle" dominantBaseline="middle" style={{ fill: '#94a3b8', fontSize: 9 }}>%</text>
          )}
        </svg>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-800">My reliability</p>
        <p className="text-xs mt-0.5" style={{ color: cfg.color }}>{cfg.label}</p>

        {isBuilding ? (
          <div className="mt-2">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-300 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((resolved / 3) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{resolved} of 3 payments needed to score</p>
          </div>
        ) : (
          <div className="flex gap-3 mt-2 text-xs text-slate-500">
            <span><span className="font-semibold text-emerald-600">{onTime}</span> on time</span>
            <span><span className="font-semibold text-orange-500">{late}</span> late</span>
            <span><span className="font-semibold text-red-500">{missed}</span> missed</span>
          </div>
        )}
      </div>

      {/* Arrow hint */}
      <svg className="w-4 h-4 text-slate-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [circles, setCircles] = useState([]);
  const [trust, setTrust]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    Promise.all([
      circlesApi.list().then((d) => setCircles(d.circles)),
      meApi.getTrust().then(setTrust).catch(() => { /* trust is non-critical */ }),
    ])
      .catch(() => setError('Could not load your circles. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">My Circles</h1>
          <p className="text-sm text-slate-500 mt-0.5">Welcome back, {firstName}.</p>
        </div>
        <Link id="dashboard-create-btn" to="/circles/new" className="btn-primary text-sm px-4 py-2">
          + Create
        </Link>
      </div>

      {/* Reliability card */}
      {!loading && <ReliabilityCard trust={trust} />}

      {/* Error */}
      {error && (
        <div role="alert" className="mb-4 px-4 py-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => <CircleCardSkeleton key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && circles.length === 0 && (
        <div className="card text-center py-12 space-y-3">
          <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
          </div>
          <p className="font-semibold text-slate-700">No circles yet</p>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            An ajo circle is a group savings club — everyone contributes each cycle and takes turns receiving the full pot. Start one or join with an invite link.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
            <Link to="/circles/new" className="btn-primary text-sm">
              Create a circle
            </Link>
          </div>
        </div>
      )}

      {/* Circle cards */}
      {!loading && circles.length > 0 && (
        <div className="space-y-3">
          {circles.map((c) => (
            <Link
              key={c._id}
              to={`/circles/${c._id}`}
              className="card block hover:shadow-md transition-shadow active:scale-[0.99]"
              id={`circle-card-${c._id}`}
            >
              <div className="flex items-start justify-between mb-2 gap-2">
                <p className="font-semibold text-slate-800 leading-snug truncate min-w-0">{c.name}</p>
                <span className={`${STATUS_CHIP[c.status] ?? 'chip bg-slate-100 text-slate-500'} shrink-0`}>
                  {c.status}
                </span>
              </div>

              <p className="text-sm text-slate-500 mb-3">
                {formatNaira(c.contributionKobo)} &bull; {FREQ_LABEL[c.frequency] ?? c.frequency}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  <span className="font-medium text-slate-600">{c.memberCount}</span>/{c.maxMembers} members
                </span>

                {c.status === 'active' && c.nextDueDate && (
                  <span>
                    Due{' '}
                    <span className="font-medium text-slate-600">
                      {relativeDays(new Date(c.nextDueDate))}
                    </span>
                  </span>
                )}

                {c.status === 'active' && c.myObligationStatus && (
                  <StatusChip status={c.myObligationStatus} className="!py-0.5" />
                )}

                {c.status === 'forming' && (
                  <span className="text-amber-600 font-medium">Waiting to start</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
