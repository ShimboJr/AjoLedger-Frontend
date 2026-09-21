import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import SandboxBanner from './SandboxBanner.jsx';
import BottomNav from './BottomNav.jsx';
import { brand } from '../config/brand.js';

export default function AppShell({ children }) {
  const { user } = useAuth();

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Persistent sandbox banner */}
      <SandboxBanner />

      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 h-14">
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg">
            {/* Simple wordmark */}
            <span className="font-display font-bold text-lg text-primary-800 tracking-tight">
              {brand.name}
            </span>
          </Link>

          {!user && (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                id="header-login-link"
                className="text-sm font-medium text-slate-600 hover:text-primary-700 transition-colors px-3 py-1.5"
              >
                Log in
              </Link>
              <Link
                to="/register"
                id="header-register-link"
                className="btn-primary !py-1.5 !px-3 !text-xs !min-h-0"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Bottom nav — only when authenticated */}
      {user && <BottomNav />}
    </div>
  );
}
