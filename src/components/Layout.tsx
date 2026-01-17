
import React, { type ReactNode } from 'react';
import { LayoutDashboard, Users, Receipt, Settings, BarChart2, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import '../mobile.css'; // Ensure mobile styles are imported
import SyncStatus from './SyncStatus';
import { Toaster } from 'react-hot-toast';

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: BarChart2, label: 'Reports', path: '/reports' },
        { icon: Users, label: 'Farmers', path: '/farmers' },
        { icon: Receipt, label: 'Expenses', path: '/expenses' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    const handleLogout = async () => {
        if (confirm('Are you sure you want to logout?')) {
            await supabase.auth.signOut();
            window.location.reload();
        }
    };

    return (
        <div className="layout-container">
            {/* Desktop Sidebar */}
            <aside className="desktop-sidebar">
                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src="/logo.png" alt="HarvesterOS" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>HarvesterOS</h1>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <button
                    onClick={handleLogout}
                    className="nav-item"
                    style={{ marginTop: 'auto', color: '#EF4444', border: '1px solid #FECACA', background: '#FEF2F2' }}
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </aside>

            {/* Mobile Top Bar */}
            <header className="mobile-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img src="/logo.png" alt="HarvesterOS" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                    <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>HarvesterOS</h1>
                </div>
                <button
                    onClick={handleLogout}
                    style={{ padding: '0.5rem', color: '#EF4444', background: '#FEF2F2', borderRadius: '8px', border: 'none' }}
                >
                    <LogOut size={20} />
                </button>
            </header>

            {/* Main Content Area */}
            <main className="main-content">
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="mobile-bottom-nav">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span style={{ fontSize: '0.7rem', fontWeight: isActive ? 600 : 500 }}>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <SyncStatus />
            <Toaster position="top-center" reverseOrder={false} />
        </div>
    );
};

export default Layout;
