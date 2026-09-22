import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { circlesApi } from '../api/circles.js';
import { formatNaira } from '../utils/money.js';
import { formatDate, relativeDays } from '../utils/dates.js';
import { CircleCardSkeleton } from '../components/LoadingSkeleton.jsx';

const FREQ_LABEL = { weekly: 'weekly', biweekly: 'every 2 weeks', monthly: 'monthly' };

const STATUS_CHIP = {
  forming:   'chip chip-amber',
  active:    'chip chip-green',
  completed: 'chip bg-slate-100 text-slate-500',
};

const OBLIGATION_CHIP = {
  pending:       'chip chip-amber',
  paid_on_time:  'chip chip-green',
  paid_late:     'chip bg-blue-100 text-blue-700',
  missed:        'chip chip-red',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    circlesApi.list()
      .then((d) => setCircles(d.circles))
      .catch(() => setError('Could not load your circles. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">My Circles</h1>
          <p className="text-sm text-slate-500 mt-0.5">Welcome back, {firstName}.</p>
        </div>
        <Link id="dashboard-create-btn" to="/circles/new" className="btn-primary text-sm px-4 py-2">
          + Create
        </Link>
      </div>

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
              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold text-slate-800 leading-snug pr-2">{c.name}</p>
                <span className={STATUS_CHIP[c.status] ?? 'chip bg-slate-100 text-slate-500'}>
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
                  <span className={`${OBLIGATION_CHIP[c.myObligationStatus]} !text-xs !py-0.5`}>
                    {c.myObligationStatus.replace('_', ' ')}
                  </span>
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
