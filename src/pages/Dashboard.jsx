import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900">
          My Circles
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Welcome back, {user?.name?.split(' ')[0]}.
        </p>
      </div>

      {/* Placeholder — circles list added Day 2 */}
      <div className="card text-center py-12 space-y-3">
        <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <p className="font-semibold text-slate-700">No circles yet</p>
        <p className="text-sm text-slate-400">
          Create a circle or join one with an invite link to get started.
        </p>
        <button id="dashboard-create-circle-btn" className="btn-primary mx-auto" disabled>
          Create circle — coming Day 2
        </button>
      </div>
    </div>
  );
}
