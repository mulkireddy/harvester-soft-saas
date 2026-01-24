import React, { useState, useEffect } from 'react';
import { ArrowRight, Loader2, Phone, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { firebaseAuth } from '../lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

declare global {
    interface Window {
        recaptchaVerifier: any;
    }
}

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // OTP State
    const [otpSent, setOtpSent] = useState(false);
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [error, setError] = useState('');

    // Check if already logged in
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) navigate('/');
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) navigate('/');
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const setupRecaptcha = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': () => {
                    // reCAPTCHA solved
                }
            });
        }
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const formattedPhone = mobile.trim().startsWith('+') ? mobile.trim() : `+91${mobile.trim()}`;

            setupRecaptcha();
            const appVerifier = window.recaptchaVerifier;

            const confirmation = await signInWithPhoneNumber(firebaseAuth, formattedPhone, appVerifier);
            setConfirmationResult(confirmation);

            setOtpSent(true);
            toast.success('OTP Sent!');
        } catch (err: any) {
            console.error("Firebase Auth Error:", err);
            setError(err.message.replace('Firebase:', '').trim());
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (!confirmationResult) throw new Error("Session expired. Please retry.");

            // 1. Verify with Firebase
            const result = await confirmationResult.confirm(otp);
            const user = result.user;
            const idToken = await user.getIdToken();

            // 2. Exchange Token via Bridge
            const { data, error } = await supabase.functions.invoke('auth-bridge', {
                body: { idToken }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error || 'Login failed');

            // 3. Login to Supabase
            const { error: sbError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password
            });

            if (sbError) throw sbError;
            toast.success('Welcome back!');

        } catch (err: any) {
            console.error(err);
            setError('Invalid OTP or session expired.');
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
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                background: 'white',
                borderRadius: '16px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img src="/logo.png" alt="HarvesterOS" style={{ height: '64px', width: 'auto', marginBottom: '1rem' }} />
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>HarvesterOS</h1>
                    <p style={{ color: '#6B7280', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        {otpSent ? 'Enter the code sent to your mobile' : 'Enter your mobile number to continue'}
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: '0.75rem',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        color: '#B91C1C',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <div id="recaptcha-container"></div>

                <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
                    {!otpSent ? (
                        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="label" style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem', display: 'block' }}>Mobile Number</label>
                            <div style={{ position: 'relative' }}>
                                <Phone size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                                <input
                                    type="tel"
                                    className="input"
                                    placeholder="9876543210"
                                    style={{
                                        paddingLeft: '2.5rem',
                                        width: '100%',
                                        height: '48px',
                                        fontSize: '1rem',
                                        border: '1px solid #D1D5DB',
                                        borderRadius: '8px'
                                    }}
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="input-group" style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.3s' }}>
                            <label className="label" style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem', display: 'block' }}>Verification Code</label>
                            <div style={{ position: 'relative' }}>
                                <MessageSquare size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="123456"
                                    style={{
                                        paddingLeft: '2.5rem',
                                        width: '100%',
                                        height: '48px',
                                        fontSize: '1.25rem',
                                        letterSpacing: '4px',
                                        fontWeight: 700,
                                        border: '1px solid #D1D5DB',
                                        borderRadius: '8px'
                                    }}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    maxLength={6}
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            justifyContent: 'center',
                            padding: '0.875rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            borderRadius: '8px',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            marginTop: '0.5rem'
                        }}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (
                            <>{otpSent ? 'Verify & Login' : 'Get OTP'} <ArrowRight size={20} style={{ marginLeft: '8px' }} /></>
                        )}
                    </button>

                    {otpSent && (
                        <button
                            type="button"
                            onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}
                            style={{
                                width: '100%',
                                marginTop: '1.5rem',
                                background: 'none',
                                border: 'none',
                                color: '#6B7280',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            Change Number
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Login;
