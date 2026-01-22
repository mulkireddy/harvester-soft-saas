import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, Loader2, Phone, Mail, ArrowLeft, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

type ViewMode = 'login' | 'signup' | 'forgot' | 'otp';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('otp');

    // OTP State
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');

    // Check if already logged in (e.g. from Email Link)
    useEffect(() => {
        // Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) navigate('/');
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                navigate('/');
                toast('Please update your password in Settings', { icon: '🔑' });
            } else if (session) {
                navigate('/');
            }
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

            if (viewMode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email: authEmail,
                    password,
                });
                if (error) throw error;
                alert('Account created! Please check your email and click the confirmation link.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email: authEmail,
                    password,
                });
                if (error) throw error;
            }
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

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            let authEmail = email.trim();
            if (/^\d{10,}$/.test(authEmail)) {
                setError('Cannot reset password for Mobile Login (SMS not configured). Contact Admin.');
                setLoading(false);
                return;
            }

            const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
                redirectTo: window.location.origin
            });
            if (error) throw error;

            toast.success('Reset link sent! Check your email.');
            setViewMode('login');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const formattedPhone = email.trim().startsWith('+') ? email.trim() : `+91${email.trim()}`;

            const { error } = await supabase.auth.signInWithOtp({
                phone: formattedPhone
            });
            if (error) throw error;

            setOtpSent(true);
            toast.success('OTP Sent!');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const formattedPhone = email.trim().startsWith('+') ? email.trim() : `+91${email.trim()}`;

            const { error } = await supabase.auth.verifyOtp({
                phone: formattedPhone,
                token: otp,
                type: 'sms'
            });

            if (error) throw error;

            // Success handled by onAuthStateChange listener which will redirect
            toast.success('Verified!');

        } catch (err: any) {
            setError(err.message);
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
                        {viewMode === 'signup' ? 'Create Account' :
                            viewMode === 'forgot' ? 'Reset Password' :
                                viewMode === 'otp' ? 'Login with OTP' : 'Login with Password'}
                    </h2>
                    <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
                        {viewMode === 'signup' ? 'Start managing your harvest business.' :
                            viewMode === 'forgot' ? 'Enter email to receive reset link.' :
                                viewMode === 'otp' ? 'Enter your mobile number to get started.' :
                                    'Enter your credentials to access.'}
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

                {/* OTP Mode (Default) */}
                {viewMode === 'otp' && (
                    <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
                        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="label">Mobile Number</label>
                            <div style={{ position: 'relative' }}>
                                <Phone size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                                <input
                                    type="tel"
                                    className="input"
                                    placeholder="9876543210"
                                    style={{ paddingLeft: '2.5rem', width: '100%' }}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={otpSent}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {otpSent && (
                            <div className="input-group" style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.3s' }}>
                                <label className="label">Enter OTP</label>
                                <div style={{ position: 'relative' }}>
                                    <MessageSquare size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="123456"
                                        style={{ paddingLeft: '2.5rem', width: '100%', letterSpacing: '4px', fontWeight: 700 }}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                        maxLength={6}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1rem' }}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (
                                <>{otpSent ? 'Verify & Login' : 'Send OTP'} <ArrowRight size={20} style={{ marginLeft: '8px' }} /></>
                            )}
                        </button>

                        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                            <div className="relative mb-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-[#F3F4F6] px-2 text-gray-500">Or continue with</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => { setViewMode('login'); setError(''); setOtpSent(false); setOtp(''); }}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-light)',
                                    borderRadius: '8px',
                                    color: 'var(--text-main)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Lock size={16} /> Login with Password
                            </button>
                        </div>
                    </form>
                )}

                {/* Login / Signup Mode (Secondary) */}
                {(viewMode === 'login' || viewMode === 'signup') && (
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

                        <div className="input-group" style={{ marginBottom: '0.5rem' }}>
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

                        {viewMode === 'login' && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <button
                                    type="button"
                                    onClick={() => { setViewMode('forgot'); setError(''); }}
                                    style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        )}

                        <div style={{ marginBottom: viewMode === 'signup' ? '2rem' : '0' }}></div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1rem' }}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (
                                <>{viewMode === 'signup' ? 'Sign Up' : 'Sign In'} <ArrowRight size={20} style={{ marginLeft: '8px' }} /></>
                            )}
                        </button>

                        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: '#6B7280' }}>
                            <button
                                type="button"
                                onClick={() => { setViewMode('otp'); setError(''); }}
                                style={{
                                    background: 'none', border: 'none',
                                    color: 'var(--primary)', fontWeight: 600,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', margin: '0 auto 1.5rem auto'
                                }}
                            >
                                <ArrowLeft size={16} /> Back to OTP Login
                            </button>


                            {viewMode === 'login' ? (
                                <p>
                                    Don't have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => { setViewMode('signup'); setError(''); }}
                                        style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        Create one
                                    </button>
                                </p>
                            ) : (
                                <p>
                                    Already have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => { setViewMode('login'); setError(''); }}
                                        style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        Log in
                                    </button>
                                </p>
                            )}
                        </div>
                    </form>
                )}

                {/* Forgot Password Mode */}
                {viewMode === 'forgot' && (
                    <form onSubmit={handleReset}>
                        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="label">Registered Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                                <input
                                    type="email"
                                    className="input"
                                    placeholder="your@email.com"
                                    style={{ paddingLeft: '2.5rem', width: '100%' }}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
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
                                <>Send Reset Link <ArrowRight size={20} style={{ marginLeft: '8px' }} /></>
                            )}
                        </button>

                        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                            <button
                                type="button"
                                onClick={() => { setViewMode('login'); setError(''); }}
                                style={{
                                    background: 'none', border: 'none',
                                    color: '#6B7280', fontWeight: 600,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', margin: '0 auto'
                                }}
                            >
                                <ArrowLeft size={16} /> Back to Login
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
