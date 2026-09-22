import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicApi } from '../api/public.js';

const BRAND_NAME = 'AjoLedger';

const TIER_CFG = {
  excellent: { color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Exceptional' },
  good:      { color: '#0f4c81', bg: 'bg-blue-50',    text: 'text-blue-800',    label: 'Reliable'    },
  fair:      { color: '#f59e0b', bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'Developing'  },
  poor:      { color: '#ef4444', bg: 'bg-red-50',     text: 'text-red-700',     label: 'Needs work'  },
  building:  { color: '#94a3b8', bg: 'bg-slate-50',   text: 'text-slate-600',   label: 'Building'    },
};

function ScoreRing({ score, tier, size = 120 }) {
  const cfg  = TIER_CFG[tier] ?? TIER_CFG.building;
  const r    = size * 0.38;
  const circ = 2 * Math.PI * r;
  const pct  = score !== null ? score / 100 : 0;
  const dash = pct * circ;
  const cx   = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`Score: ${score ?? '—'}`}>
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
      <text x={cx} y={cx - 5} textAnchor="middle" dominantBaseline="middle"
        style={{ fill: cfg.color, fontWeight: 800, fontSize: size * 0.2 }}>
        {score !== null ? score : '—'}
      </text>
      {score !== null && (
        <text x={cx} y={cx + size * 0.16} textAnchor="middle" dominantBaseline="middle"
          style={{ fill: '#94a3b8', fontSize: size * 0.11 }}>%</text>
      )}
    </svg>
  );
}

export default function PublicTrustPage() {
  const { slug }      = useParams();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    publicApi.getTrustProfile(slug)
      .then((profile) => {
        if (!profile) {
          setNotFound(true);
          document.title = 'Profile Not Found — AjoLedger';
        } else {
          setData(profile);
          document.title = `${profile.displayName} — Trust Profile | ${BRAND_NAME}`;
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    return () => { document.title = BRAND_NAME; };
  }, [slug]);

  const cfg = TIER_CFG[data?.tier] ?? TIER_CFG.building;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Minimal brand header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between max-w-lg mx-auto w-full">
        <Link to="/" className="font-display font-bold text-primary-700 text-lg tracking-tight">
          {BRAND_NAME}
        </Link>
        <span className="text-xs text-slate-400 font-medium">Trust Profile</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-4 py-8 max-w-lg mx-auto w-full">
        {/* Loading */}
        {loading && (
          <div className="w-full animate-pulse space-y-4 mt-4">
            <div className="h-48 bg-slate-200 rounded-2xl" />
            <div className="h-20 bg-slate-200 rounded-2xl" />
          </div>
        )}

        {/* Not found */}
        {!loading && notFound && (
          <div className="w-full text-center py-16 space-y-3">
            <div className="text-5xl">🔒</div>
            <h1 className="font-display text-xl font-bold text-slate-800">Profile not found</h1>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              This trust profile doesn't exist or has been set to private.
            </p>
            <Link
              to="/"
              className="inline-block mt-4 btn-primary text-sm px-6"
            >
              Go to AjoLedger
            </Link>
          </div>
        )}

        {/* Verified record card */}
        {!loading && data && (
          <div className="w-full space-y-4">
            {/* Main card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Gradient header strip */}
              <div
                className="h-2"
                style={{ background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)` }}
              />

              <div className="p-6">
                {/* Verified badge */}
                <div className="flex items-center gap-1.5 mb-4">
                  <svg className="w-4 h-4 text-primary-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-semibold text-primary-700 uppercase tracking-wide">
                    Verified Record
                  </span>
                </div>

                {/* Name + score ring */}
                <div className="flex items-center gap-5 mb-5">
                  <ScoreRing score={data.score} tier={data.tier} size={112} />
                  <div className="min-w-0">
                    <h1 className="font-display text-2xl font-bold text-slate-900 leading-tight">
                      {data.displayName}
                    </h1>
                    <span className={`chip text-xs mt-1 ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {data.tierLabel}
                    </p>
                  </div>
                </div>

                {/* Payment counts */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'On time', value: data.counts.onTime, color: 'text-emerald-600' },
                    { label: 'Late',    value: data.counts.late,   color: 'text-amber-500'   },
                    { label: 'Missed',  value: data.counts.missed, color: 'text-red-500'     },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="text-center bg-slate-50 rounded-xl py-3 px-2"
                    >
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Meta row */}
                <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <span>
                    <span className="font-semibold text-slate-700">{data.circlesCompleted}</span> circle{data.circlesCompleted !== 1 ? 's' : ''} completed
                  </span>
                  {data.memberSince && (
                    <span>Member since {data.memberSince}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-500">ℹ️  About this score: </span>
                {data.disclaimer}
              </p>
            </div>

            {/* CTA */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-400 mb-2">Want your own reliability score?</p>
              <Link
                to="/register"
                className="btn-primary text-sm px-8"
              >
                Join {BRAND_NAME}
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
