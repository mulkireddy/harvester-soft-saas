
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
            bottom: '4.5rem', // Just above mobile nav or bottom
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1F2937',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 999
        }}>
            <WifiOff size={14} color="#F87171" />
            <span>Offline Mode</span>
        </div>
    );
};

export default SyncStatus;
