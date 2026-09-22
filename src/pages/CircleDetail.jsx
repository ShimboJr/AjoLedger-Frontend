import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { circlesApi } from '../api/circles.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatNaira } from '../utils/money.js';
import { formatDate, relativeDays } from '../utils/dates.js';
import { CircleDetailSkeleton } from '../components/LoadingSkeleton.jsx';

const FREQ_LABEL = { weekly: 'week', biweekly: '2 weeks', monthly: 'month' };
const STATUS_CHIP = {
  forming:   'chip chip-amber',
  active:    'chip chip-green',
  completed: 'chip bg-slate-100 text-slate-500',
};
const OBLIGATION_CHIP = {
  pending:      'chip chip-amber',
  paid_on_time: 'chip chip-green',
  paid_late:    'chip bg-blue-100 text-blue-700',
  missed:       'chip chip-red',
};

// ── Confirmation modal ────────────────────────────────────────────────────────
function StartModal({ memberCount, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-slate-900">Start this circle?</h2>
        <p className="text-sm text-slate-600">
          Once started, <strong>membership and payout order are locked</strong>. All {memberCount} members will
          receive payment reminders. Cycle 1 will open immediately.
        </p>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} disabled={loading} className="btn-ghost flex-1">
            Cancel
          </button>
          <button
            id="confirm-start-circle"
            onClick={onConfirm}
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Starting…
              </span>
            ) : 'Start circle'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────
function OverviewTab({ data, onRefresh }) {
  const { circle, members, currentCycle, myObligation, obligations, isOrganizer } = data;

  const inviteUrl = isOrganizer
    ? `${window.location.origin}/join/${circle.inviteCode}`
    : null;

  async function copyLink() {
    try { await navigator.clipboard.writeText(inviteUrl); } catch {}
  }

  const whatsappMsg = inviteUrl
    ? encodeURIComponent(
        `Join my AjoLedger circle "${circle.name}"! Contribute ${formatNaira(circle.contributionKobo)} every ${FREQ_LABEL[circle.frequency] ?? circle.frequency}.\n\nJoin here: ${inviteUrl}`
      )
    : '';

  return (
    <div className="space-y-4">
      {/* Organiser invite card */}
      {isOrganizer && circle.status === 'forming' && inviteUrl && (
        <div className="card border-primary-100 bg-primary-50/60 space-y-3">
          <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide">Invite link</p>
          <div className="bg-white rounded-lg px-3 py-2 text-xs font-mono text-slate-700 break-all select-all border border-primary-100">
            {inviteUrl}
          </div>
          <div className="flex gap-2">
            <button id="copy-invite" onClick={copyLink} className="btn-ghost flex-1 text-sm py-1.5">
              Copy link
            </button>
            <a
              id="whatsapp-invite"
              href={`https://wa.me/?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex-1 text-sm text-center py-1.5"
            >
              WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Current cycle card */}
      {currentCycle ? (
        <div className="card space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Cycle {currentCycle.number} of {circle.totalCycles}
            </p>
            <span className={`chip ${currentCycle.status === 'open' ? 'chip-green' : 'chip-amber'}`}>
              {currentCycle.status}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Due <span className="font-semibold text-slate-800">{relativeDays(new Date(currentCycle.dueDate))}</span> &mdash; {formatDate(new Date(currentCycle.dueDate))}</p>
            <p className="text-sm text-slate-500">Recipient: <span className="font-semibold text-slate-800">{currentCycle.recipient?.name ?? '—'}</span></p>
            <p className="text-sm text-slate-500">Expected pot: <span className="font-semibold text-slate-800">{formatNaira(currentCycle.expectedPotKobo)}</span></p>
          </div>
          {myObligation && (
            <div className="pt-1 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-1">My contribution</p>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">{formatNaira(myObligation.amountKobo)}</span>
                <span className={OBLIGATION_CHIP[myObligation.status] ?? 'chip bg-slate-100 text-slate-500'}>
                  {myObligation.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        circle.status === 'forming' && (
          <div className="card text-center py-6 space-y-1">
            <p className="text-sm font-medium text-slate-600">No active cycle</p>
            <p className="text-xs text-slate-400">Circle starts on {formatDate(new Date(circle.startDate))}</p>
          </div>
        )
      )}

      {/* Who has paid */}
      {obligations.length > 0 && (
        <div className="card space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Who has paid</p>
          <div className="divide-y divide-slate-50">
            {obligations.map((ob) => (
              <div key={ob._id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                    {ob.user?.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <span className="text-sm text-slate-700">{ob.user?.name ?? 'Unknown'}</span>
                </div>
                <span className={OBLIGATION_CHIP[ob.status] ?? 'chip bg-slate-100 text-slate-500'}>
                  {ob.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Members ──────────────────────────────────────────────────────────────
function MembersTab({ data, onReorder, onStart, reorderLoading, startLoading }) {
  const { circle, members, isOrganizer } = data;
  const canReorder = isOrganizer && circle.status === 'forming';
  const [showStartModal, setShowStartModal] = useState(false);
  const [reorderError, setReorderError] = useState('');

  async function move(userId, direction) {
    const idx = members.findIndex((m) => String(m.user._id) === String(userId));
    if (idx < 0) return;
    const newOrder = members.map((m) => String(m.user._id));
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newOrder.length) return;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    setReorderError('');
    try {
      await onReorder(newOrder);
    } catch (err) {
      setReorderError(err?.response?.data?.error?.message ?? 'Could not reorder. Please try again.');
    }
  }

  return (
    <div className="space-y-4">
      {reorderError && (
        <div role="alert" className="px-4 py-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-sm">
          {reorderError}
        </div>
      )}

      <div className="card divide-y divide-slate-50">
        {members.map((m, idx) => (
          <div key={m._id} className="flex items-center gap-3 py-3">
            {/* Position badge */}
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
              {m.position}
            </div>
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-bold shrink-0">
              {m.user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{m.user?.name ?? 'Unknown'}</p>
            </div>
            <span className={`chip text-xs shrink-0 ${m.role === 'organizer' ? 'chip-green' : 'bg-slate-100 text-slate-500'}`}>
              {m.role}
            </span>
            {/* Reorder controls */}
            {canReorder && (
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  aria-label={`Move ${m.user?.name} up`}
                  onClick={() => move(m.user._id, 'up')}
                  disabled={idx === 0 || reorderLoading}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-20 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                  </svg>
                </button>
                <button
                  aria-label={`Move ${m.user?.name} down`}
                  onClick={() => move(m.user._id, 'down')}
                  disabled={idx === members.length - 1 || reorderLoading}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-20 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Start circle button */}
      {isOrganizer && circle.status === 'forming' && members.length >= 2 && (
        <button
          id="start-circle-btn"
          onClick={() => setShowStartModal(true)}
          className="btn-primary w-full"
        >
          Start circle
        </button>
      )}
      {isOrganizer && circle.status === 'forming' && members.length < 2 && (
        <p className="text-sm text-center text-slate-400">Invite at least 1 more member to start.</p>
      )}

      {showStartModal && (
        <StartModal
          memberCount={members.length}
          loading={startLoading}
          onConfirm={async () => {
            await onStart();
            setShowStartModal(false);
          }}
          onCancel={() => setShowStartModal(false)}
        />
      )}
    </div>
  );
}

// ── Main CircleDetail page ────────────────────────────────────────────────────
const TABS = ['Overview', 'Members', 'Ledger'];

export default function CircleDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [reorderLoading, setReorderLoading] = useState(false);
  const [startLoading, setStartLoading]     = useState(false);
  const [startError, setStartError]         = useState('');

  const fetchDetail = useCallback(() => {
    return circlesApi.get(id)
      .then(setData)
      .catch(() => setError('Circle not found or you do not have access.'));
  }, [id]);

  useEffect(() => {
    fetchDetail().finally(() => setLoading(false));
  }, [fetchDetail]);

  async function handleReorder(newOrder) {
    if (!data) return;
    // Optimistic: reorder local state immediately
    const prevMembers = [...data.members];
    const reordered = newOrder.map((uid, i) => {
      const m = data.members.find((m) => String(m.user._id) === uid);
      return { ...m, position: i + 1 };
    });
    setData((d) => ({ ...d, members: reordered }));
    setReorderLoading(true);
    try {
      await circlesApi.reorder(id, newOrder);
      await fetchDetail(); // refresh from server to confirm
    } catch (err) {
      setData((d) => ({ ...d, members: prevMembers })); // revert
      throw err; // MembersTab catches and shows error
    } finally {
      setReorderLoading(false);
    }
  }

  async function handleStart() {
    setStartLoading(true);
    setStartError('');
    try {
      await circlesApi.start(id);
      await fetchDetail();
    } catch (err) {
      setStartError(err?.response?.data?.error?.message ?? 'Could not start circle.');
      throw err;
    } finally {
      setStartLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <CircleDetailSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container text-center py-16 space-y-3">
        <p className="text-slate-500 text-sm">{error || 'Circle not found.'}</p>
        <Link to="/dashboard" className="btn-ghost text-sm">← Back to circles</Link>
      </div>
    );
  }

  const { circle } = data;

  return (
    <div className="page-container">
      {/* Back + header */}
      <Link to="/dashboard" className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        My circles
      </Link>

      <div className="flex items-start gap-3 mb-5">
        <h1 className="font-display text-xl font-bold text-slate-900 flex-1 leading-tight">{circle.name}</h1>
        <span className={STATUS_CHIP[circle.status] ?? 'chip bg-slate-100 text-slate-500'}>
          {circle.status}
        </span>
      </div>

      {/* Contribution summary */}
      <p className="text-sm text-slate-500 mb-5">
        {formatNaira(circle.contributionKobo)} &bull; {FREQ_LABEL[circle.frequency] ?? circle.frequency} &bull; {data.members.length}/{circle.maxMembers} members
      </p>

      {startError && (
        <div role="alert" className="mb-4 px-4 py-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-sm">
          {startError}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-slate-200 mb-5 -mx-4 px-4 gap-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            id={`tab-${tab.toLowerCase()}`}
            onClick={() => { if (tab !== 'Ledger') setActiveTab(tab); }}
            disabled={tab === 'Ledger'}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary-600 text-primary-700'
                : tab === 'Ledger'
                  ? 'border-transparent text-slate-300 cursor-not-allowed'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}{tab === 'Ledger' && <span className="ml-1 text-xs text-slate-300">(Day 3)</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Overview' && <OverviewTab data={data} onRefresh={fetchDetail} />}
      {activeTab === 'Members' && (
        <MembersTab
          data={data}
          onReorder={handleReorder}
          onStart={handleStart}
          reorderLoading={reorderLoading}
          startLoading={startLoading}
        />
      )}
    </div>
  );
}
