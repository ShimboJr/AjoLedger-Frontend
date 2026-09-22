import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AppShell from './components/AppShell.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Landing          from './pages/Landing.jsx';
import Login            from './pages/Login.jsx';
import Register         from './pages/Register.jsx';
import Dashboard        from './pages/Dashboard.jsx';
import CreateCircle     from './pages/CreateCircle.jsx';
import CircleDetail     from './pages/CircleDetail.jsx';
import JoinCircle       from './pages/JoinCircle.jsx';
import PaymentCallback  from './pages/PaymentCallback.jsx';
import NotFound         from './pages/NotFound.jsx';

function RedirectIfLoggedIn({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        {/* Public */}
        <Route path="/" element={<RedirectIfLoggedIn><Landing /></RedirectIfLoggedIn>} />
        <Route path="/login"    element={<RedirectIfLoggedIn><Login /></RedirectIfLoggedIn>} />
        <Route path="/register" element={<RedirectIfLoggedIn><Register /></RedirectIfLoggedIn>} />

        {/* Public join preview — JoinCircle handles its own auth check internally */}
        <Route path="/join/:code" element={<JoinCircle />} />

        {/* Protected */}
        <Route path="/dashboard"           element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/circles/new"         element={<ProtectedRoute><CreateCircle /></ProtectedRoute>} />
        <Route path="/circles/:id"         element={<ProtectedRoute><CircleDetail /></ProtectedRoute>} />
        <Route path="/payments/callback"   element={<ProtectedRoute><PaymentCallback /></ProtectedRoute>} />

        {/* Day 4+: trust profile, payments routes */}

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
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
