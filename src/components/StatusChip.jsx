/**
 * StatusChip — consistent obligation status chip.
 * Spec: pending=slate, paid_on_time=green, paid_late=amber-dark,
 *       overdue=amber, missed=red. Text label always shown (never color alone).
 */

const CHIP_CONFIG = {
  pending:      { label: 'Pending',       cls: 'bg-slate-100 text-slate-600' },
  paid_on_time: { label: 'Paid on time',  cls: 'bg-emerald-100 text-emerald-700' },
  paid_late:    { label: 'Paid late',     cls: 'bg-orange-100 text-orange-700' },
  overdue:      { label: 'Overdue',       cls: 'bg-amber-200 text-amber-800' },
  missed:       { label: 'Missed',        cls: 'bg-red-100 text-red-700' },
};

export default function StatusChip({ status, className = '' }) {
  const cfg = CHIP_CONFIG[status] ?? { label: status ?? '—', cls: 'bg-slate-100 text-slate-500' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls} ${className}`}>
      {cfg.label}
    </span>
  );
}
