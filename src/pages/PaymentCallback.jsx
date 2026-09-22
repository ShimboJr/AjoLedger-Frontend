import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { paymentsApi } from '../api/payments.js';
import { formatNaira } from '../utils/money.js';
import { formatDate } from '../utils/dates.js';

/**
 * /payments/callback
 *
 * Paystack redirects here after a payment attempt with ?reference=... or ?trxref=...
 * We call GET /api/payments/verify/:reference — which is idempotent — to settle
 * and display the outcome. Refreshing this page is completely safe.
 */
export default function PaymentCallback() {
  const [params] = useSearchParams();
  const navigate  = useNavigate();

  const reference = params.get('reference') || params.get('trxref');

  const [status, setStatus]     = useState('loading'); // 'loading' | 'success' | 'error' | 'no-ref'
  const [result, setResult]     = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Track whether we've already called verify so double-renders (React StrictMode) don't double-call.
  const verified = useRef(false);

  useEffect(() => {
    if (!reference) { setStatus('no-ref'); return; }
    if (verified.current) return;
    verified.current = true;

    paymentsApi.verify(reference)
      .then((data) => {
        if (data.settled || data.alreadySettled) {
          setResult(data);
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMsg(data.reason?.replace(/_/g, ' ') ?? 'Payment was not successful.');
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.error?.message ?? 'Verification failed. Please try again.';
        setErrorMsg(msg);
        setStatus('error');
      });
  }, [reference]);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="page-container max-w-sm flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Verifying your payment…</p>
        <p className="text-xs text-slate-400">Please do not close this page.</p>
      </div>
    );
  }

  // ── No reference in URL ─────────────────────────────────────────────────────
  if (status === 'no-ref') {
    return (
      <div className="page-container max-w-sm text-center space-y-4 pt-12">
        <p className="text-slate-500 text-sm">No payment reference found in the URL.</p>
        <Link to="/dashboard" className="btn-ghost text-sm">← Go to my circles</Link>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="page-container max-w-sm space-y-6 pt-8">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-danger-50 flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 className="font-display text-xl font-bold text-slate-900">Payment not confirmed</h1>
          <p className="text-sm text-slate-500">{errorMsg}</p>
        </div>

        <div className="card space-y-2 text-sm text-slate-500">
          <p className="font-medium text-slate-700">What happened?</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>The payment may have been cancelled or declined.</li>
            <li>In Paystack test mode, incomplete OTP or 3DS steps cause this.</li>
            <li>Your obligation is still marked <strong>pending</strong> — you can retry.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <button
            id="payment-retry-btn"
            onClick={() => { verified.current = false; setStatus('loading'); setErrorMsg(''); paymentsApi.verify(reference).then((data) => { if (data.settled || data.alreadySettled) { setResult(data); setStatus('success'); } else { setStatus('error'); setErrorMsg(data.reason?.replace(/_/g, ' ') ?? 'Payment was not successful.'); } }).catch(() => { setStatus('error'); setErrorMsg('Verification failed. Please try again.'); }); }}
            className="btn-primary w-full"
          >
            Retry verification
          </button>
          <Link to="/dashboard" className="btn-ghost w-full text-center block">Back to my circles</Link>
        </div>
      </div>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  const { obligation, payment } = result ?? {};
  const circleId = payment?.circle ?? obligation?.circle;

  return (
    <div className="page-container max-w-sm space-y-6 pt-8">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Payment confirmed!</h1>
        <p className="text-sm text-slate-500">
          {obligation?.status === 'paid_on_time'
            ? 'Paid on time — your contribution is recorded.'
            : 'Payment received (late) — your contribution is recorded.'}
        </p>
      </div>

      {/* Payment details */}
      {obligation && (
        <div className="card space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Amount</span>
            <span className="font-semibold text-slate-800">{formatNaira(obligation.amountKobo)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Cycle</span>
            <span className="font-medium text-slate-800">{obligation.cycleNumber}</span>
          </div>
          {obligation.paidAt && (
            <div className="flex justify-between">
              <span className="text-slate-500">Date</span>
              <span className="font-medium text-slate-800">{formatDate(new Date(obligation.paidAt))}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Reference</span>
            <span className="font-mono text-xs text-slate-400 truncate max-w-[160px]">{reference}</span>
          </div>
          <div className="pt-1 border-t border-slate-100 text-xs text-center text-amber-600">
            🧪 Test mode — no real money was moved
          </div>
        </div>
      )}

      {circleId ? (
        <Link
          id="back-to-circle-btn"
          to={`/circles/${circleId}`}
          className="btn-primary w-full text-center block"
        >
          View circle →
        </Link>
      ) : (
        <Link to="/dashboard" className="btn-primary w-full text-center block">My circles →</Link>
      )}
    </div>
  );
}
