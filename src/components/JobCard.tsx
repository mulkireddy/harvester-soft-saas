
import React from 'react';
import { MapPin, Sprout, Share2, Edit, Trash2, Phone, FileText } from 'lucide-react';
import '../mobile.css'; // Ensure mobile styles are available

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
        <div className="card job-card-container">
            <div className="job-info">
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', fontWeight: 600 }}>{job.farmers?.name}</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {job.farmers?.place || 'Unknown'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Sprout size={14} /> {job.crop || 'Crop'}</span>
                    {job.machines?.name && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', opacity: 0.7 }}></div>
                            {job.machines.name}
                        </span>
                    )}
                    <span className="hide-on-mobile">• {new Date(job.date).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '4px', display: 'none' }} className="show-on-mobile">
                    {new Date(job.date).toLocaleDateString()}
                </div>
            </div>

            <div className="job-actions">
                <div style={{ textAlign: 'right', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>₹ {job.total_amount.toLocaleString()}</div>
                    <div style={{ fontSize: '0.85rem', color: job.status === 'Paid' ? '#166534' : '#991B1B', fontWeight: 600 }}>
                        {job.status.toUpperCase()}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {job.status !== 'Paid' && (
                        <button
                            className="btn primary-action-btn"
                            onClick={() => onPay(job)}
                        >
                            Pay
                        </button>
                    )}

                    <button className="icon-btn" onClick={() => onCall(job.farmers?.mobile)} title="Call">
                        <Phone size={18} />
                    </button>

                    <button className="icon-btn" onClick={() => onReceipt(job)} title="Receipt" style={{ color: '#4F46E5', background: '#EEF2FF' }}>
                        <FileText size={18} />
                    </button>

                    <button className="icon-btn" onClick={() => onShare(job)} title="Share" style={{ color: '#25D366', background: '#F0FDF4' }}>
                        <Share2 size={18} />
                    </button>

                    <button className="icon-btn" onClick={() => onEdit(job)} title="Edit" style={{ color: '#3B82F6', background: '#EFF6FF' }}>
                        <Edit size={18} />
                    </button>

                    <button className="icon-btn" onClick={() => onDelete(job.id)} title="Delete" style={{ color: '#EF4444', background: '#FEF2F2' }}>
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JobCard;

