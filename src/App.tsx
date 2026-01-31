import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';

import Layout from './components/common/Layout';
import ToastProvider from './components/common/Toast';
import PinLock from './components/common/PinLock';

// Lazy Load Pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Reports = React.lazy(() => import('./pages/Reports'));
const FarmersPage = React.lazy(() => import('./pages/Farmers'));
const ExpensesPage = React.lazy(() => import('./pages/Expenses'));
const SettingsPage = React.lazy(() => import('./pages/Settings'));
const AdminDashboard = React.lazy(() => import('./pages/Admin'));
const Login = React.lazy(() => import('./pages/Login'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingMachines, setCheckingMachines] = useState(true);
  const [hasMachines, setHasMachines] = useState(false);

  // PIN State
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // 1. Check Session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(currentSession);

      if (currentSession) {
        // 2. Check Machines (Onboarding Logic)
        try {
          const { count } = await supabase
            .from('machines')
            .select('*', { count: 'exact', head: true });

          if (mounted) {
            setHasMachines(count ? count > 0 : false);
          }
        } catch (e) {
          console.error("Machine check failed", e);
        } finally {
          if (mounted) setCheckingMachines(false);
        }
      } else {
        if (mounted) setCheckingMachines(false);
      }

      if (mounted) setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        // If logging out, reset states
        if (!session) {
          setLoading(false);
          setIsPinUnlocked(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading || (session && checkingMachines)) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Onboarding Redirection Logic
  const isOnboardingRoute = window.location.pathname === '/onboarding';

  // If user has NO machines and is NOT on onboarding page -> Go to Onboarding
  if (!hasMachines && !isOnboardingRoute) {
    return <Navigate to="/onboarding" replace />;
  }

  // If user HAS machines and IS on onboarding page -> Go to Dashboard
  if (hasMachines && isOnboardingRoute) {
    return <Navigate to="/" replace />;
  }

  // Exclude Onboarding from PIN Lock (new users shouldn't be locked immediately after signup/login if they just verified phone) 
  // OR Keep it safe? Let's keep it safe. "Bank App Style" applies everywhere.
  if (!isPinUnlocked) {
    return <PinLock onUnlock={() => setIsPinUnlocked(true)} />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <ToastProvider>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={
            <Suspense fallback={
              <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" size={32} color="var(--primary)" />
              </div>
            }>
              <Login />
            </Suspense>
          } />

          {/* Protected Routes */}
          <Route path="*" element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={
                  <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                  </div>
                }>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/farmers" element={<FarmersPage />} />
                    <Route path="/expenses" element={<ExpensesPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                  </Routes>
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </ToastProvider>
    </Router>
  );
}

export default App;
