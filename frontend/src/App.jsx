import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import ClientDashboard from './pages/ClientDashboard';
import NGODashboard from './pages/NGODashboard';
import AdminDashboard from './pages/AdminDashboard';
import Blog from './pages/Blog';
import Gallery from './pages/Gallery';
import About from './pages/About';
import Contact from './pages/Contact';
import Feedback from './pages/Feedback';

// Protected Route wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-yellow dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-zinc-500">Loading PlatePulse...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'Admin') return <Navigate to="/admin" replace />;
    if (user.role === 'NGO') return <Navigate to="/ngo" replace />;
    return <Navigate to="/client" replace />;
  }

  return children;
};

// Public only route (redirect logged-in users to their dashboard)
const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    if (user.role === 'Admin') return <Navigate to="/admin" replace />;
    if (user.role === 'NGO') {
      if (user.status === 'Verified') return <Navigate to="/ngo" replace />;
      return <Navigate to="/ngo/verify" replace />;
    }
    return <Navigate to="/client" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<About />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/feedback" element={<Feedback />} />
      <Route path="/contact" element={<Contact />} />

      {/* Auth Route - redirect if already logged in */}
      <Route path="/login" element={
        <PublicOnlyRoute>
          <Login />
        </PublicOnlyRoute>
      } />

      {/* Client Dashboard */}
      <Route path="/client" element={
        <ProtectedRoute allowedRoles={['Client', 'Admin']}>
          <ClientDashboard />
        </ProtectedRoute>
      } />

      {/* NGO Dashboard - both verified and unverified, handles internally */}
      <Route path="/ngo" element={
        <ProtectedRoute allowedRoles={['NGO']}>
          <NGODashboard />
        </ProtectedRoute>
      } />
      <Route path="/ngo/verify" element={
        <ProtectedRoute allowedRoles={['NGO']}>
          <NGODashboard />
        </ProtectedRoute>
      } />

      {/* Admin Dashboard */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
