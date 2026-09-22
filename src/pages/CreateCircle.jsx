import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { circlesApi } from '../api/circles.js';
import { formatNaira, toKobo } from '../utils/money.js';

const FREQ_LABEL = { weekly: 'week', biweekly: '2 weeks', monthly: 'month' };

function FieldError({ message }) {
  if (!message) return null;
  return <p className="field-error" role="alert">{message}</p>;
}

// Returns today's date as YYYY-MM-DD in the user's local timezone.
function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CreateCircle() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    contributionNaira: '',
    frequency: 'monthly',
    maxMembers: 5,
    startDate: todayLocal(),
    graceDays: 2,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Success state after create
  const [created, setCreated] = useState(null); // { circle, inviteUrl }

  function validate() {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 3)
      e.name = 'Name must be at least 3 characters';
    if (form.name.trim().length > 60)
      e.name = 'Name must be at most 60 characters';
    const naira = Number(form.contributionNaira);
    if (!form.contributionNaira || isNaN(naira) || naira < 100)
      e.contributionNaira = 'Minimum contribution is ₦100';
    if (naira > 1_000_000)
      e.contributionNaira = 'Maximum contribution is ₦1,000,000';
    if (!form.startDate)
      e.startDate = 'Start date is required';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const result = await circlesApi.create({
        name: form.name.trim(),
        contributionKobo: toKobo(Number(form.contributionNaira)),
        frequency: form.frequency,
        maxMembers: Number(form.maxMembers),
        startDate: form.startDate,
        graceDays: Number(form.graceDays),
      });
      setCreated(result);
    } catch (err) {
      const msg = err.response?.data?.error?.message ?? 'Something went wrong. Please try again.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }));
  }

  // Live summary
  const naira = Number(form.contributionNaira) || 0;
  const n = Number(form.maxMembers) || 0;
  const pot = naira * n;
  const freqWord = FREQ_LABEL[form.frequency] ?? form.frequency;
  const hasSummary = naira > 0 && n > 0;

  // ── Success screen ────────────────────────────────────────────────────────
  if (created) {
    const { circle, inviteUrl } = created;

    async function copyLink() {
      try { await navigator.clipboard.writeText(inviteUrl); } catch { }
    }

    const whatsappMsg = encodeURIComponent(
      `Join my AjoLedger savings circle "${circle.name}"! Contribute ${formatNaira(circle.contributionKobo)} every ${freqWord}.\n\nJoin here: ${inviteUrl}`
    );

    return (
      <div className="page-container max-w-sm">
        <div className="text-center mb-6 space-y-2">
          <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Circle created!</h1>
          <p className="text-sm text-slate-500">Share the invite link so members can join.</p>
        </div>

        {/* Invite link card */}
        <div className="card mb-4 space-y-3">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Invite link</p>
          <div className="bg-slate-50 rounded-lg px-3 py-2 text-sm font-mono text-slate-700 break-all select-all">
            {inviteUrl}
          </div>
          <div className="flex gap-2">
            <button
              id="copy-invite-link"
              onClick={copyLink}
              className="btn-ghost flex-1 text-sm"
            >
              Copy link
            </button>
            <a
              id="whatsapp-share"
              href={`https://wa.me/?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex-1 text-sm text-center"
            >
              Share on WhatsApp
            </a>
          </div>
        </div>

        <Link
          id="view-circle-btn"
          to={`/circles/${circle._id}`}
          className="btn-ghost w-full text-center block"
        >
          View circle →
        </Link>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="page-container max-w-md">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900">Create a circle</h1>
        <p className="text-sm text-slate-500 mt-0.5">Set up your ajo savings group.</p>
      </div>

      {serverError && (
        <div role="alert" className="mb-4 px-4 py-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-sm">
          {serverError}
        </div>
      )}

      {/* Live summary banner */}
      {hasSummary && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-primary-50 border border-primary-100 text-primary-800 text-sm font-medium">
          {n} member{n !== 1 ? 's' : ''} × {formatNaira(toKobo(naira))} ={' '}
          <span className="font-bold">{formatNaira(toKobo(pot))}</span> pot each cycle, paid out every {freqWord}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Circle name */}
        <div>
          <label htmlFor="cc-name" className="label">Circle name</label>
          <input
            id="cc-name"
            name="name"
            type="text"
            placeholder="e.g. Office Ajo 2026"
            value={form.name}
            onChange={handleChange}
            className={`input ${errors.name ? 'border-danger-400 focus:ring-danger-400' : ''}`}
            maxLength={60}
            disabled={submitting}
          />
          <FieldError message={errors.name} />
        </div>

        {/* Contribution */}
        <div>
          <label htmlFor="cc-contribution" className="label">Contribution per cycle (₦)</label>
          <input
            id="cc-contribution"
            name="contributionNaira"
            type="number"
            inputMode="numeric"
            placeholder="e.g. 20000"
            min={100}
            max={1_000_000}
            value={form.contributionNaira}
            onChange={handleChange}
            className={`input ${errors.contributionNaira ? 'border-danger-400 focus:ring-danger-400' : ''}`}
            disabled={submitting}
          />
          <FieldError message={errors.contributionNaira} />
        </div>

        {/* Frequency */}
        <div>
          <label htmlFor="cc-frequency" className="label">Payment frequency</label>
          <select
            id="cc-frequency"
            name="frequency"
            value={form.frequency}
            onChange={handleChange}
            className="input"
            disabled={submitting}
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every 2 weeks</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Max members */}
        <div>
          <label htmlFor="cc-max-members" className="label">
            Max members <span className="text-slate-400 font-normal">(2–12)</span>
          </label>
          <input
            id="cc-max-members"
            name="maxMembers"
            type="number"
            inputMode="numeric"
            min={2}
            max={12}
            value={form.maxMembers}
            onChange={handleChange}
            className="input"
            disabled={submitting}
          />
        </div>

        {/* Start date */}
        <div>
          <label htmlFor="cc-start-date" className="label">Start date</label>
          <input
            id="cc-start-date"
            name="startDate"
            type="date"
            min={todayLocal()}
            value={form.startDate}
            onChange={handleChange}
            className={`input ${errors.startDate ? 'border-danger-400 focus:ring-danger-400' : ''}`}
            disabled={submitting}
          />
          <FieldError message={errors.startDate} />
        </div>

        {/* Grace days */}
        <div>
          <label htmlFor="cc-grace-days" className="label">
            Grace period{' '}
            <span className="text-slate-400 font-normal">(days after due date to still count as on-time)</span>
          </label>
          <select
            id="cc-grace-days"
            name="graceDays"
            value={form.graceDays}
            onChange={handleChange}
            className="input"
            disabled={submitting}
          >
            {[0, 1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>{d} day{d !== 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>

        <button
          id="create-circle-submit"
          type="submit"
          disabled={submitting}
          className="btn-primary w-full mt-2"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Creating…
            </span>
          ) : (
            'Create circle'
          )}
        </button>
      </form>
    </div>
  );
}
