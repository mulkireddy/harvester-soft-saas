
import React, { type ReactNode } from 'react';
import { LayoutDashboard, Users, Receipt, Settings, BarChart2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import '../mobile.css'; // Ensure mobile styles are imported

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
        <div className="layout-container">
            {/* Desktop Sidebar */}
            <aside className="desktop-sidebar">
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
                                className={`nav-item ${isActive ? 'active' : ''}`}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Mobile Top Bar */}
            <header className="mobile-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--primary)', borderRadius: '6px' }}></div>
                    <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>HarvesterOS</h1>
                </div>
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
        </div>
    );
};

export default Layout;
