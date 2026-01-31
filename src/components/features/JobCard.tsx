import React, { useState, useRef, useEffect } from 'react';
import { Share2, Edit, Phone, FileText, Trash2, MapPin, Wheat, MoreVertical, X, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { playClickHaptic } from '../../lib/ui-utils';

interface JobCardProps {
    job: any;
    onShare: (job: any) => void;
    onEdit: (job: any) => void;
    onDelete: (jobId: string) => void;
    onPay: (job: any) => void;
    onCall: (mobile: string) => void;
    onReceipt: (job: any) => void;
}

// Helper: Get initials from name
const getInitials = (name: string): string => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

// Helper: Format date nicely
const formatDateRelative = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short'
        });
    }
};

// Overflow Menu Component
const OverflowMenu: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
    onReceipt: () => void;
    onCall: () => void;
    onDelete: () => void;
}> = ({ isOpen, onClose, onEdit, onReceipt, onCall, onDelete }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const menuItems = [
        { label: 'Edit Record', icon: Edit, onClick: onEdit, color: 'var(--info)', ariaLabel: 'Edit this job record' },
        { label: 'View Receipt', icon: FileText, onClick: onReceipt, color: 'var(--secondary)', ariaLabel: 'View or download receipt' },
        { label: 'Call Farmer', icon: Phone, onClick: onCall, color: 'var(--primary)', ariaLabel: 'Call the farmer' },
        { label: 'Delete', icon: Trash2, onClick: onDelete, color: 'var(--error)', danger: true, ariaLabel: 'Delete this job record' }
    ];

    return (
        <div
            ref={menuRef}
            style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 10px 40px -5px rgba(0,0,0,0.2)',
                border: '1px solid var(--border-light)',
                minWidth: '160px',
                zIndex: 50,
                overflow: 'hidden',
                animation: 'scaleIn 0.15s ease-out'
            }}
        >
            {menuItems.map((item, index) => (
                <button
                    key={index}
                    onClick={() => { playClickHaptic(); item.onClick(); onClose(); }}
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: index < menuItems.length - 1 ? '1px solid var(--border-light)' : 'none',
                        cursor: 'pointer',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 500,
                        color: item.danger ? 'var(--error)' : 'var(--text-main)',
                        textAlign: 'left',
                        transition: 'background 0.15s'
                    }}
                >
                    <item.icon size={16} style={{ color: item.color, flexShrink: 0 }} />
                    {item.label}
                </button>
            ))}
        </div>
    );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const config = {
        Paid: {
            bg: 'linear-gradient(135deg, #10B981, #059669)',
            color: 'white',
            icon: CheckCircle,
            label: 'Paid'
        },
        Partial: {
            bg: 'linear-gradient(135deg, #F59E0B, #D97706)',
            color: 'white',
            icon: Clock,
            label: 'Partial'
        },
        Pending: {
            bg: 'linear-gradient(135deg, #EF4444, #DC2626)',
            color: 'white',
            icon: AlertCircle,
            label: 'Due'
        }
    }[status] || { bg: '#9CA3AF', color: 'white', icon: AlertCircle, label: status };

    const Icon = config.icon;

    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem 0.5rem',
            borderRadius: 'var(--radius-full)',
            background: config.bg,
            color: config.color,
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
        }}>
            <Icon size={10} />
            {config.label}
        </div>
    );
};

const JobCard: React.FC<JobCardProps> = ({ job, onShare, onEdit, onDelete, onPay, onCall, onReceipt }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const balance = job.total_amount - (job.paid_amount || 0);

    // Avatar colors based on first letter
    const avatarColors: Record<string, { bg: string; text: string }> = {
        A: { bg: '#FEE2E2', text: '#DC2626' },
        B: { bg: '#FEF3C7', text: '#D97706' },
        C: { bg: '#D1FAE5', text: '#059669' },
        D: { bg: '#DBEAFE', text: '#2563EB' },
        E: { bg: '#E0E7FF', text: '#4F46E5' },
        F: { bg: '#FCE7F3', text: '#DB2777' },
        G: { bg: '#CCFBF1', text: '#0D9488' },
        H: { bg: '#FED7AA', text: '#EA580C' },
        default: { bg: '#E5E7EB', text: '#4B5563' }
    };

    const initials = getInitials(job.farmers?.name);
    const firstLetter = initials[0];
    const avatarStyle = avatarColors[firstLetter] || avatarColors.default;

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border-light)',
            transition: 'all var(--transition-fast)',
            position: 'relative'
        }}>
            {/* Top Row: Avatar, Name, Amount */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                {/* Farmer Avatar with Initials */}
                <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-lg)',
                    background: avatarStyle.bg,
                    color: avatarStyle.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 'var(--text-sm)',
                    flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                }}>
                    {initials}
                </div>

                {/* Name & Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        marginBottom: '0.25rem'
                    }}>
                        <h4 style={{
                            fontSize: 'var(--text-base)',
                            fontWeight: 600,
                            color: 'var(--text-main)',
                            margin: 0,
                            letterSpacing: '-0.01em',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {job.farmers?.name}
                        </h4>
                        <StatusBadge status={job.status} />
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625rem',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)',
                        flexWrap: 'wrap'
                    }}>
                        {job.farmers?.place && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <MapPin size={11} />
                                {job.farmers.place}
                            </span>
                        )}
                        {job.crop && (
                            <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                background: 'var(--warning-light)',
                                color: 'var(--warning)',
                                padding: '0.125rem 0.375rem',
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: 500
                            }}>
                                <Wheat size={10} />
                                {job.crop}
                            </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={11} />
                            {formatDateRelative(job.date)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Work Details Row */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '0.625rem 0.875rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div>
                        <div style={{
                            fontSize: '0.65rem',
                            color: 'var(--text-muted)',
                            marginBottom: '0.125rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em'
                        }}>
                            {job.billing_mode === 'acre' ? 'Acres' : 'Hours'}
                        </div>
                        <div style={{
                            fontSize: 'var(--text-base)',
                            fontWeight: 700,
                            color: 'var(--text-main)'
                        }}>
                            {job.quantity}
                        </div>
                    </div>
                    <div style={{
                        width: '1px',
                        height: '28px',
                        background: 'var(--border-light)'
                    }} />
                    <div>
                        <div style={{
                            fontSize: '0.65rem',
                            color: 'var(--text-muted)',
                            marginBottom: '0.125rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em'
                        }}>
                            Rate
                        </div>
                        <div style={{
                            fontSize: 'var(--text-base)',
                            fontWeight: 700,
                            color: 'var(--text-main)'
                        }}>
                            ₹{job.rate}
                        </div>
                    </div>
                    <div style={{
                        width: '1px',
                        height: '28px',
                        background: 'var(--border-light)'
                    }} />
                    <div>
                        <div style={{
                            fontSize: '0.65rem',
                            color: 'var(--text-muted)',
                            marginBottom: '0.125rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em'
                        }}>
                            Total
                        </div>
                        <div style={{
                            fontSize: 'var(--text-base)',
                            fontWeight: 700,
                            color: 'var(--primary)'
                        }}>
                            ₹{job.total_amount.toLocaleString('en-IN')}
                        </div>
                    </div>
                </div>

                {balance > 0 && (
                    <div style={{
                        background: 'var(--error-light)',
                        padding: '0.375rem 0.625rem',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'right'
                    }}>
                        <div style={{
                            fontSize: '0.6rem',
                            color: 'var(--error)',
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em'
                        }}>
                            Balance
                        </div>
                        <div style={{
                            fontSize: 'var(--text-sm)',
                            fontWeight: 700,
                            color: 'var(--error)'
                        }}>
                            ₹{balance.toLocaleString('en-IN')}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Row: Primary Actions (2-3 icons) + Overflow Menu */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                {/* Primary Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {/* Pay Button (Primary) */}
                    {job.status !== 'Paid' && (
                        <button
                            onClick={() => { playClickHaptic(); onPay(job); }}
                            aria-label={`Record payment for ${job.farmers?.name || 'farmer'}`}
                            className="btn-press"
                            style={{
                                padding: '0.5rem 1rem',
                                fontSize: 'var(--text-xs)',
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, var(--primary), #059669)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                transition: 'all var(--transition-fast)',
                                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                                minHeight: '44px'
                            }}
                        >
                            <CheckCircle size={14} aria-hidden="true" />
                            Record Payment
                        </button>
                    )}

                    {/* Share on WhatsApp (Visible) */}
                    <button
                        onClick={() => { playClickHaptic(); onShare(job); }}
                        aria-label="Share job details on WhatsApp"
                        className="icon-btn-enhanced"
                        style={{
                            padding: '0.5rem',
                            width: '44px',
                            height: '44px',
                            background: '#E7F9EF',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            color: '#25D366',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all var(--transition-fast)'
                        }}
                        title="Share on WhatsApp"
                    >
                        <Share2 size={18} aria-hidden="true" />
                    </button>
                </div>

                {/* Overflow Menu Button */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => { playClickHaptic(); setMenuOpen(!menuOpen); }}
                        aria-label={menuOpen ? 'Close actions menu' : 'Open more actions'}
                        aria-expanded={menuOpen}
                        aria-haspopup="menu"
                        className="icon-btn-enhanced"
                        style={{
                            padding: '0.5rem',
                            width: '44px',
                            height: '44px',
                            background: menuOpen ? 'var(--bg-subtle)' : 'transparent',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all var(--transition-fast)'
                        }}
                    >
                        {menuOpen ? <X size={18} aria-hidden="true" /> : <MoreVertical size={18} aria-hidden="true" />}
                    </button>

                    <OverflowMenu
                        isOpen={menuOpen}
                        onClose={() => setMenuOpen(false)}
                        onEdit={() => onEdit(job)}
                        onReceipt={() => onReceipt(job)}
                        onCall={() => onCall(job.farmers?.mobile)}
                        onDelete={() => onDelete(job.id)}
                    />
                </div>
            </div>
        </div>
    );
};

export default JobCard;
