import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Phone, LogOut, X, Lock, ChevronRight } from 'lucide-react';
import { playClickHaptic, playSuccessHaptic } from '../../lib/ui-utils';
import toast from 'react-hot-toast';
import PinChangeModal from './PinChangeModal';

interface ProfileModalProps {
    onClose: () => void;
    onLogout: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose, onLogout }) => {
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showPinModal, setShowPinModal] = useState(false);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Try fetching from users table first
                const { data } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setUserProfile(data);
                } else {
                    // Fallback to metadata
                    setUserProfile({
                        name: user.user_metadata?.name || 'User',
                        phone: user.phone || user.user_metadata?.mobile || '',
                        id: user.id
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePin = async (oldPin: string, newPin: string) => {
        playClickHaptic();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Verify old PIN if strictly needed, or trust the auth logic
            const { data: userData } = await supabase
                .from('users')
                .select('pin')
                .eq('id', user.id)
                .single();

            if (userData?.pin !== oldPin) {
                toast.error('Current PIN is incorrect');
                return;
            }

            const { error } = await supabase
                .from('users')
                .update({ pin: newPin })
                .eq('id', user.id);

            if (error) throw error;
            playSuccessHaptic();
            toast.success('PIN updated successfully!');
            setShowPinModal(false);
        } catch (error: any) {
            console.error('Error updating PIN:', error);
            toast.error('Failed to update PIN');
        }
    };

    return (
        <>
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-end',
                zIndex: 900,
                padding: '1rem',
                paddingTop: '4rem' // Below header
            }} onClick={onClose}>
                <div
                    className="animate-scale-in"
                    onClick={e => e.stopPropagation()}
                    style={{
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-xl)',
                        padding: '1.25rem',
                        width: '100%',
                        maxWidth: '320px',
                        boxShadow: 'var(--shadow-xl)',
                        border: '1px solid var(--border-light)',
                        marginRight: '0.5rem' // Margin from right edge
                    }}
                >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-main)' }}>
                            Profile
                        </h3>
                        <button onClick={onClose} style={{
                            padding: '0.5rem',
                            background: 'var(--bg-subtle)',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            display: 'flex',
                            color: 'var(--text-muted)'
                        }}>
                            <X size={18} />
                        </button>
                    </div>

                    {/* Profile Card */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.75rem',
                        marginBottom: '1.5rem',
                        background: 'linear-gradient(135deg, var(--bg-subtle), var(--bg-card))',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-light)'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--radius-full)',
                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '1.25rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}>
                            {userProfile?.name?.charAt(0)?.toUpperCase() || <User size={24} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontSize: 'var(--text-base)',
                                fontWeight: 700,
                                color: 'var(--text-main)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {loading ? 'Loading...' : (userProfile?.name || 'Harvester User')}
                            </div>
                            <div style={{
                                fontSize: 'var(--text-xs)',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                marginTop: '0.125rem'
                            }}>
                                <Phone size={12} />
                                {userProfile?.phone || 'No mobile linked'}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        <button
                            onClick={() => { playClickHaptic(); setShowPinModal(true); }}
                            style={{
                                width: '100%',
                                padding: '0.875rem 1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                background: 'transparent',
                                border: '1px solid var(--border-light)',
                                borderRadius: 'var(--radius-lg)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{
                                padding: '0.4rem',
                                background: 'var(--warning-light)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--warning)'
                            }}>
                                <Lock size={16} />
                            </div>
                            <span style={{ flex: 1, textAlign: 'left', fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>
                                Change PIN
                            </span>
                            <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                        </button>

                        <button
                            onClick={onLogout}
                            style={{
                                width: '100%',
                                padding: '0.875rem 1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                background: 'var(--error-light)',
                                border: '1px solid rgba(239, 68, 68, 0.1)',
                                borderRadius: 'var(--radius-lg)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                marginTop: '0.5rem'
                            }}
                        >
                            <div style={{
                                padding: '0.4rem',
                                background: 'white',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--error)'
                            }}>
                                <LogOut size={16} />
                            </div>
                            <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--error)' }}>
                                Log Out
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Nested PIN Modal */}
            {showPinModal && (
                <PinChangeModal
                    onClose={() => setShowPinModal(false)}
                    onSave={handleUpdatePin}
                />
            )}
        </>
    );
};

export default ProfileModal;
