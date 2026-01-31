import React from 'react';
import { Plus } from 'lucide-react';

type EmptyStateVariant = 'no-data' | 'search' | 'welcome';

interface EmptyStateProps {
    variant?: EmptyStateVariant;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

const imageMap: Record<EmptyStateVariant, string> = {
    'no-data': '/empty-no-data.png',
    'search': '/empty-search.png',
    'welcome': '/empty-welcome.png'
};

/**
 * EmptyState Component
 * 
 * Usage:
 * ```tsx
 * <EmptyState
 *   variant="no-data"
 *   title="No records yet"
 *   description="Start by adding your first job record."
 *   actionLabel="Add Record"
 *   onAction={() => setShowModal(true)}
 * />
 * ```
 */
const EmptyState: React.FC<EmptyStateProps> = ({
    variant = 'no-data',
    title,
    description,
    actionLabel,
    onAction,
    className = ''
}) => {
    return (
        <div
            className={`animate-fade-in ${className}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-8) var(--space-4)',
                textAlign: 'center',
                minHeight: '300px'
            }}
        >
            {/* Illustration */}
            <div style={{
                width: '160px',
                height: '160px',
                marginBottom: 'var(--space-6)',
                animation: 'fadeIn 0.5s ease-out'
            }}>
                <img
                    src={imageMap[variant]}
                    alt=""
                    aria-hidden="true"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                    }}
                />
            </div>

            {/* Title */}
            <h3 style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 600,
                color: 'var(--text-main)',
                marginBottom: 'var(--space-2)',
                lineHeight: 'var(--leading-tight)'
            }}>
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-secondary)',
                    maxWidth: '280px',
                    marginBottom: actionLabel ? 'var(--space-6)' : 0,
                    lineHeight: 'var(--leading-relaxed)'
                }}>
                    {description}
                </p>
            )}

            {/* Action Button */}
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="btn btn-primary"
                    style={{
                        gap: '0.5rem'
                    }}
                >
                    <Plus size={18} aria-hidden="true" />
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
