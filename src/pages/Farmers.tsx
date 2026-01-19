
import React, { useState, useEffect } from 'react';
import { Users, Loader2, X, Check, Download, Plus } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { supabase } from '../lib/supabase';
import { playSuccessHaptic, playErrorHaptic, playClickHaptic } from '../lib/ui-utils';
import PaymentModal from '../components/modals/PaymentModal';
import EditJobModal from '../components/modals/EditJobModal';
import toast from 'react-hot-toast';

import JobHistoryModal from '../components/modals/JobHistoryModal';
import JobCard from '../components/features/JobCard';
import ReceiptModal from '../components/modals/ReceiptModal';

type BillingMode = 'acre' | 'hour';

const FarmersPage: React.FC = () => {
    // ... (Keep existing state)
    const [billingMode, setBillingMode] = useState<BillingMode>('acre');
    const [measurement, setMeasurement] = useState<number | ''>(''); // Acres or Hours
    const [rate, setRate] = useState<number | ''>('');
    const [total, setTotal] = useState<number>(0);

    // State for Collapsible Form
    const [showForm, setShowForm] = useState(false);

    // Form Fields
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [place, setPlace] = useState('');
    const [crop, setCrop] = useState('');
    const [existingFarmerId, setExistingFarmerId] = useState<string | null>(null);
    const [jobDate, setJobDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today YYYY-MM-DD

    // Loading & Data State
    const [isSaving, setIsSaving] = useState(false);
    const [recentJobs, setRecentJobs] = useState<any[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(true); // New Loading State
    const [selectedJob, setSelectedJob] = useState<any>(null); // For Payment Modal
    const [editJob, setEditJob] = useState<any>(null); // For Edit Modal
    const [showHistory, setShowHistory] = useState(false);
    const [selectedReceiptJob, setSelectedReceiptJob] = useState<any>(null); // For Receipt Modal

    // Machine State
    const [machines, setMachines] = useState<any[]>([]);
    const [selectedMachine, setSelectedMachine] = useState<string>('');
    const [userId, setUserId] = useState<string | null>(null);
    const [allVillages, setAllVillages] = useState<string[]>([]);

    // Payment State (Traffic Light)
    type PaymentType = 'Pending' | 'Partial' | 'Paid';
    const [paymentType, setPaymentType] = useState<PaymentType>('Pending');
    const [paidAmount, setPaidAmount] = useState<number | ''>('');
    const [paymentMethod] = useState<string>('Cash');

    // Auto-fill logic for Traffic Light
    useEffect(() => {
        if (paymentType === 'Paid') {
            setPaidAmount(total);
        } else if (paymentType === 'Pending') {
            setPaidAmount('');
        } else if (paymentType === 'Partial') {
            setPaidAmount('');
        }
    }, [paymentType, total]);

    const checkMobile = async () => {
        if (!mobile || mobile.length < 5) return;
        try {
            const { data } = await supabase
                .from('farmers')
                .select('*')
                .eq('mobile', mobile)
                .single();

            if (data) {
                setExistingFarmerId(data.id);
                setName(data.name);
                setPlace(data.place || '');
                playSuccessHaptic(); // Slight feedback on found
            } else {
                setExistingFarmerId(null);
            }
        } catch (err) {
            setExistingFarmerId(null);
        }
    };

    // Auto-calculate Total
    useEffect(() => {
        const m = Number(measurement);
        const r = Number(rate);
        if (!isNaN(m) && !isNaN(r)) setTotal(m * r);
        else setTotal(0);
    }, [measurement, rate]);

    // Fetch User & Recent Jobs on Load
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
            fetchRecentJobs();
        };
        init();
        fetchVillages();
    }, []);

    const fetchVillages = async () => {
        const { data } = await supabase.from('farmers').select('place');
        if (data) {
            const unique = Array.from(new Set(data.map(d => d.place).filter(Boolean)));
            setAllVillages(unique);
        }
    };

    const fetchRecentJobs = async () => {
        setLoadingJobs(true);
        const { data, error } = await supabase
            .from('jobs')
            .select(`*, farmers (name, place, mobile), machines (name), payments (*)`)
            .order('date', { ascending: false })
            .limit(5);

        if (data) setRecentJobs(data);
        if (error) console.error('Error fetching jobs:', error);
        setLoadingJobs(false);
    };

    // Load Smart Defaults (User Scoped)
    useEffect(() => {
        if (!userId) return;
        const savedPlace = localStorage.getItem(`user_${userId}_default_place`);
        const savedRate = localStorage.getItem(`user_${userId}_default_rate`);
        const savedMachine = localStorage.getItem(`user_${userId}_default_machine`);

        if (savedPlace) setPlace(savedPlace);
        if (savedRate) setRate(Number(savedRate));
        if (savedMachine) setSelectedMachine(savedMachine);
    }, [userId]);

    // Fetch Machines on Load
    useEffect(() => {
        const fetchMachines = async () => {
            const { data } = await supabase.from('machines').select('*').order('name');
            if (data && data.length > 0) {
                setMachines(data);
                if (!localStorage.getItem('default_machine')) setSelectedMachine(data[0].id);
            }
        };
        fetchMachines();
    }, []);

    const handleSave = async () => {
        if (!name || !measurement || !rate) {
            playErrorHaptic();
            toast.error('Please fill in Name, Measurement, and Rate');
            return;
        }

        setIsSaving(true);
        try {
            let farmerId = existingFarmerId;

            if (!farmerId) {
                const { data: farmerData, error: farmerError } = await supabase
                    .from('farmers')
                    .insert([{ name, mobile, place }])
                    .select()
                    .single();
                if (farmerError) throw farmerError;
                farmerId = farmerData.id;
            } else {
                await supabase.from('farmers').update({ name, place }).eq('id', farmerId);
            }

            const { data: jobData, error: jobError } = await supabase
                .from('jobs')
                .insert([{
                    farmer_id: farmerId,
                    machine_id: selectedMachine || null,
                    crop,
                    billing_mode: billingMode,
                    quantity: Number(measurement),
                    rate: Number(rate),
                    total_amount: total,
                    paid_amount: 0,
                    status: 'Pending',
                    date: new Date(jobDate).toISOString()
                }])
                .select()
                .single();

            if (jobError) throw jobError;

            if (paymentType !== 'Pending' && Number(paidAmount) > 0) {
                const { error: payError } = await supabase
                    .from('payments')
                    .insert([{
                        job_id: jobData.id,
                        amount: Number(paidAmount),
                        method: paymentMethod,
                        date: new Date().toISOString()
                    }]);
                if (payError) throw payError;
            }

            playSuccessHaptic();
            toast.success('Record Saved Successfully!');

            if (userId) {
                localStorage.setItem(`user_${userId}_default_place`, place);
                localStorage.setItem(`user_${userId}_default_rate`, String(rate));
                if (selectedMachine) localStorage.setItem(`user_${userId}_default_machine`, selectedMachine);
            }

            setName('');
            setMobile('');
            setMeasurement('');
            setPaidAmount('');
            setPaymentType('Pending');
            setExistingFarmerId(null);

            fetchRecentJobs();
            setShowForm(false); // Close form on mobile/desktop naturally

        } catch (error: any) {
            playErrorHaptic();
            console.error('Error saving record:', error);
            toast.error('Error saving record: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleShare = (job: any) => {
        playClickHaptic();
        if (!job.farmers?.mobile) {
            toast.error('No mobile number found for this farmer.');
            return;
        }

        const balance = job.total_amount - (job.paid_amount || 0);
        const dateStr = new Date(job.date).toLocaleDateString();
        const place = job.farmers.place ? ` (${job.farmers.place})` : '';

        const message = `*HARVEST BILL*%0A` +
            `*${job.farmers.name}*${place}%0A` +
            `${dateStr}%0A` +
            `--------------------------------%0A` +
            `${job.crop || 'Crop'} | ${job.quantity} ${job.billing_mode === 'acre' ? 'Acres' : 'Hours'} x ₹${job.rate}%0A` +
            `*Total: ₹${job.total_amount.toLocaleString()}*%0A` +
            `Paid:  ₹${(job.paid_amount || 0).toLocaleString()}%0A` +
            `--------------------------------%0A` +
            `*BALANCE: ₹${balance.toLocaleString()}*%0A`;

        const url = `https://wa.me/91${job.farmers.mobile}?text=${message}`;
        window.open(url, '_blank');
    };

    const handleCall = (mobile: string) => {
        playClickHaptic();
        if (!mobile) return;
        window.open(`tel:${mobile}`);
    };

    const handleDelete = async (jobId: string) => {
        if (!confirm('Are you sure you want to delete this record? This cannot be undone.')) return;
        playClickHaptic();

        const { error } = await supabase.from('jobs').delete().eq('id', jobId);
        if (error) {
            playErrorHaptic();
            toast.error('Error deleting: ' + error.message);
        } else {
            playSuccessHaptic();
            toast.success('Record Deleted');
            setRecentJobs(prev => prev.filter(j => j.id !== jobId));
        }
    };

    const handleExport = () => {
        playClickHaptic();
        if (!recentJobs.length) return toast.error('No data to export');

        const headers = ['Date', 'Farmer', 'Village', 'Mobile', 'Crop', 'Machine', 'Mode', 'Qty', 'Rate', 'Total', 'Paid', 'Status'];
        const csvContent = [
            headers.join(','),
            ...recentJobs.map(j => [
                new Date(j.date).toLocaleDateString(),
                `"${j.farmers?.name || ''}"`,
                `"${j.farmers?.place || ''}"`,
                j.farmers?.mobile || '',
                j.crop || '',
                j.machines?.name || '',
                j.billing_mode,
                j.quantity,
                j.rate,
                j.total_amount,
                j.paid_amount,
                j.status
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `harvester_jobs_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', fontWeight: 700 }}>Farmers & Jobs</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Manage records</span>
                        <div style={{
                            padding: '2px 8px', borderRadius: '12px', background: '#F0FDF4', color: '#15803D',
                            fontSize: '0.75rem', fontWeight: 700, border: '1px solid #BBF7D0'
                        }}>
                            Today: {
                                recentJobs
                                    .filter(j => new Date(j.date).toDateString() === new Date().toDateString())
                                    .reduce((sum, j) => sum + (j.billing_mode === 'acre' ? Number(j.quantity) : 0), 0)
                                    .toFixed(1)
                            } Ac
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={handleExport} className="icon-btn" title="Export CSV" style={{ background: '#F3F4F6', color: '#4B5563' }}>
                        <Download size={20} />
                    </button>
                    <button
                        onClick={() => { playClickHaptic(); setShowForm(!showForm); }}
                        className="btn btn-primary hide-on-mobile"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', borderRadius: '8px', minHeight: '40px' }}
                    >
                        {showForm ? 'Cancel' : 'New Entry'}
                    </button>
                </div>
            </header>

            {/* FAB for Mobile */}
            <div className="fab-container">
                <button
                    className="fab-btn"
                    onClick={() => { playClickHaptic(); setShowForm(!showForm); }}
                    style={{ transform: showForm ? 'rotate(45deg)' : 'rotate(0)' }}
                >
                    <Plus size={28} />
                </button>
            </div>

            {/* Form Section - Auto scroll to it when shown on mobile? */}
            {showForm && (
                <div className="card" style={{ marginBottom: '2rem', animation: 'fadeIn 0.2s ease-out' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        New Work Record
                        <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-secondary)' }}><X size={20} /></button>
                    </h2>

                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        {/* Fields remain mostly same, just ensuring compact inputs work */}
                        <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="label" style={{ fontSize: '0.75rem' }}>Farmer Name</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    className="input input-compact"
                                    placeholder="Name"
                                    style={{ padding: '0.6rem', fontSize: '0.9rem', width: '100%' }}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoFocus
                                />
                                {existingFarmerId && <Check size={14} color="var(--primary)" style={{ position: 'absolute', right: '8px', top: '10px' }} />}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="label" style={{ fontSize: '0.75rem' }}>Mobile</label>
                                <input
                                    type="tel"
                                    className="input input-compact"
                                    placeholder="98765..."
                                    style={{ padding: '0.6rem', fontSize: '0.9rem' }}
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    onBlur={checkMobile}
                                />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="label" style={{ fontSize: '0.75rem' }}>Date</label>
                                <input
                                    type="date"
                                    className="input input-compact"
                                    style={{ padding: '0.6rem', fontSize: '0.85rem', width: '100%' }}
                                    value={jobDate}
                                    onChange={(e) => setJobDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="label" style={{ fontSize: '0.75rem' }}>Village</label>
                                <input
                                    type="text"
                                    className="input input-compact"
                                    placeholder="Village"
                                    style={{ padding: '0.6rem', fontSize: '0.9rem' }}
                                    value={place}
                                    onChange={(e) => setPlace(e.target.value)}
                                    list="village-options"
                                />
                                <datalist id="village-options">
                                    {allVillages.map((v, i) => <option key={i} value={v} />)}
                                </datalist>
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="label" style={{ fontSize: '0.75rem' }}>Crop</label>
                                <input
                                    type="text"
                                    className="input input-compact"
                                    placeholder="Crop"
                                    style={{ padding: '0.6rem', fontSize: '0.9rem' }}
                                    value={crop}
                                    onChange={(e) => setCrop(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
                                {machines.map(m => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        className={`btn ${selectedMachine === m.id ? 'btn-primary' : 'btn-white'}`}
                                        style={{
                                            border: selectedMachine === m.id ? 'none' : '1px solid var(--border-light)',
                                            color: selectedMachine === m.id ? 'white' : 'var(--text-main)',
                                            padding: '0.4rem 0.8rem', fontSize: '0.75rem', whiteSpace: 'nowrap',
                                            borderRadius: '20px'
                                        }}
                                        onClick={() => { playClickHaptic(); setSelectedMachine(m.id); }}
                                    >
                                        {m.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '0.5rem', marginBottom: '1rem',
                            background: '#F9FAFB', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)'
                        }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="label" style={{ fontSize: '0.7rem' }}>
                                    <span onClick={() => setBillingMode(billingMode === 'acre' ? 'hour' : 'acre')} style={{ borderBottom: '1px dashed #999', cursor: 'pointer' }}>
                                        {billingMode === 'acre' ? 'Acres' : 'Hours'}
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    className="input input-compact"
                                    step="0.1"
                                    placeholder="0"
                                    style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 600 }}
                                    value={measurement}
                                    onChange={(e) => setMeasurement(Number(e.target.value))}
                                />
                            </div>

                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="label" style={{ fontSize: '0.7rem' }}>Rate</label>
                                <input
                                    type="number"
                                    className="input input-compact"
                                    placeholder="0"
                                    style={{ padding: '0.5rem', textAlign: 'center' }}
                                    value={rate}
                                    onChange={(e) => setRate(Number(e.target.value))}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', paddingLeft: '0.5rem', borderLeft: '1px solid #E5E7EB' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Total</span>
                                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>₹{total.toLocaleString()}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', background: '#F3F4F6', padding: '3px', borderRadius: '8px', flex: 1 }}>
                                {(['Pending', 'Partial', 'Paid'] as const).map((status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => { playClickHaptic(); setPaymentType(status); }}
                                        style={{
                                            flex: 1,
                                            padding: '0.4rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            borderRadius: '6px',
                                            background: paymentType === status ? 'white' : 'transparent',
                                            color: paymentType === status ? (status === 'Pending' ? '#EF4444' : (status === 'Paid' ? '#10B981' : '#F59E0B')) : '#6B7280',
                                            boxShadow: paymentType === status ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>

                            {paymentType === 'Partial' && (
                                <div style={{ flex: 0.7, animation: 'fadeIn 0.2s' }}>
                                    <input
                                        type="number"
                                        className="input input-compact"
                                        placeholder="Enter Amount"
                                        value={paidAmount}
                                        onChange={e => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                        style={{ padding: '0.4rem', fontSize: '0.9rem', height: '34px', width: '100%' }}
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary btn-sm" style={{ border: 'none' }}>Cancel</button>
                            <button
                                type="submit"
                                className="btn btn-primary btn-sm"
                                style={{ padding: '0.5rem 2rem', fontSize: '0.9rem' }}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Save Entry'}
                            </button>
                        </div>
                    </form>
                </div >
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', whiteSpace: 'nowrap' }}>Recent Records</h3>
                <button
                    className="btn btn-secondary"
                    onClick={() => { playClickHaptic(); setShowHistory(true); }}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', height: 'auto', whiteSpace: 'nowrap' }}
                >
                    View All
                </button>
            </div>

            {
                loadingJobs ? (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {Array(3).fill(0).map((_, i) => (
                            <div key={i} className="card" style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <Skeleton width={120} height={20} />
                                        <Skeleton width={80} height={15} />
                                    </div>
                                    <Skeleton width={60} height={24} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                                    <Skeleton width={80} height={15} />
                                    <Skeleton width={100} height={28} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : recentJobs.length === 0 ? (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <div style={{ marginBottom: '1rem', display: 'inline-flex', padding: '1rem', background: 'var(--bg-main)', borderRadius: '50%' }}>
                            <Users size={32} />
                        </div>
                        <p>No records yet. Tap + to add one.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {recentJobs.map((job) => (
                            <JobCard
                                key={job.id}
                                job={job}
                                onShare={(j) => handleShare(j)}
                                onEdit={(j) => { playClickHaptic(); setEditJob(j); }}
                                onDelete={(id) => handleDelete(id)}
                                onPay={(j) => { playClickHaptic(); setSelectedJob(j); }}
                                onCall={(m) => handleCall(m)}
                                onReceipt={(j) => { playClickHaptic(); setSelectedReceiptJob(j); }}
                            />
                        ))}
                    </div>
                )
            }

            {/* Modals - Keeping them as is */}
            {selectedJob && (
                <PaymentModal
                    job={selectedJob}
                    onClose={() => setSelectedJob(null)}
                    onSuccess={(result) => {
                        playSuccessHaptic();
                        toast.success('Payment Updated!');
                        if (result) {
                            setRecentJobs(prev => prev.map(j => {
                                if (j.id === selectedJob.id) {
                                    return { ...j, status: result.newStatus, paid_amount: result.newPaidAmount };
                                }
                                return j;
                            }));
                        }
                        setTimeout(() => fetchRecentJobs(), 1000);
                    }}
                />
            )}
            {editJob && (
                <EditJobModal
                    job={editJob}
                    machines={machines}
                    onClose={() => setEditJob(null)}
                    onSuccess={() => { playSuccessHaptic(); toast.success('Record Updated!'); fetchRecentJobs(); }}
                />
            )}
            {showHistory && (
                <JobHistoryModal
                    onClose={() => setShowHistory(false)}
                    onShare={handleShare}
                    onEdit={setEditJob}
                    onDelete={handleDelete}
                    onPay={setSelectedJob}
                    onCall={handleCall}
                    onReceipt={setSelectedReceiptJob}
                />
            )}
            {selectedReceiptJob && (
                <ReceiptModal
                    job={selectedReceiptJob}
                    onClose={() => setSelectedReceiptJob(null)}
                />
            )}
        </div >
    );
};

export default FarmersPage;

