import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Delete, LogOut, Lock, Shield } from 'lucide-react';

interface PinLockProps {
    onUnlock: () => void;
}

const PinLock: React.FC<PinLockProps> = ({ onUnlock }) => {
    const [pin, setPin] = useState('');
    const [mode, setMode] = useState<'create' | 'verify' | 'loading'>('loading');
    const [storedPin, setStoredPin] = useState<string | null>(null);
    const [confirmPin, setConfirmPin] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);

    useEffect(() => {
        const checkPin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.user_metadata?.pin) {
                setStoredPin(user.user_metadata.pin);
                setMode('verify');
            } else {
                setMode('create');
            }
        };
        checkPin();
    }, []);

    const handleNumberClick = (num: number) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
            setError('');
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError('');
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    };

    const handleEnter = async () => {
        if (pin.length !== 4) return;

        if (mode === 'create') {
            if (!confirmPin) {
                setConfirmPin(pin);
                setPin('');
            } else {
                if (pin === confirmPin) {
                    setMode('loading');
                    const { error } = await supabase.auth.updateUser({
                        data: { pin: pin }
                    });
                    if (error) {
                        setError(error.message);
                        setMode('create');
                        setConfirmPin(null);
                        setPin('');
                    } else {
                        onUnlock();
                    }
                } else {
                    setError('PINs do not match. Try again.');
                    setPin('');
                    setConfirmPin(null);
                    triggerShake();
                }
            }
        } else if (mode === 'verify') {
            if (pin === storedPin) {
                onUnlock();
            } else {
                setError('Incorrect PIN');
                setPin('');
                triggerShake();
            }
        }
    };

    useEffect(() => {
        if (pin.length === 4) {
            handleEnter();
        }
    }, [pin]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (mode === 'loading') return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'linear-gradient(135deg, #059669 0%, #1E40AF 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            padding: '2rem'
        }}>
            {/* Background Pattern */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                opacity: 0.3
            }} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                {/* Icon */}
                <div style={{
                    marginBottom: '2rem',
                    background: 'rgba(255,255,255,0.15)',
                    padding: '1.25rem',
                    borderRadius: '50%',
                    backdropFilter: 'blur(10px)',
                    display: 'inline-flex'
                }}>
                    {mode === 'create' ? <Shield size={36} /> : <Lock size={36} />}
                </div>

                {/* Title */}
                <h2 style={{
                    fontSize: '1.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: 700,
                    letterSpacing: '-0.02em'
                }}>
                    {mode === 'create'
                        ? (confirmPin ? 'Confirm your PIN' : 'Create 4-Digit PIN')
                        : 'Welcome Back'}
                </h2>
                <p style={{
                    opacity: 0.8,
                    marginBottom: '2.5rem',
                    minHeight: '1.5rem',
                    fontSize: '0.95rem'
                }}>
                    {error ? (
                        <span style={{ color: '#FCA5A5', fontWeight: 500 }}>{error}</span>
                    ) : (
                        mode === 'create' ? 'Secure your account' : 'Enter your PIN to continue'
                    )}
                </p>

                {/* PIN Dots */}
                <div style={{
                    display: 'flex',
                    gap: '1.25rem',
                    marginBottom: '3rem',
                    justifyContent: 'center',
                    animation: shake ? 'shake 0.5s ease-in-out' : undefined
                }}>
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: i < pin.length ? 'white' : 'rgba(255,255,255,0.25)',
                            border: i < pin.length ? 'none' : '2px solid rgba(255,255,255,0.3)',
                            transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            transform: i < pin.length ? 'scale(1.1)' : 'scale(1)'
                        }} />
                    ))}
                </div>

                {/* Numpad */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1rem',
                    marginBottom: '2rem',
                    maxWidth: '280px',
                    margin: '0 auto 2rem'
                }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num)}
                            style={{
                                width: '72px',
                                height: '72px',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.12)',
                                backdropFilter: 'blur(4px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white',
                                fontSize: '1.75rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                            }}
                            onMouseDown={(e) => {
                                (e.target as HTMLButtonElement).style.transform = 'scale(0.95)';
                                (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)';
                            }}
                            onMouseUp={(e) => {
                                (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                                (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
                            }}
                            onMouseLeave={(e) => {
                                (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                                (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
                            }}
                        >
                            {num}
                        </button>
                    ))}

                    {/* Bottom Row */}
                    <button
                        onClick={mode === 'verify' ? handleLogout : () => { setPin(''); setConfirmPin(null); }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            opacity: 0.7,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {mode === 'verify' ? 'Forgot?' : 'Reset'}
                    </button>

                    <button
                        onClick={() => handleNumberClick(0)}
                        style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.12)',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            fontSize: '1.75rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        0
                    </button>

                    <button
                        onClick={handleDelete}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            opacity: 0.8
                        }}
                    >
                        <Delete size={28} />
                    </button>
                </div>

                {/* Logout link */}
                {mode === 'verify' && (
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: 0.7,
                            color: 'white',
                            background: 'none',
                            border: 'none',
                            margin: '0 auto',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        <LogOut size={16} /> Use different account
                    </button>
                )}
            </div>

            {/* Shake animation */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
                    20%, 40%, 60%, 80% { transform: translateX(6px); }
                }
            `}</style>
        </div>
    );
};

export default PinLock;

