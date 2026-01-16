
import React from 'react';
import { Share2, Edit, Phone, FileText, Trash2 } from 'lucide-react';
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
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Top Row: Name and Amount */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
                        {job.farmers?.name}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span>{job.farmers?.place || 'Unknown'}</span>
                        <span>•</span>
                        <span>{job.crop}</span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
                        ₹{job.total_amount.toLocaleString()}
                    </div>
                    <div style={{
                        fontSize: '0.7rem', fontWeight: 600,
                        color: job.status === 'Paid' ? '#166534' : (job.status === 'Partial' ? '#D97706' : '#DC2626'),
                        background: job.status === 'Paid' ? '#DCFCE7' : (job.status === 'Partial' ? '#FEF3C7' : '#FEE2E2'),
                        padding: '1px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '2px'
                    }}>
                        {job.status.toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Bottom Row: Date and Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-light)' }}>
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                    {new Date(job.date).toLocaleDateString()}
                </span>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {job.status !== 'Paid' && (
                        <button
                            onClick={() => onPay(job)}
                            style={{
                                padding: '0.3rem 0.75rem', fontSize: '0.75rem', fontWeight: 600,
                                background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px',
                                display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                        >
                            Pay
                        </button>
                    )}

                    <button className="icon-btn" onClick={() => onCall(job.farmers?.mobile)} style={{ padding: '0.3rem', width: '28px', height: '28px' }}>
                        <Phone size={14} />
                    </button>
                    <button className="icon-btn" onClick={() => onReceipt(job)} style={{ padding: '0.3rem', width: '28px', height: '28px', color: '#4F46E5', background: '#EEF2FF' }}>
                        <FileText size={14} />
                    </button>
                    <button className="icon-btn" onClick={() => onShare(job)} style={{ padding: '0.3rem', width: '28px', height: '28px', color: '#25D366', background: '#F0FDF4' }}>
                        <Share2 size={14} />
                    </button>
                    <button className="icon-btn" onClick={() => onEdit(job)} style={{ padding: '0.3rem', width: '28px', height: '28px', color: '#3B82F6', background: '#EFF6FF' }}>
                        <Edit size={14} />
                    </button>
                    <button className="icon-btn" onClick={() => onDelete(job.id)} style={{ padding: '0.3rem', width: '28px', height: '28px', color: '#EF4444', background: '#FEF2F2' }}>
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JobCard;

