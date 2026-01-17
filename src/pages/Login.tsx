import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, Loader2, Phone } from 'lucide-react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    // Check if already logged in (e.g. from Email Link)
    useEffect(() => {
        // Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) navigate('/');
        });

        // Listen for changes (e.g. hash fragment processing from Magic Link)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) navigate('/');
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Handle Mobile Number Alias
            let authEmail = email.trim();
            // If strictly digits (10 chars or more), append domain
            if (/^\d{10,}$/.test(authEmail)) {
                authEmail = `${authEmail}@harvester.app`;
            }

            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email: authEmail,
                    password,
                    // We don't set PIN here. User sets it on next screen (PinLock)
                });
                if (error) throw error;
                // Auto login happens usually.
                // If email confirmation is off, we are good.
                alert('Account created! Please check your email and click the confirmation link.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email: authEmail,
                    password,
                });
                if (error) throw error;
            }
            // Navigation handled by useEffect above when session updates
        } catch (err: any) {
            console.error(err);
            if (err.message === 'Invalid login credentials') {
                setError('Invalid credentials. If this is your first time, please switch to "Create One" below.');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F3F4F6',
            padding: '1rem'
        }}>
            <div className="card" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2.5rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <img src="/logo.png" alt="HarvesterOS" style={{ height: '72px', width: 'auto', marginBottom: '1rem' }} />
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '0.25rem' }}>HarvesterOS</h1>
                    <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1.5rem' }}>Business Manager</p>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>
                        {isSignUp ? 'Create Account' : 'Welcome Back'}
                    </h2>
                    <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
                        {isSignUp ? 'Start managing your harvest business.' : 'Enter your credentials to access.'}
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: '1rem',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        color: '#B91C1C',
                        borderRadius: '12px',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        display: 'flex', gap: '8px'
                    }}>
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleAuth}>
                    <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                        <label className="label">Mobile Number or Email</label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                            <input
                                type="text"
                                className="input"
                                placeholder="98765 43210"
                                style={{ paddingLeft: '2.5rem', width: '100%' }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group" style={{ marginBottom: '2rem' }}>
                        <label className="label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                            <input
                                type="password"
                                className="input"
                                placeholder="••••••••"
                                style={{ paddingLeft: '2.5rem', width: '100%' }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (
                            <>{isSignUp ? 'Sign Up' : 'Sign In'} <ArrowRight size={20} style={{ marginLeft: '8px' }} /></>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: '#6B7280' }}>
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button
                        onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                        style={{
                            background: 'none', border: 'none',
                            color: 'var(--primary)', fontWeight: 600,
                            cursor: 'pointer', padding: 0
                        }}
                    >
                        {isSignUp ? 'Log in' : 'Create one'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
