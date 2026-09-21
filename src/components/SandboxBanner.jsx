/**
 * Persistent "Sandbox mode" banner per P0 section 10.
 * Always visible — cannot be dismissed.
 */
export default function SandboxBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-amber-50 border-b border-amber-200 text-amber-800 text-xs font-medium text-center py-1.5 px-4"
    >
      Sandbox mode: no real money moves
    </div>
  );
}
