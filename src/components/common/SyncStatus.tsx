
import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

const SyncStatus: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) {
        return null; // Don't show anything when connection is perfect
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '5rem', // Just above mobile nav
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--text-main)',
            color: 'var(--bg-card)',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            opacity: 0.95,
            border: '1px solid var(--border-light)'
        }}>
            <WifiOff size={14} className="text-error" style={{ color: 'var(--error)' }} />
            <span>Offline Mode</span>
        </div>
    );
};

export default SyncStatus;
