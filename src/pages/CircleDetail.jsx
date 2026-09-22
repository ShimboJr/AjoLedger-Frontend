import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { circlesApi } from '../api/circles.js';
import { paymentsApi } from '../api/payments.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatNaira } from '../utils/money.js';
import { formatDate, formatDateTime, relativeDays } from '../utils/dates.js';
import { CircleDetailSkeleton, Skeleton } from '../components/LoadingSkeleton.jsx';

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
const LEDGER_TYPE_META = {
  contribution: { label: 'Contribution', icon: '↑', color: 'text-primary-600 bg-primary-50' },
  payout:       { label: 'Payout',       icon: '→', color: 'text-purple-600 bg-purple-50' },
  missed:       { label: 'Missed',       icon: '✕', color: 'text-danger-600 bg-danger-50' },
};

// ── Confirmation modal ────────────────────────────────────────────────────────
function StartModal({ memberCount, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-slate-900">Start this circle?</h2>
        <p className="text-sm text-slate-600">
          Once started, <strong>membership and payout order are locked</strong>. All {memberCount} members
          will receive payment reminders. Cycle 1 will open immediately.
        </p>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} disabled={loading} className="btn-ghost flex-1">Cancel</button>
          <button id="confirm-start-circle" onClick={onConfirm} disabled={loading} className="btn-primary flex-1">
            {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Starting…</span> : 'Start circle'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pay button component ──────────────────────────────────────────────────────
function PayButton({ circleId, obligation, cycle, circle }) {
  const [paying, setPaying] = useState(false);
  const [error, setError]   = useState('');

  if (!obligation || !cycle) return null;

  const now = new Date();
  const dueDate    = new Date(cycle.dueDate);
  const closesAt   = new Date(cycle.closesAt);
  const isOverdue  = now > dueDate && now <= closesAt;
  const isClosed   = now > closesAt;

  if (obligation.status !== 'pending') {
    return (
      <div className={`${OBLIGATION_CHIP[obligation.status] ?? 'chip bg-slate-100 text-slate-500'} !text-sm !py-1.5 !px-3 w-full justify-center`}>
        {obligation.status === 'paid_on_time' && '✓ Paid on time'}
        {obligation.status === 'paid_late'    && '✓ Paid (late)'}
        {obligation.status === 'missed'       && '✗ Missed'}
      </div>
    );
  }

  if (isClosed) {
    return (
      <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-sm text-center">
        Contribution window closed
      </div>
    );
  }

  async function handlePay() {
    setError('');
    setPaying(true);
    try {
      const { authorizationUrl } = await paymentsApi.contribute(circleId);
      // Redirect to Paystack checkout
      window.location.href = authorizationUrl;
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? 'Could not initiate payment. Please try again.');
      setPaying(false);
    }
  }

  return (
    <div className="space-y-1.5">
      {error && (
        <p role="alert" className="text-xs text-danger-600">{error}</p>
      )}
      <button
        id="pay-obligation-btn"
        onClick={handlePay}
        disabled={paying}
        className={`w-full btn-primary text-sm ${isOverdue ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800' : ''}`}
      >
        {paying ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Opening checkout…
          </span>
        ) : isOverdue
          ? `Pay now (late) — ${formatNaira(obligation.amountKobo)}`
          : `Pay ${formatNaira(obligation.amountKobo)}`}
      </button>
      <p className="text-xs text-center text-slate-400">Test mode — no real money moves</p>
    </div>
  );
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────
function OverviewTab({ data, circleId }) {
  const { circle, members, currentCycle, myObligation, obligations, isOrganizer } = data;

  const inviteUrl = isOrganizer && circle.inviteCode
    ? `${window.location.origin}/join/${circle.inviteCode}`
    : null;

  async function copyLink() {
    try { await navigator.clipboard.writeText(inviteUrl); } catch { }
  }

  const whatsappMsg = inviteUrl
    ? encodeURIComponent(
        `Join my AjoLedger circle "${circle.name}"! Contribute ${formatNaira(circle.contributionKobo)} every ${FREQ_LABEL[circle.frequency] ?? circle.frequency}.\n\nJoin here: ${inviteUrl}`
      )
    : '';

  return (
    <div className="space-y-4">
      {/* Organiser invite card — only in forming status */}
      {isOrganizer && circle.status === 'forming' && inviteUrl && (
        <div className="card border-primary-100 bg-primary-50/60 space-y-3">
          <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide">Invite link</p>
          <div className="bg-white rounded-lg px-3 py-2 text-xs font-mono text-slate-700 break-all select-all border border-primary-100">
            {inviteUrl}
          </div>
          <div className="flex gap-2">
            <button id="copy-invite" onClick={copyLink} className="btn-ghost flex-1 text-sm py-1.5">Copy link</button>
            <a id="whatsapp-invite" href={`https://wa.me/?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1 text-sm text-center py-1.5">WhatsApp</a>
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
            <p className="text-sm text-slate-500">
              Due <span className="font-semibold text-slate-800">{relativeDays(new Date(currentCycle.dueDate))}</span>
              {' '}— {formatDate(new Date(currentCycle.dueDate))}
            </p>
            <p className="text-sm text-slate-500">Recipient: <span className="font-semibold text-slate-800">{currentCycle.recipient?.name ?? '—'}</span></p>
            <p className="text-sm text-slate-500">Expected pot: <span className="font-semibold text-slate-800">{formatNaira(currentCycle.expectedPotKobo)}</span></p>
          </div>

          {/* My contribution + Pay button */}
          {myObligation && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <p className="text-xs text-slate-400">My contribution</p>
              <PayButton
                circleId={circleId}
                obligation={myObligation}
                cycle={currentCycle}
                circle={circle}
              />
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
    try { await onReorder(newOrder); }
    catch (err) { setReorderError(err?.response?.data?.error?.message ?? 'Could not reorder. Please try again.'); }
  }

  return (
    <div className="space-y-4">
      {reorderError && (
        <div role="alert" className="px-4 py-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-sm">{reorderError}</div>
      )}
      <div className="card divide-y divide-slate-50">
        {members.map((m, idx) => (
          <div key={m._id} className="flex items-center gap-3 py-3">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">{m.position}</div>
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-bold shrink-0">
              {m.user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{m.user?.name ?? 'Unknown'}</p>
            </div>
            <span className={`chip text-xs shrink-0 ${m.role === 'organizer' ? 'chip-green' : 'bg-slate-100 text-slate-500'}`}>{m.role}</span>
            {canReorder && (
              <div className="flex flex-col gap-0.5 shrink-0">
                <button aria-label={`Move ${m.user?.name} up`} onClick={() => move(m.user._id, 'up')} disabled={idx === 0 || reorderLoading} className="p-1 rounded hover:bg-slate-100 disabled:opacity-20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg>
                </button>
                <button aria-label={`Move ${m.user?.name} down`} onClick={() => move(m.user._id, 'down')} disabled={idx === members.length - 1 || reorderLoading} className="p-1 rounded hover:bg-slate-100 disabled:opacity-20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {isOrganizer && circle.status === 'forming' && members.length >= 2 && (
        <button id="start-circle-btn" onClick={() => setShowStartModal(true)} className="btn-primary w-full">Start circle</button>
      )}
      {isOrganizer && circle.status === 'forming' && members.length < 2 && (
        <p className="text-sm text-center text-slate-400">Invite at least 1 more member to start.</p>
      )}
      {showStartModal && (
        <StartModal
          memberCount={members.length}
          loading={startLoading}
          onConfirm={async () => { await onStart(); setShowStartModal(false); }}
          onCancel={() => setShowStartModal(false)}
        />
      )}
    </div>
  );
}

// ── Tab: Ledger ───────────────────────────────────────────────────────────────
function LedgerTab({ circleId }) {
  const [entries, setEntries]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]         = useState(false);
  const [nextCursor, setNextCursor]   = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying]       = useState(false);
  const [error, setError]             = useState('');
  const [copiedHash, setCopiedHash]   = useState('');

  async function loadEntries(cursor = null, append = false) {
    try {
      const data = await paymentsApi.getLedger(circleId, { limit: 20, cursor });
      setEntries((prev) => append ? [...prev, ...data.entries] : data.entries);
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch {
      setError('Could not load ledger. Please refresh.');
    }
  }

  useEffect(() => {
    loadEntries(null, false).finally(() => setLoading(false));
  }, [circleId]);

  async function handleLoadMore() {
    setLoadingMore(true);
    await loadEntries(nextCursor, true);
    setLoadingMore(false);
  }

  async function handleVerify() {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const result = await paymentsApi.verifyLedger(circleId);
      setVerifyResult(result);
    } catch {
      setVerifyResult({ ok: false, checked: 0, reason: 'Verification request failed' });
    } finally {
      setVerifying(false);
    }
  }

  async function copyHash(hash) {
    try { await navigator.clipboard.writeText(hash); } catch { }
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(''), 1500);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-danger-600 text-center py-8">{error}</p>;
  }

  return (
    <div className="space-y-4">
      {/* Verify button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">{entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}</p>
        <button
          id="verify-ledger-btn"
          onClick={handleVerify}
          disabled={verifying}
          className="btn-ghost text-xs py-1.5 px-3"
        >
          {verifying ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-primary-700/30 border-t-primary-700 rounded-full animate-spin" />
              Verifying…
            </span>
          ) : '🔒 Verify ledger'}
        </button>
      </div>

      {/* Verify result */}
      {verifyResult && (
        <div className={`px-4 py-3 rounded-xl border text-sm ${
          verifyResult.ok
            ? 'bg-primary-50 border-primary-200 text-primary-800'
            : 'bg-danger-50 border-danger-200 text-danger-700'
        }`}>
          {verifyResult.ok
            ? `✓ Ledger intact — ${verifyResult.checked} entr${verifyResult.checked !== 1 ? 'ies' : 'y'} verified`
            : `✗ Chain broken at seq ${verifyResult.brokenAtSeq ?? '?'} — ${verifyResult.reason ?? 'unknown reason'}`}
        </div>
      )}

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="card text-center py-10 space-y-2">
          <p className="text-2xl">📒</p>
          <p className="text-sm font-medium text-slate-600">No ledger entries yet</p>
          <p className="text-xs text-slate-400">Entries appear when contributions are made.</p>
        </div>
      )}

      {/* Entries — cards on mobile, table-like on large screens */}
      {entries.length > 0 && (
        <>
          {/* Mobile cards */}
          <div className="space-y-2 sm:hidden">
            {entries.map((e) => {
              const meta = LEDGER_TYPE_META[e.type] ?? { label: e.type, icon: '?', color: 'text-slate-500 bg-slate-50' };
              return (
                <div key={e._id} className="card !p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${meta.color}`}>
                        {meta.icon}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{meta.label}</p>
                        <p className="text-xs text-slate-400">Seq #{e.seq}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-800">{formatNaira(e.amountKobo)}</p>
                      {e.sandbox && <span className="chip bg-amber-50 text-amber-600 !text-[10px]">sandbox</span>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{e.user?.name ?? '—'} · Cycle {e.cycleNumber}</span>
                    <span>{formatDate(new Date(e.createdAt))}</span>
                  </div>
                  <button
                    title="Copy full hash"
                    onClick={() => copyHash(e.hash)}
                    className="text-left text-xs font-mono text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    {copiedHash === e.hash ? 'Copied!' : e.hash.slice(0, 8) + '…'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Large-screen table */}
          <div className="hidden sm:block card !p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-400 font-medium uppercase tracking-wide">
                  <th className="px-4 py-3">Seq</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Cycle</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {entries.map((e) => {
                  const meta = LEDGER_TYPE_META[e.type] ?? { label: e.type, icon: '?', color: 'text-slate-500 bg-slate-50' };
                  return (
                    <tr key={e._id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-400">#{e.seq}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${meta.color}`}>{meta.icon}</span>
                          <span className="font-medium text-slate-700">{meta.label}</span>
                          {e.sandbox && <span className="chip bg-amber-50 text-amber-600 !text-[10px]">sandbox</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{e.user?.name ?? '—'}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{formatNaira(e.amountKobo)}</td>
                      <td className="px-4 py-3 text-slate-400">{e.cycleNumber}</td>
                      <td className="px-4 py-3 text-slate-400">{formatDateTime(new Date(e.createdAt))}</td>
                      <td className="px-4 py-3">
                        <button
                          title="Copy full hash"
                          onClick={() => copyHash(e.hash)}
                          className="font-mono text-xs text-slate-300 hover:text-slate-600 transition-colors"
                        >
                          {copiedHash === e.hash ? 'Copied!' : e.hash.slice(0, 8) + '…'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <button
              id="ledger-load-more"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="btn-ghost w-full text-sm"
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Main CircleDetail page ────────────────────────────────────────────────────
const TABS = ['Overview', 'Members', 'Ledger'];

export default function CircleDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [activeTab, setActiveTab]     = useState('Overview');
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
    const prevMembers = [...data.members];
    const reordered = newOrder.map((uid, i) => {
      const m = data.members.find((m) => String(m.user._id) === uid);
      return { ...m, position: i + 1 };
    });
    setData((d) => ({ ...d, members: reordered }));
    setReorderLoading(true);
    try {
      await circlesApi.reorder(id, newOrder);
      await fetchDetail();
    } catch (err) {
      setData((d) => ({ ...d, members: prevMembers }));
      throw err;
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

  if (loading) return <div className="page-container"><CircleDetailSkeleton /></div>;

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
      <Link to="/dashboard" className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
        My circles
      </Link>

      <div className="flex items-start gap-3 mb-2">
        <h1 className="font-display text-xl font-bold text-slate-900 flex-1 leading-tight">{circle.name}</h1>
        <span className={STATUS_CHIP[circle.status] ?? 'chip bg-slate-100 text-slate-500'}>{circle.status}</span>
      </div>
      <p className="text-sm text-slate-500 mb-5">
        {formatNaira(circle.contributionKobo)} &bull; {FREQ_LABEL[circle.frequency] ?? circle.frequency} &bull; {data.members.length}/{circle.maxMembers} members
      </p>

      {startError && (
        <div role="alert" className="mb-4 px-4 py-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-sm">{startError}</div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-slate-200 mb-5 -mx-4 px-4 gap-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            id={`tab-${tab.toLowerCase()}`}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Overview' && <OverviewTab data={data} circleId={id} />}
      {activeTab === 'Members' && (
        <MembersTab
          data={data}
          onReorder={handleReorder}
          onStart={handleStart}
          reorderLoading={reorderLoading}
          startLoading={startLoading}
        />
      )}
      {activeTab === 'Ledger' && <LedgerTab circleId={id} />}
    </div>
  );
}
