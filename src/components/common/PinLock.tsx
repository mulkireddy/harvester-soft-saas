import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Delete, LogOut, Lock } from 'lucide-react';

interface PinLockProps {
    onUnlock: () => void;
}

const PinLock: React.FC<PinLockProps> = ({ onUnlock }) => {
    const [pin, setPin] = useState('');
    const [mode, setMode] = useState<'create' | 'verify' | 'loading'>('loading');
    const [storedPin, setStoredPin] = useState<string | null>(null);
    const [confirmPin, setConfirmPin] = useState<string | null>(null); // For creation flow
    const [error, setError] = useState('');

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

    const handleEnter = async () => {
        if (pin.length !== 4) return;

        if (mode === 'create') {
            if (!confirmPin) {
                // First entry done, ask for confirmation
                setConfirmPin(pin);
                setPin('');
            } else {
                // Verification done
                if (pin === confirmPin) {
                    // Save PIN
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
                }
            }
        } else if (mode === 'verify') {
            if (pin === storedPin) {
                onUnlock();
            } else {
                setError('Incorrect PIN');
                setPin('');
                // Vibrate?
                if (navigator.vibrate) navigator.vibrate(200);
            }
        }
    };

    // Auto-submit on 4th digit for better UX
    useEffect(() => {
        if (pin.length === 4) {
            handleEnter();
        }
    }, [pin]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // Reliance on App.tsx to detect session change
    };

    if (mode === 'loading') return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'linear-gradient(135deg, #4F46E5 0%, #1E1B4B 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: 'white'
        }}>
            <div style={{
                marginBottom: '2rem',
                background: 'rgba(255,255,255,0.1)',
                padding: '1.5rem',
                borderRadius: '50%'
            }}>
                <Lock size={32} />
            </div>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                {mode === 'create'
                    ? (confirmPin ? 'Confirm your PIN' : 'Create 4-Digit PIN')
                    : 'Enter Access PIN'}
            </h2>
            <p style={{ opacity: 0.7, marginBottom: '2rem', minHeight: '1.5rem' }}>
                {error ? <span style={{ color: '#FCA5A5' }}>{error}</span> : (mode === 'create' ? 'Secure your account' : 'Welcome back')}
            </p>

            {/* PIN Dots */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
                {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{
                        width: '16px', height: '16px',
                        borderRadius: '50%',
                        background: i < pin.length ? 'white' : 'rgba(255,255,255,0.2)',
                        transition: 'all 0.2s'
                    }}></div>
                ))}
            </div>

            {/* Numpad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                        key={num}
                        onClick={() => handleNumberClick(num)}
                        style={{
                            width: '72px', height: '72px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none', color: 'white', fontSize: '1.75rem', fontWeight: 500,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.2s'
                        }}
                    >
                        {num}
                    </button>
                ))}

                {/* Bottom Row */}
                <button
                    onClick={mode === 'verify' ? handleLogout : () => { setPin(''); setConfirmPin(null); }}
                    style={{ background: 'none', border: 'none', color: 'white', opacity: 0.6, fontSize: '0.9rem' }}
                >
                    {mode === 'verify' ? 'Forgot?' : 'Reset'}
                </button>

                <button
                    onClick={() => handleNumberClick(0)}
                    style={{
                        width: '72px', height: '72px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none', color: 'white', fontSize: '1.75rem', fontWeight: 500
                    }}
                >
                    0
                </button>

                <button
                    onClick={handleDelete}
                    style={{ background: 'none', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Delete size={28} />
                </button>
            </div>

            {mode === 'verify' && (
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8, color: 'white', background: 'none', border: 'none', marginTop: '1rem' }}>
                    <LogOut size={16} /> Login with Reference
                </button>
            )}
        </div>
    );
};

export default PinLock;
