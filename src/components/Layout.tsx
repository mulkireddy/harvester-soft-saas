
import React, { type ReactNode } from 'react';
import { LayoutDashboard, Users, Receipt, Settings, BarChart2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

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

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
            {/* Sidebar - Soft & Clean */}
            <aside style={{
                width: '260px',
                backgroundColor: '#FFFFFF',
                borderRight: '1px solid var(--border-light)',
                padding: '2rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'sticky',
                top: 0,
                height: '100vh'
            }}>
                <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--primary)', borderRadius: '8px' }}></div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>HarvesterOS</h1>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                    backgroundColor: isActive ? '#FFF0F3' : 'transparent', // Soft red bg for active
                                    fontWeight: isActive ? 600 : 400,
                                    transition: 'background-color 0.2s ease, color 0.2s ease'
                                }}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, padding: '2.5rem 3rem' }}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
