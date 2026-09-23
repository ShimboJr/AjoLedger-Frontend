import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useEffect, useRef, useState, useCallback } from 'react';
import SandboxBanner from './SandboxBanner.jsx';
import BottomNav from './BottomNav.jsx';
import { brand } from '../config/brand.js';
import { notificationsApi } from '../api/notifications.js';

// ── Relative time formatter ───────────────────────────────────────────────────

function relativeTime(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Kind → emoji map ──────────────────────────────────────────────────────────

const KIND_ICON = {
  payment_received: '✅',
  payment_missed:   '❌',
  payout_sent:      '🎉',
  cycle_open:       '🔔',
  circle_completed: '🏆',
  reminder:         '⏰',
  member_joined:    '👋',
};

// ── NotificationPanel ─────────────────────────────────────────────────────────

function NotificationPanel({ notifications, unreadCount, onReadAll, onRead, onClose }) {
  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="font-semibold text-sm text-slate-800">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 bg-primary-700 text-white text-xs rounded-full px-1.5 py-0.5">
              {unreadCount}
            </span>
          )}
        </span>
        {unreadCount > 0 && (
          <button
            id="notif-read-all-btn"
            onClick={onReadAll}
            className="text-xs text-primary-700 hover:text-primary-900 font-medium transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
        {notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet</p>
        ) : (
          notifications.map((n) => (
            <NotifItem key={n._id} notif={n} onRead={onRead} onClose={onClose} />
          ))
        )}
      </div>
    </div>
  );
}

function NotifItem({ notif, onRead, onClose }) {
  const icon  = KIND_ICON[notif.kind] ?? '🔔';
  const isNew = !notif.readAt;
  const dest  = notif.circle ? `/circles/${notif.circle}` : null;

  function handleClick() {
    // Mark as read on any click (navigating OR non-navigating)
    if (isNew) onRead(notif._id);
    onClose();
  }

  const inner = (
    <div className={`flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50 ${isNew ? 'bg-primary-50/40' : ''}`}>
      <span className="text-base mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className={`text-sm ${isNew ? 'font-semibold text-slate-800' : 'text-slate-700'} leading-snug`}>
          {notif.title}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.body}</p>
        <p className="text-xs text-slate-400 mt-1">{relativeTime(notif.createdAt)}</p>
      </div>
      {isNew && <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5" />}
    </div>
  );

  if (dest) {
    return (
      <Link to={dest} onClick={handleClick} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
        {inner}
      </Link>
    );
  }
  // No destination — still clickable to mark read
  return <button onClick={handleClick} className="w-full text-left">{inner}</button>;
}

// ── NotificationBell ──────────────────────────────────────────────────────────

function NotificationBell() {
  const [open, setOpen]                   = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);
  const panelRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationsApi.list();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silently ignore — bell is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount then poll every 30 s
  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  async function handleReadOne(id) {
    // Optimistic update — flip the dot off immediately
    setNotifications((prev) =>
      prev.map((n) => n._id === id ? { ...n, readAt: new Date().toISOString() } : n)
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    // Fire-and-forget — non-critical; bell will resync on next poll
    notificationsApi.readOne(id).catch(() => { /* silently ignore */ });
  }

  async function handleReadAll() {
    try {
      await notificationsApi.readAll();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    } catch { /* ignore */ }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        id="notif-bell-btn"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-primary-700 hover:bg-primary-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        {/* Bell SVG */}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {loading && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary-400 animate-ping" />
        )}
      </button>

      {/* Slide-down panel */}
      {open && (
        <NotificationPanel
          notifications={notifications}
          unreadCount={unreadCount}
          onReadAll={handleReadAll}
          onRead={handleReadOne}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// ── AppShell ──────────────────────────────────────────────────────────────────

export default function AppShell({ children }) {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Persistent sandbox banner */}
      <SandboxBanner />

      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 h-14">
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg">
            <span className="font-display font-bold text-lg text-primary-800 tracking-tight">
              {brand.name}
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {loading ? (
              /* Auth is resolving — show a neutral placeholder so guest buttons never flash */
              <div className="flex items-center gap-2 animate-pulse">
                <div className="w-20 h-7 rounded-lg bg-slate-100" />
                <div className="w-24 h-7 rounded-lg bg-slate-100" />
              </div>
            ) : user ? (
              <NotificationBell />
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Bottom nav — only when authenticated */}
      {!loading && user && <BottomNav />}
    </div>
  );
}
