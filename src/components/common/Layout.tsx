import React, { type ReactNode, useState, useEffect } from 'react';
import { LayoutDashboard, Users, Receipt, Settings, BarChart2, Bell, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import SyncStatus from './SyncStatus';
import NotificationBadge from './NotificationBadge';
import { Toaster } from 'react-hot-toast';
import { playClickHaptic } from '../../lib/ui-utils';

import ProfileModal from '../modals/ProfileModal';

interface LayoutProps {
    children: ReactNode;
}

// Get user initials from email or name
const getUserInitials = (email?: string, name?: string): string => {
    if (name) {
        const words = name.trim().split(' ');
        if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    if (email) {
        return email.substring(0, 2).toUpperCase();
    }
    return 'U';
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    const [userInitials, setUserInitials] = useState('');
    const [notificationCount] = useState(0); // For future notifications
    const [showProfileModal, setShowProfileModal] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const initials = getUserInitials(user.email, user.user_metadata?.name);
                setUserInitials(initials);
            }
        };
        fetchUser();
    }, []);

    const navItems = [
        { icon: LayoutDashboard, label: 'Home', path: '/' },
        { icon: BarChart2, label: 'Reports', path: '/reports' },
        { icon: Users, label: 'Farmers', path: '/farmers' },
        { icon: Receipt, label: 'Expenses', path: '/expenses' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    const handleLogout = async () => {
        playClickHaptic();
        if (confirm('Are you sure you want to logout?')) {
            await supabase.auth.signOut();
            window.location.reload();
        }
    };

    return (
        <div className="layout-container">
            {/* Skip to main content link for accessibility */}
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>

            {/* Enhanced Mobile Top Bar - Clean White with Shadow */}
            <header className="mobile-header" role="banner" style={{
                justifyContent: 'space-between',
                background: 'var(--bg-card)',
                borderBottom: 'none',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                padding: '0.75rem 1rem'
            }}>
                {/* Left: Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #059669 100%)',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'
                    }}>
                        <img
                            src="/logo.png"
                            alt="HarvesterOS"
                            style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                            onError={(e) => {
                                // Fallback if logo doesn't exist
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                    <h1 style={{
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        letterSpacing: '-0.02em'
                    }}>
                        HarvesterOS
                    </h1>
                </div>

                {/* Right: Notification Bell + User Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Notification Bell */}
                    <NotificationBadge
                        count={notificationCount}
                        showDot={notificationCount > 0}
                        pulse={notificationCount > 0}
                    >
                        <button
                            aria-label={notificationCount > 0 ? `${notificationCount} notifications` : 'Notifications'}
                            className="icon-btn-enhanced"
                            style={{
                                width: '44px',
                                height: '44px',
                                background: 'var(--bg-subtle)',
                                border: 'none',
                                borderRadius: 'var(--radius-lg)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all var(--transition-fast)'
                            }}
                            onClick={() => playClickHaptic()}
                        >
                            <Bell size={20} aria-hidden="true" />
                        </button>
                    </NotificationBadge>

                    {/* User Avatar with Initials */}
                    <button
                        onClick={() => { playClickHaptic(); setShowProfileModal(true); }}
                        aria-label="User menu"
                        className="icon-btn-enhanced"
                        style={{
                            width: '44px',
                            height: '44px',
                            background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                            border: 'none',
                            borderRadius: 'var(--radius-lg)',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 700,
                            transition: 'all var(--transition-fast)',
                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.25)'
                        }}
                    >
                        {userInitials || <User size={18} aria-hidden="true" />}
                    </button>
                </div>
            </header>

            {/* Profile Modal */}
            {showProfileModal && (
                <ProfileModal
                    onClose={() => setShowProfileModal(false)}
                    onLogout={handleLogout}
                />
            )}

            {/* Main Content Area */}
            <main id="main-content" className="main-content page-enter" role="main">
                {children}
            </main>

            {/* Enhanced Mobile Bottom Navigation with Labels */}
            <nav className="mobile-bottom-nav" role="navigation" aria-label="Main navigation" style={{
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderTop: '1px solid var(--border-light)',
                boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.03)',
                paddingBottom: 'env(safe-area-inset-bottom, 0)',
                height: 'auto',
                minHeight: '64px'
            }}>
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => playClickHaptic()}
                            aria-label={`Navigate to ${item.label}`}
                            aria-current={isActive ? 'page' : undefined}
                            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.25rem',
                                padding: '0.625rem 0',
                                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                                textDecoration: 'none',
                                transition: 'all 0.2s ease',
                                position: 'relative',
                                flex: 1,
                                minWidth: 0,
                                minHeight: '56px'
                            }}
                        >
                            {/* Active indicator pill */}
                            {isActive && (
                                <div style={{
                                    position: 'absolute',
                                    top: '0',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '32px',
                                    height: '3px',
                                    background: 'linear-gradient(90deg, var(--primary), #059669)',
                                    borderRadius: '0 0 4px 4px'
                                }} />
                            )}

                            {/* Icon with background on active */}
                            <div style={{
                                width: '36px',
                                height: '28px',
                                borderRadius: 'var(--radius-md)',
                                background: isActive ? 'var(--primary-light)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                            }}>
                                <item.icon
                                    size={20}
                                    strokeWidth={isActive ? 2.5 : 1.8}
                                />
                            </div>

                            {/* Label - always visible */}
                            <span style={{
                                fontSize: '0.65rem',
                                fontWeight: isActive ? 700 : 500,
                                letterSpacing: '0.01em',
                                lineHeight: 1
                            }}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            <SyncStatus />
            <Toaster
                position="top-center"
                reverseOrder={false}
                toastOptions={{
                    style: {
                        background: 'var(--text-main)',
                        color: 'white',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 500,
                        padding: '0.75rem 1rem',
                        boxShadow: 'var(--shadow-lg)'
                    },
                    success: {
                        iconTheme: {
                            primary: 'var(--success)',
                            secondary: 'white'
                        }
                    },
                    error: {
                        iconTheme: {
                            primary: 'var(--error)',
                            secondary: 'white'
                        }
                    }
                }}
            />
        </div>
    );
};

export default Layout;
