import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { circlesApi } from '../api/circles.js';
import { paymentsApi } from '../api/payments.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatNaira } from '../utils/money.js';
import { formatDate, formatDateTime, relativeDays } from '../utils/dates.js';
import { CircleDetailSkeleton, Skeleton } from '../components/LoadingSkeleton.jsx';
import StatusChip from '../components/StatusChip.jsx';

const FREQ_LABEL = { weekly: 'week', biweekly: '2 weeks', monthly: 'month' };
const STATUS_CHIP = {
  forming:   'chip chip-amber',
  active:    'chip chip-green',
  completed: 'chip bg-slate-100 text-slate-500',
};

const LEDGER_TYPE_META = {
  contribution: { label: 'Contribution', icon: '↑', color: 'text-primary-600 bg-primary-50' },
  payout:       { label: 'Payout (Sandbox)', icon: '→', color: 'text-purple-600 bg-purple-50' },
  missed:       { label: 'Missed',           icon: '✕', color: 'text-red-600 bg-red-50' },
};

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// ── Trust tier colours ────────────────────────────────────────────────────────

const TIER_CHIP = {
  excellent: 'bg-emerald-100 text-emerald-700',
  good:      'bg-primary-100 text-primary-700',
  fair:      'bg-amber-100 text-amber-700',
  poor:      'bg-red-100 text-red-700',
  building:  'bg-slate-100 text-slate-500',
};

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner({ size = 4 }) {
  return (
    <span
      className={`w-${size} h-${size} border-2 border-white/40 border-t-white rounded-full animate-spin`}
    />
  );
}

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
            {loading ? <span className="flex items-center gap-2"><Spinner />Starting…</span> : 'Start circle'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Demo confirm modal ────────────────────────────────────────────────────────

function DemoModal({ action, onConfirm, onCancel, loading }) {
  const isClose = action === 'close-cycle';
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-slate-900">
          {isClose ? '⏩ Simulate cycle close?' : '⏰ Pass the due date?'}
        </h2>
        <p className="text-sm text-slate-600">
          {isClose
            ? 'This will move the demo clock past the close window, running the cycle engine. All pending obligations become missed and the pot is distributed.'
            : 'This will move the demo clock 1 hour after the due date. Overdue reminders will fire.'}
        </p>
        <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          🛡 Sandbox only — no real money moves.
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} disabled={loading} className="btn-ghost flex-1">Cancel</button>
          <button
            id={`demo-confirm-${action}`}
            onClick={onConfirm}
            disabled={loading}
            className="btn-primary flex-1 bg-amber-600 hover:bg-amber-700 active:bg-amber-800"
          >
            {loading ? <span className="flex items-center gap-2"><Spinner />Running…</span> : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pay button component ──────────────────────────────────────────────────────

function PayButton({ circleId, obligation, cycle }) {
  const [paying, setPaying] = useState(false);
  const [error, setError]   = useState('');

  // Reset spinner if the browser restores this page from the Back-Forward Cache
  // (bfcache) after the user pressed the back button from Paystack checkout.
  // Without this the spinner keeps spinning forever on bfcache restoration.
  useEffect(() => {
    function handlePageShow(e) {
      if (e.persisted) {
        // Page was restored from bfcache — reset any in-flight state
        setPaying(false);
        setError('');
      }
    }
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  if (!obligation || !cycle) return null;

  const now = new Date();
  const dueDate   = new Date(cycle.dueDate);
  const closesAt  = new Date(cycle.closesAt);
  const isOverdue = now > dueDate && now <= closesAt;
  const isClosed  = now > closesAt;

  if (obligation.status !== 'pending') {
    return <StatusChip status={obligation.status} className="!text-sm !py-1.5 !px-3 w-full justify-center" />;
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
      window.location.href = authorizationUrl;
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? 'Could not initiate payment. Please try again.');
      setPaying(false);
    }
  }

  return (
    <div className="space-y-1.5">
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      <button
        id="pay-obligation-btn"
        onClick={handlePay}
        disabled={paying}
        className={`w-full btn-primary text-sm ${isOverdue ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800' : ''}`}
      >
        {paying ? (
          <span className="flex items-center gap-2"><Spinner />Opening checkout…</span>
        ) : isOverdue
          ? `Pay now (late) — ${formatNaira(obligation.amountKobo)}`
          : `Pay ${formatNaira(obligation.amountKobo)}`}
      </button>
      <p className="text-xs text-center text-slate-400">Test mode — no real money moves</p>
    </div>
  );
}

// ── Last cycle summary card ───────────────────────────────────────────────────

function LastCycleCard({ lcc }) {
  if (!lcc) return null;
  return (
    <div className="card border border-slate-200 bg-slate-50/60 space-y-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
        Last cycle — Cycle {lcc.number} summary
      </p>
      <div className="space-y-1 text-sm text-slate-600">
        <p>
          Pot collected:{' '}
          <span className="font-semibold text-slate-800">{formatNaira(lcc.potKobo)}</span>
          {lcc.meta?.shortfallKobo > 0 && (
            <span className="text-red-500 text-xs ml-2">
              (↓ {formatNaira(lcc.meta.shortfallKobo)} shortfall)
            </span>
          )}
        </p>
        <p>
          Recipient:{' '}
          <span className="font-semibold text-slate-800">{lcc.recipient?.name ?? '—'}</span>
        </p>
        {lcc.missedMembers?.length > 0 && (
          <p className="text-red-600 text-xs">
            Missed: {lcc.missedMembers.map((u) => u.name).join(', ')}
          </p>
        )}
      </div>
      <p className="text-xs text-slate-400 italic">Sandbox — no real money moved</p>
    </div>
  );
}

// ── Demo controls panel ───────────────────────────────────────────────────────

function DemoControlsPanel({ circleId, onSimulated }) {
  const [pending, setPending]   = useState(null); // action being confirmed
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');

  async function runSimulate(action) {
    setLoading(true);
    setResult(null);
    setError('');
    setPending(null);
    try {
      const res = await circlesApi.simulate(circleId, action);
      setResult(res);
      await onSimulated();
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Simulation failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {pending && (
        <DemoModal
          action={pending}
          loading={loading}
          onConfirm={() => runSimulate(pending)}
          onCancel={() => setPending(null)}
        />
      )}

      <div className="card border border-amber-200 bg-amber-50/60 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🎮</span>
          <p className="text-sm font-semibold text-amber-800">Demo Controls</p>
          <span className="ml-auto chip bg-amber-100 text-amber-700 !text-[10px]">Sandbox</span>
        </div>
        <p className="text-xs text-amber-700">
          Time-jump the circle to fire reminders or close the current cycle.
        </p>

        <div className="flex gap-2">
          <button
            id="demo-pass-due-date"
            onClick={() => setPending('pass-due-date')}
            disabled={loading}
            className="btn-ghost flex-1 text-sm !min-h-0 !py-2 border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            {loading ? <span className="flex items-center gap-2"><span className="w-3 h-3 border-2 border-amber-400/40 border-t-amber-600 rounded-full animate-spin" />Running…</span> : '⏰ Pass due date'}
          </button>
          <button
            id="demo-close-cycle"
            onClick={() => setPending('close-cycle')}
            disabled={loading}
            className="btn-primary flex-1 text-sm !min-h-0 !py-2 !bg-amber-600 hover:!bg-amber-700 active:!bg-amber-800"
          >
            {loading ? <span className="flex items-center gap-2"><Spinner />Running…</span> : '⏩ Close cycle'}
          </button>
        </div>

        {error && (
          <p role="alert" className="text-xs text-red-600">{error}</p>
        )}

        {result && (
          <div className="bg-white rounded-xl p-3 text-xs text-slate-600 space-y-1 border border-amber-100">
            <p className="font-semibold text-slate-800">Simulation result</p>
            {result.engineSummary?.[0] && (
              <p>
                Cycles closed: <strong>{result.engineSummary[0].cyclesClosed}</strong>
                {result.engineSummary[0].missedCount > 0 && (
                  <span className="text-red-600"> · {result.engineSummary[0].missedCount} missed</span>
                )}
              </p>
            )}
            {result.reminderSummary && (
              <p>Emails queued: <strong>{result.reminderSummary.emailsSent}</strong></p>
            )}
            <p className="text-slate-400">simulatedNow: {new Date(result.simulatedNow).toLocaleString()}</p>
          </div>
        )}
      </div>
    </>
  );
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────

function OverviewTab({ data, circleId, onRefresh }) {
  const { circle, members, currentCycle, myObligation, obligations, isOrganizer, lastClosedCycle } = data;

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
      {/* Demo controls — DEMO_MODE only, organizer only, active circles only */}
      {DEMO_MODE && isOrganizer && circle.status === 'active' && (
        <DemoControlsPanel circleId={circleId} onSimulated={onRefresh} />
      )}

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

      {/* Last closed cycle summary */}
      {lastClosedCycle && <LastCycleCard lcc={lastClosedCycle} />}

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

          {myObligation && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <p className="text-xs text-slate-400">My contribution</p>
              <PayButton circleId={circleId} obligation={myObligation} cycle={currentCycle} />
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
            {obligations.map((ob) => {
              // Find trust from members array
              const member = members.find((m) => String(m.user?._id ?? m.user) === String(ob.user?._id ?? ob.user));
              const trust  = member?.trust;
              return (
                <div key={ob._id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold shrink-0">
                      {ob.user?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700 truncate">{ob.user?.name ?? 'Unknown'}</p>
                      {trust?.tier && (
                        <span className={`inline-flex items-center px-1.5 py-0 rounded-full text-[10px] font-medium ${TIER_CHIP[trust.tier] ?? 'bg-slate-100 text-slate-500'}`}>
                          {trust.tier === 'building' ? '…building' : `${trust.score}%`}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusChip status={ob.status} />
                </div>
              );
            })}
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
        <div role="alert" className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{reorderError}</div>
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
              {m.trust?.tier && (
                <span className={`inline-flex items-center px-1.5 py-0 rounded-full text-[10px] font-medium ${TIER_CHIP[m.trust.tier] ?? 'bg-slate-100 text-slate-500'}`}>
                  {m.trust.tier === 'building' ? 'Building history' : `${m.trust.score}% · ${m.trust.tier}`}
                </span>
              )}
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
  const [csvLoading, setCsvLoading]   = useState(false);
  const [csvError, setCsvError]       = useState('');

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

  async function handleDownloadCsv() {
    setCsvLoading(true);
    setCsvError('');
    try {
      const { blob, filename } = await circlesApi.downloadLedgerCsv(circleId);
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setCsvError('Download failed. Please try again.');
      setTimeout(() => setCsvError(''), 4000);
    } finally {
      setCsvLoading(false);
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
    return <p className="text-sm text-red-600 text-center py-8">{error}</p>;
  }

  function LedgerEntryRow({ e }) {
    const meta = LEDGER_TYPE_META[e.type] ?? { label: e.type, icon: '?', color: 'text-slate-500 bg-slate-50' };
    const isMissed  = e.type === 'missed';
    const isPayout  = e.type === 'payout';

    return (
      <div className="card !p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${meta.color}`}>
              {meta.icon}
            </span>
            <div>
              <p className={`text-sm font-medium ${isMissed ? 'text-red-700' : isPayout ? 'text-purple-700' : 'text-slate-800'}`}>
                {meta.label}
              </p>
              <p className="text-xs text-slate-400">Seq #{e.seq}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-sm font-semibold ${isMissed ? 'text-red-600' : isPayout ? 'text-purple-600' : 'text-slate-800'}`}>
              {formatNaira(e.amountKobo)}
            </p>
            <div className="flex gap-1 justify-end mt-0.5">
              {e.sandbox && <span className="chip bg-amber-50 text-amber-600 !text-[10px]">sandbox</span>}
              {isPayout && <span className="chip bg-purple-50 text-purple-600 !text-[10px]">payout</span>}
            </div>
          </div>
        </div>

        {/* Missed note */}
        {isMissed && (
          <p className="text-xs text-red-500 bg-red-50 rounded-lg px-2 py-1">
            ⚠ Not money moved — obligation was not fulfilled before the deadline.
          </p>
        )}

        {/* Payout shortfall */}
        {isPayout && e.meta?.shortfallKobo > 0 && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1">
            ↓ {formatNaira(e.meta.shortfallKobo)} shortfall — some members missed their contribution.
          </p>
        )}

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
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: entry count + verify + CSV download */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-slate-400">{entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}</p>
        <div className="flex items-center gap-2">
          <button id="verify-ledger-btn" onClick={handleVerify} disabled={verifying} className="btn-ghost text-xs py-1.5 px-3" style={{ minHeight: 44 }}>
            {verifying ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-primary-700/30 border-t-primary-700 rounded-full animate-spin" />
                Verifying…
              </span>
            ) : '🔒 Verify'}
          </button>
          <button
            id="download-csv-btn"
            onClick={handleDownloadCsv}
            disabled={csvLoading}
            className="btn-ghost text-xs py-1.5 px-3"
            style={{ minHeight: 44 }}
          >
            {csvLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-slate-400/30 border-t-slate-500 rounded-full animate-spin" />
                Downloading…
              </span>
            ) : '⬇ CSV'}
          </button>
        </div>
      </div>

      {/* CSV error toast */}
      {csvError && (
        <div role="alert" className="px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          {csvError}
        </div>
      )}

      {verifyResult && (
        <div className={`px-4 py-3 rounded-xl border text-sm ${
          verifyResult.ok
            ? 'bg-primary-50 border-primary-200 text-primary-800'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {verifyResult.ok
            ? `✓ Ledger intact — ${verifyResult.checked} entr${verifyResult.checked !== 1 ? 'ies' : 'y'} verified`
            : `✗ Chain broken at seq ${verifyResult.brokenAtSeq ?? '?'} — ${verifyResult.reason ?? 'unknown reason'}`}
        </div>
      )}

      {entries.length === 0 && (
        <div className="card text-center py-10 space-y-2">
          <p className="text-2xl">📒</p>
          <p className="text-sm font-medium text-slate-600">No ledger entries yet</p>
          <p className="text-xs text-slate-400">Entries appear when contributions are made.</p>
        </div>
      )}

      <div className="space-y-2">
        {entries.map((e) => <LedgerEntryRow key={e._id} e={e} />)}
      </div>

      {hasMore && (
        <button id="ledger-load-more" onClick={handleLoadMore} disabled={loadingMore} className="btn-ghost w-full text-sm">
          {loadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}

// ── Main CircleDetail page ────────────────────────────────────────────────────

const TABS = ['Overview', 'Members', 'Ledger'];

export default function CircleDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [data, setData]                     = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [activeTab, setActiveTab]           = useState('Overview');
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
        <div role="alert" className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{startError}</div>
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

      {activeTab === 'Overview' && <OverviewTab data={data} circleId={id} onRefresh={fetchDetail} />}
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
