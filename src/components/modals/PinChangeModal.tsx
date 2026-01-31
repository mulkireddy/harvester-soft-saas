import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';

const PinChangeModal: React.FC<{
    onClose: () => void;
    onSave: (oldPin: string, newPin: string) => void;
}> = ({ onClose, onSave }) => {
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');

    const handleSave = () => {
        if (newPin !== confirmPin) {
            setError('New PINs do not match');
            return;
        }
        if (newPin.length < 4) {
            setError('PIN must be at least 4 digits');
            return;
        }
        onSave(currentPin, newPin);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div className="animate-scale-in" style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '400px',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-main)' }}>
                        Change PIN
                    </h3>
                    <button onClick={onClose} style={{
                        padding: '0.5rem',
                        background: 'var(--bg-subtle)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        display: 'flex'
                    }}>
                        <X size={18} style={{ color: 'var(--text-muted)' }} />
                    </button>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 500,
                            color: 'var(--text-muted)',
                            marginBottom: '0.375rem'
                        }}>
                            Current PIN
                        </label>
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={6}
                            value={currentPin}
                            onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                fontSize: 'var(--text-lg)',
                                fontWeight: 700,
                                letterSpacing: '0.5rem',
                                textAlign: 'center',
                                border: '1px solid var(--border-light)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-subtle)',
                                color: 'var(--text-main)'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 500,
                            color: 'var(--text-muted)',
                            marginBottom: '0.375rem'
                        }}>
                            New PIN
                        </label>
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={6}
                            value={newPin}
                            onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                fontSize: 'var(--text-lg)',
                                fontWeight: 700,
                                letterSpacing: '0.5rem',
                                textAlign: 'center',
                                border: '1px solid var(--border-light)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-subtle)',
                                color: 'var(--text-main)'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 500,
                            color: 'var(--text-muted)',
                            marginBottom: '0.375rem'
                        }}>
                            Confirm New PIN
                        </label>
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={6}
                            value={confirmPin}
                            onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                fontSize: 'var(--text-lg)',
                                fontWeight: 700,
                                letterSpacing: '0.5rem',
                                textAlign: 'center',
                                border: '1px solid var(--border-light)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-subtle)',
                                color: 'var(--text-main)'
                            }}
                        />
                    </div>
                </div>

                {error && (
                    <div style={{
                        padding: '0.75rem',
                        background: 'var(--error-light)',
                        color: 'var(--error)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 500,
                        marginBottom: '1rem'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            fontSize: 'var(--text-sm)',
                            fontWeight: 600,
                            background: 'var(--bg-subtle)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!currentPin || !newPin || !confirmPin}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            fontSize: 'var(--text-sm)',
                            fontWeight: 600,
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Lock size={16} />
                        Update PIN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PinChangeModal;
