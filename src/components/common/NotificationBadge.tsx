import React, { useEffect, useState } from 'react';

interface NotificationBadgeProps {
    count?: number;
    showDot?: boolean;
    pulse?: boolean;
    variant?: 'error' | 'success' | 'warning';
    position?: 'top-right' | 'top-left' | 'bottom-right';
    children: React.ReactNode;
}

/**
 * NotificationBadge Component - Wraps any element with a notification indicator
 * 
 * Usage:
 * ```tsx
 * <NotificationBadge count={5}>
 *   <Bell size={20} />
 * </NotificationBadge>
 * 
 * <NotificationBadge showDot pulse variant="success">
 *   <User size={20} />
 * </NotificationBadge>
 * ```
 */
const NotificationBadge: React.FC<NotificationBadgeProps> = ({
    count,
    showDot = false,
    pulse = false,
    variant = 'error',
    position = 'top-right',
    children
}) => {
    const [animate, setAnimate] = useState(false);

    // Animate on count change
    useEffect(() => {
        if (count !== undefined && count > 0) {
            setAnimate(true);
            const timer = setTimeout(() => setAnimate(false), 600);
            return () => clearTimeout(timer);
        }
    }, [count]);

    const showBadge = (count !== undefined && count > 0) || showDot;

    // Format count for display (99+ for large numbers)
    const displayCount = count !== undefined && count > 99 ? '99+' : count;

    return (
        <div className="badge-container">
            {children}

            {showBadge && !showDot && count !== undefined && (
                <span
                    className={`notification-badge ${position} ${animate ? 'animate' : ''}`}
                    aria-label={`${count} notifications`}
                >
                    {displayCount}
                </span>
            )}

            {showDot && (
                <span
                    className={`notification-dot ${variant} ${position} ${pulse ? 'pulse' : ''}`}
                    aria-hidden="true"
                />
            )}
        </div>
    );
};

export default NotificationBadge;
