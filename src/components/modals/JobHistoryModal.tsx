import React, { useState, useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import JobCard from '../features/JobCard';

interface JobHistoryModalProps {
    onClose: () => void;
    onShare: (job: any) => void;
    onEdit: (job: any) => void;
    onDelete: (jobId: string) => void;
    onPay: (job: any) => void;
    onCall: (mobile: string) => void;
    onReceipt: (job: any) => void;
}

const JobHistoryModal: React.FC<JobHistoryModalProps> = ({ onClose, onShare, onEdit, onDelete, onPay, onCall, onReceipt }) => {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showPendingOnly, setShowPendingOnly] = useState(false);

    useEffect(() => {
        fetchJobs();
    }, [searchQuery]); // Re-fetch when search changes (debounce would be better in prod, but simple for now)

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const query = supabase
                .from('jobs')
                .select(`
                    *,
                    farmers!inner (name, place, mobile),
                    machines (name),
                    payments (*)
                `)
                .order('date', { ascending: false });

            const { data, error } = await query;
            if (error) throw error;

            let result = data || [];

            // Client-side filtering for reliable search across joined tables
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                result = result.filter((job: any) =>
                    job.farmers?.name?.toLowerCase().includes(q) ||
                    job.farmers?.place?.toLowerCase().includes(q) ||
                    job.farmers?.mobile?.toLowerCase().includes(q) ||
                    job.crop?.toLowerCase().includes(q)
                );
            }

            setJobs(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Wrapper for delete to remove from local list instantly
    const handleDeleteLocal = (jobId: string) => {
        onDelete(jobId);
        setJobs(prev => prev.filter(j => j.id !== jobId));
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'var(--bg-main)', // Full screen opaque
            zIndex: 999,
            display: 'flex', flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--border-light)',
                background: 'white',
                display: 'flex', alignItems: 'center', gap: '1rem',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <button onClick={onClose} style={{ padding: '0.5rem', borderRadius: '50%', background: '#F3F4F6' }}>
                    <X size={24} color="var(--text-main)" />
                </button>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>All Records</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>View and search all work history</p>
                </div>
            </div>

            {/* Search Bar */}
            <div style={{ padding: '1rem 1.5rem', background: 'white' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                    <input
                        className="input"
                        placeholder="Search by Name, Village, Mobile, or Crop..."
                        style={{ paddingLeft: '2.5rem', width: '100%' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            {/* Pending Filter Toggle */}
            <div style={{ padding: '0 1.5rem 1rem 1.5rem', background: 'white', borderBottom: '1px solid var(--border-light)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                    <input
                        type="checkbox"
                        checked={showPendingOnly}
                        onChange={(e) => setShowPendingOnly(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                    />
                    Show Pending Dues Only
                </label>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        <Loader2 className="animate-spin" style={{ margin: '0 auto 1rem' }} />
                        Loading...
                    </div>
                ) : jobs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        No records found.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem', paddingBottom: '2rem' }}>
                        {jobs
                            .filter(job => !showPendingOnly || job.status !== 'Paid')
                            .map(job => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    onShare={onShare}
                                    onEdit={onEdit}
                                    onDelete={handleDeleteLocal}
                                    onPay={onPay}
                                    onCall={onCall}
                                    onReceipt={onReceipt}
                                />
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobHistoryModal;
