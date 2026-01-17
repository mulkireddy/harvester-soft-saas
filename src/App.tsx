import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import { Loader2 } from 'lucide-react';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import FarmersPage from './pages/Farmers';
import ExpensesPage from './pages/Expenses';
import SettingsPage from './pages/Settings';
import AdminDashboard from './pages/Admin';
import Login from './pages/Login';
import PinLock from './components/PinLock';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // PIN State
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      // If session changes (e.g. login), re-lock pin
      // But if user is just refreshing, we want to keep them Locked until they enter PIN?
      // Yes, "Bank App" style = Always lock on reload.
      setIsPinUnlocked(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Session exists, check PIN
  if (!isPinUnlocked) {
    return <PinLock onUnlock={() => setIsPinUnlocked(true)} />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route path="*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/farmers" element={<FarmersPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/admin" element={<AdminDashboard />} /> {/* Added AdminDashboard route */}
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
