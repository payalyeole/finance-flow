import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/Sidebar';
import './index.css';

const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Transactions = React.lazy(() => import('./pages/Transactions'));
const Users = React.lazy(() => import('./pages/Users'));

// Loading spinner
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', gap: 12, color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)', fontSize: '0.8rem'
    }}>
      <div className="spinner" />
      Loading...
    </div>
  );
}

function ProtectedLayout({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      {children}
    </div>
  );
}

function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={
          <ProtectedLayout><Dashboard /></ProtectedLayout>
        } />
        <Route path="/transactions" element={
          <ProtectedLayout><Transactions /></ProtectedLayout>
        } />
        <Route path="/users" element={
          <AdminRoute><ProtectedLayout><Users /></ProtectedLayout></AdminRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}