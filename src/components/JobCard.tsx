import React from 'react';
import { MapPin, Sprout, Share2, Edit, Trash2, Phone, FileText } from 'lucide-react';

interface JobCardProps {
    job: any;
    onShare: (job: any) => void;
    onEdit: (job: any) => void;
    onDelete: (jobId: string) => void;
    onPay: (job: any) => void;
    onCall: (mobile: string) => void;
    onReceipt: (job: any) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onShare, onEdit, onDelete, onPay, onCall, onReceipt }) => {
    return (
        <div className="card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{job.farmers?.name}</h4>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {job.farmers?.place || 'Unknown'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Sprout size={14} /> {job.crop || 'Crop'}</span>
                    {job.machines?.name && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', opacity: 0.7 }}></div>
                            {job.machines.name}
                        </span>
                    )}
                    <span>• {new Date(job.date).toLocaleDateString()}</span>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>₹ {job.total_amount.toLocaleString()}</div>
                    <div style={{ fontSize: '0.85rem', color: job.status === 'Paid' ? '#166534' : '#991B1B' }}>
                        {job.status.toUpperCase()}
                        {job.payments && job.payments.length > 0 && typeof job.payments[0] === 'object' && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 400, marginTop: '2px' }}>
                                {/* Simple check to act as "tooltip" or meta info if needed */}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className="btn"
                        onClick={() => onCall(job.farmers?.mobile)}
                        title="Call Farmer"
                        style={{ padding: '0.4rem', color: '#4B5563', background: '#F3F4F6', borderRadius: '8px' }}
                    >
                        <Phone size={16} />
                    </button>

                    <button
                        className="btn"
                        onClick={() => onReceipt(job)}
                        title="Generate Receipt"
                        style={{ padding: '0.4rem', color: '#4F46E5', background: '#EEF2FF', borderRadius: '8px' }}
                    >
                        <FileText size={16} />
                    </button>

                    <button
                        className="btn"
                        onClick={() => onShare(job)}
                        title="Share on WhatsApp"
                        style={{ padding: '0.4rem', color: '#25D366', background: '#F0FDF4', borderRadius: '8px' }}
                    >
                        <Share2 size={16} />
                    </button>

                    <button
                        className="btn"
                        onClick={() => onEdit(job)}
                        title="Edit Record"
                        style={{ padding: '0.4rem', color: '#3B82F6', background: '#EFF6FF', borderRadius: '8px' }}
                    >
                        <Edit size={16} />
                    </button>

                    <button
                        className="btn"
                        onClick={() => onDelete(job.id)}
                        title="Delete Record"
                        style={{ padding: '0.4rem', color: '#EF4444', background: '#FEF2F2', borderRadius: '8px' }}
                    >
                        <Trash2 size={16} />
                    </button>

                    {job.status !== 'Paid' && (
                        <button
                            className="btn"
                            style={{
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.75rem',
                                background: '#FFF0F3',
                                color: 'var(--primary)',
                                borderRadius: '12px'
                            }}
                            onClick={() => onPay(job)}
                        >
                            Record Payment
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobCard;
