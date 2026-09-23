import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AppShell from './components/AppShell.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Lazy-loaded pages — each becomes a separate JS chunk for faster initial load
const Landing         = lazy(() => import('./pages/Landing.jsx'));
const Login           = lazy(() => import('./pages/Login.jsx'));
const Register        = lazy(() => import('./pages/Register.jsx'));
const Dashboard       = lazy(() => import('./pages/Dashboard.jsx'));
const CreateCircle    = lazy(() => import('./pages/CreateCircle.jsx'));
const CircleDetail    = lazy(() => import('./pages/CircleDetail.jsx'));
const JoinCircle      = lazy(() => import('./pages/JoinCircle.jsx'));
const PaymentCallback = lazy(() => import('./pages/PaymentCallback.jsx'));
const TrustPage       = lazy(() => import('./pages/TrustPage.jsx'));
const PublicTrustPage = lazy(() => import('./pages/PublicTrustPage.jsx'));
const ProfilePage     = lazy(() => import('./pages/ProfilePage.jsx'));
const NotFound        = lazy(() => import('./pages/NotFound.jsx'));

// Minimal loading fallback shown while a lazy chunk is fetching
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-700 rounded-full animate-spin" />
    </div>
  );
}

function RedirectIfLoggedIn({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <AppShell>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<RedirectIfLoggedIn><Landing /></RedirectIfLoggedIn>} />
          <Route path="/login"    element={<RedirectIfLoggedIn><Login /></RedirectIfLoggedIn>} />
          <Route path="/register" element={<RedirectIfLoggedIn><Register /></RedirectIfLoggedIn>} />

          {/* Public join preview — JoinCircle handles its own auth check internally */}
          <Route path="/join/:code" element={<JoinCircle />} />

          {/* Public trust profile — minimal chrome, no login required */}
          <Route path="/t/:slug" element={<PublicTrustPage />} />

          {/* Protected */}
          <Route path="/dashboard"           element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/circles/new"         element={<ProtectedRoute><CreateCircle /></ProtectedRoute>} />
          <Route path="/circles/:id"         element={<ProtectedRoute><CircleDetail /></ProtectedRoute>} />
          <Route path="/payments/callback"   element={<ProtectedRoute><PaymentCallback /></ProtectedRoute>} />
          <Route path="/trust"               element={<ProtectedRoute><TrustPage /></ProtectedRoute>} />
          <Route path="/profile"             element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
