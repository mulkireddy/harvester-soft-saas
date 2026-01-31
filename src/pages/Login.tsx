import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Loader2, Phone, Shield, Wheat } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { firebaseAuth } from '../lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { playSuccessHaptic, playErrorHaptic, playClickHaptic } from '../lib/ui-utils';

declare global {
    interface Window {
        recaptchaVerifier: any;
    }
}

// Animated Wheat Illustration Component
const WheatAnimation: React.FC = () => (
    <div style={{
        position: 'absolute',
        bottom: '-20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px',
        opacity: 0.15
    }}>
        {[...Array(5)].map((_, i) => (
            <div
                key={i}
                style={{
                    animation: `sway ${2 + i * 0.3}s ease-in-out infinite`,
                    animationDelay: `${i * 0.2}s`,
                    transformOrigin: 'bottom center'
                }}
            >
                <Wheat
                    size={40 + i * 5}
                    style={{
                        color: 'white',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                    }}
                />
            </div>
        ))}
    </div>
);

// Floating particles component
const FloatingParticles: React.FC = () => (
    <div style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
    }}>
        {[...Array(6)].map((_, i) => (
            <div
                key={i}
                style={{
                    position: 'absolute',
                    width: '8px',
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    left: `${15 + i * 15}%`,
                    animation: `float ${4 + i}s ease-in-out infinite`,
                    animationDelay: `${i * 0.5}s`
                }}
            />
        ))}
    </div>
);

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // OTP State
    const [otpSent, setOtpSent] = useState(false);
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [error, setError] = useState('');
    const [countryCode] = useState('+91');
    const [shakeError, setShakeError] = useState(false);
    const [buttonPressed, setButtonPressed] = useState(false);

    // OTP input refs for auto-focus
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

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

    const triggerShake = () => {
        setShakeError(true);
        playErrorHaptic();
        setTimeout(() => setShakeError(false), 500);
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        playClickHaptic();

        try {
            const formattedPhone = `${countryCode}${mobile.trim()}`;

            setupRecaptcha();
            const appVerifier = window.recaptchaVerifier;

            const confirmation = await signInWithPhoneNumber(firebaseAuth, formattedPhone, appVerifier);
            setConfirmationResult(confirmation);

            setOtpSent(true);
            playSuccessHaptic();
            toast.success('OTP Sent!');
            // Focus first OTP input
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch (err: any) {
            console.error("Firebase Auth Error:", err);
            setError(err.message.replace('Firebase:', '').trim());
            triggerShake();
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) {
            // Handle paste
            const digits = value.replace(/\D/g, '').slice(0, 6).split('');
            const newOtp = [...otp];
            digits.forEach((digit, i) => {
                if (index + i < 6) newOtp[index + i] = digit;
            });
            setOtp(newOtp);
            // Focus last filled or next empty
            const nextIndex = Math.min(index + digits.length, 5);
            otpRefs.current[nextIndex]?.focus();
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value.replace(/\D/g, '');
        setOtp(newOtp);

        // Auto-advance to next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    // Auto-submit when all 6 digits entered
    useEffect(() => {
        const otpString = otp.join('');
        if (otpString.length === 6 && otpSent && !loading) {
            handleVerifyOtp();
        }
    }, [otp]);

    const handleVerifyOtp = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 6) return;

        setError('');
        setLoading(true);
        playClickHaptic();

        try {
            if (!confirmationResult) throw new Error("Session expired. Please retry.");

            // 1. Verify with Firebase
            const result = await confirmationResult.confirm(otpString);
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

            // CRITICAL: If user logs in via OTP, we allow them to reset their PIN.
            // We clear the existing PIN from metadata so PinLock.tsx switches to 'create' mode.
            await supabase.auth.updateUser({
                data: { pin: null }
            });

            if (sbError) throw sbError;
            playSuccessHaptic();
            toast.success('Welcome back!');

        } catch (err: any) {
            console.error(err);
            setError('Invalid OTP. Please try again.');
            triggerShake();
            setOtp(['', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleButtonPress = () => {
        setButtonPressed(true);
        playClickHaptic();
    };

    const handleButtonRelease = () => {
        setButtonPressed(false);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #059669 0%, #0D9488 50%, #1E40AF 100%)',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated Background Pattern */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                animation: 'patternMove 20s linear infinite'
            }} />

            {/* Floating Particles */}
            <FloatingParticles />

            {/* Wheat Animation at Bottom */}
            <WheatAnimation />

            {/* Glassmorphism Card */}
            <div
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '2.5rem',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                    position: 'relative',
                    zIndex: 1
                }}
                className="animate-scale-in"
            >

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #059669 0%, #0D9488 100%)',
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.25rem',
                        boxShadow: '0 8px 24px rgba(5, 150, 105, 0.3)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Shine effect */}
                        <div style={{
                            position: 'absolute',
                            top: '-50%',
                            left: '-50%',
                            width: '200%',
                            height: '200%',
                            background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
                            animation: 'shine 3s ease-in-out infinite'
                        }} />
                        <img
                            src="/logo.png"
                            alt="HarvesterOS"
                            style={{ height: '52px', width: 'auto', position: 'relative', zIndex: 1 }}
                            onError={(e) => {
                                // Fallback to wheat icon if logo not found
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                        <Wheat
                            size={36}
                            style={{
                                color: 'white',
                                position: 'absolute',
                                opacity: 0
                            }}
                        />
                    </div>
                    <h1 style={{
                        fontSize: '1.875rem',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        marginBottom: '0.5rem',
                        letterSpacing: '-0.02em'
                    }}>
                        HarvesterOS
                    </h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.95rem'
                    }}>
                        {otpSent
                            ? `Enter the 6-digit code sent to ${countryCode} ${mobile}`
                            : 'Smart farming, simplified'}
                    </p>
                </div>

                {/* Error Alert with Shake Animation */}
                {error && (
                    <div
                        style={{
                            padding: '0.875rem 1rem',
                            background: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
                            border: '1px solid #FECACA',
                            color: '#B91C1C',
                            borderRadius: 'var(--radius-lg)',
                            marginBottom: '1.5rem',
                            fontSize: '0.875rem',
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                        className={shakeError ? 'animate-shake' : ''}
                    >
                        <Shield size={16} />
                        {error}
                    </div>
                )}

                <div id="recaptcha-container"></div>

                <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
                    {!otpSent ? (
                        /* Mobile Number Input */
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{
                                fontWeight: 600,
                                color: 'var(--text-main)',
                                marginBottom: '0.75rem',
                                display: 'block',
                                fontSize: '0.9rem'
                            }}>
                                Mobile Number
                            </label>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <div style={{
                                    position: 'absolute',
                                    left: '14px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: 'var(--text-muted)',
                                    pointerEvents: 'none'
                                }}>
                                    <Phone size={20} />
                                    <span style={{
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        paddingRight: '8px',
                                        borderRight: '1px solid var(--border-light)'
                                    }}>+91</span>
                                </div>
                                <input
                                    type="tel"
                                    className="input"
                                    placeholder="98765 43210"
                                    style={{
                                        paddingLeft: '5.5rem',
                                        width: '100%',
                                        height: '52px',
                                        fontSize: '1.25rem',
                                        fontWeight: 600,
                                        borderRadius: 'var(--radius-lg)',
                                        border: '2px solid var(--border-light)',
                                        transition: 'all 0.2s ease',
                                        letterSpacing: '0.02em'
                                    }}
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    required
                                    autoFocus
                                    maxLength={10}
                                />
                            </div>
                        </div>
                    ) : (
                        /* OTP Input - 6 Separate Boxes */
                        <div style={{ marginBottom: '1.5rem' }} className="animate-fade-in">
                            <label style={{
                                fontWeight: 600,
                                color: 'var(--text-main)',
                                marginBottom: '0.75rem',
                                display: 'block',
                                fontSize: '0.9rem',
                                textAlign: 'center'
                            }}>
                                Verification Code
                            </label>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    justifyContent: 'center'
                                }}
                                className={shakeError ? 'animate-shake' : ''}
                            >
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => { otpRefs.current[index] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        style={{
                                            width: '48px',
                                            height: '60px',
                                            textAlign: 'center',
                                            fontSize: '1.5rem',
                                            fontWeight: 700,
                                            border: digit
                                                ? '2px solid var(--primary)'
                                                : '2px solid var(--border-light)',
                                            borderRadius: 'var(--radius-lg)',
                                            background: digit
                                                ? 'linear-gradient(135deg, #F0FDF4, #ECFDF5)'
                                                : 'white',
                                            transition: 'all 0.15s ease',
                                            outline: 'none',
                                            boxShadow: digit
                                                ? '0 4px 12px rgba(5, 150, 105, 0.15)'
                                                : 'none'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary)';
                                            e.target.style.boxShadow = '0 0 0 4px rgba(5, 150, 105, 0.15)';
                                            e.target.style.transform = 'scale(1.05)';
                                        }}
                                        onBlur={(e) => {
                                            if (!digit) {
                                                e.target.style.borderColor = 'var(--border-light)';
                                            }
                                            e.target.style.boxShadow = digit
                                                ? '0 4px 12px rgba(5, 150, 105, 0.15)'
                                                : 'none';
                                            e.target.style.transform = 'scale(1)';
                                        }}
                                    />
                                ))}
                            </div>
                            <p style={{
                                textAlign: 'center',
                                marginTop: '1.25rem',
                                fontSize: '0.875rem',
                                color: 'var(--text-muted)'
                            }}>
                                Didn't receive? <button
                                    type="button"
                                    onClick={() => {
                                        playClickHaptic();
                                        setOtpSent(false);
                                        setOtp(['', '', '', '', '', '']);
                                        setError('');
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--primary)',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    Resend
                                </button>
                            </p>
                        </div>
                    )}

                    {/* Submit Button with Press Feedback */}
                    <button
                        type="submit"
                        onMouseDown={handleButtonPress}
                        onMouseUp={handleButtonRelease}
                        onMouseLeave={handleButtonRelease}
                        onTouchStart={handleButtonPress}
                        onTouchEnd={handleButtonRelease}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1rem',
                            fontSize: '1rem',
                            fontWeight: 700,
                            borderRadius: 'var(--radius-lg)',
                            gap: '0.5rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            background: loading
                                ? '#9CA3AF'
                                : 'linear-gradient(135deg, #059669 0%, #0D9488 100%)',
                            color: 'white',
                            border: 'none',
                            boxShadow: buttonPressed
                                ? '0 2px 8px rgba(5, 150, 105, 0.3), inset 0 2px 4px rgba(0,0,0,0.1)'
                                : '0 8px 24px rgba(5, 150, 105, 0.35)',
                            transform: buttonPressed ? 'scale(0.98) translateY(1px)' : 'scale(1)',
                            transition: 'all 0.15s ease'
                        }}
                        disabled={loading || (otpSent && otp.join('').length !== 6) || (!otpSent && mobile.length !== 10)}
                    >
                        {loading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                {otpSent ? 'Verify & Login' : 'Continue'}
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                {/* Footer with Terms */}
                <p style={{
                    textAlign: 'center',
                    marginTop: '1.5rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.6
                }}>
                    By continuing, you agree to our{' '}
                    <a href="#" style={{ color: 'var(--primary)', fontWeight: 600 }}>Terms of Service</a>{' '}
                    and{' '}
                    <a href="#" style={{ color: 'var(--primary)', fontWeight: 600 }}>Privacy Policy</a>
                </p>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes sway {
                    0%, 100% { transform: rotate(-5deg); }
                    50% { transform: rotate(5deg); }
                }
                
                @keyframes float {
                    0%, 100% { 
                        transform: translateY(100vh) scale(0);
                        opacity: 0;
                    }
                    10% { opacity: 1; transform: scale(1); }
                    90% { opacity: 1; }
                    100% { 
                        transform: translateY(-20vh) scale(0.5);
                        opacity: 0;
                    }
                }
                
                @keyframes patternMove {
                    0% { background-position: 0 0; }
                    100% { background-position: 60px 60px; }
                }
                
                @keyframes shine {
                    0% { transform: translateX(-100%) rotate(45deg); }
                    100% { transform: translateX(100%) rotate(45deg); }
                }
                
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
                }
                
                @keyframes shake {
                    10%, 90% { transform: translateX(-1px); }
                    20%, 80% { transform: translateX(2px); }
                    30%, 50%, 70% { transform: translateX(-4px); }
                    40%, 60% { transform: translateX(4px); }
                }
                
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default Login;
