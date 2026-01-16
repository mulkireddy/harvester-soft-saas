
import React, { useState, useEffect } from 'react';


import { User, Users, MapPin, Phone, Sprout, Hash, Clock, DollarSign, Loader2, Calendar, History, X } from 'lucide-react';
import { supabase } from '../supabase';
import PaymentModal from '../components/PaymentModal';
import EditJobModal from '../components/EditJobModal';
import '../mobile.css';

import JobHistoryModal from '../components/JobHistoryModal';
import JobCard from '../components/JobCard';
import ReceiptModal from '../components/ReceiptModal';

type BillingMode = 'acre' | 'hour';

const FarmersPage: React.FC = () => {
    const [billingMode, setBillingMode] = useState<BillingMode>('acre');
    const [measurement, setMeasurement] = useState<number | ''>(''); // Acres or Hours
    const [rate, setRate] = useState<number | ''>('');
    const [total, setTotal] = useState<number>(0);

    // Smart Chips State
    const [historyPlaces, setHistoryPlaces] = useState<string[]>([]);
    const [historyCrops, setHistoryCrops] = useState<string[]>([]);
    const [showForm, setShowForm] = useState(false);

    // Helper to update history (Max 5 items)
    const updateHistory = (key: string, value: string) => {
        if (!value) return;
        const current = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = [value, ...current.filter((i: string) => i !== value)].slice(0, 5);
        localStorage.setItem(key, JSON.stringify(updated));
    };

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
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [selectedJob, setSelectedJob] = useState<any>(null); // For Payment Modal
    const [editJob, setEditJob] = useState<any>(null); // For Edit Modal
    const [showHistory, setShowHistory] = useState(false);
    const [selectedReceiptJob, setSelectedReceiptJob] = useState<any>(null); // For Receipt Modal

    // Machine State
    const [machines, setMachines] = useState<any[]>([]);
    const [selectedMachine, setSelectedMachine] = useState<string>('');
    const [userId, setUserId] = useState<string | null>(null);

    // Payment State

    // Payment State
    // Payment State (Traffic Light)
    type PaymentType = 'Pending' | 'Partial' | 'Paid';
    const [paymentType, setPaymentType] = useState<PaymentType>('Pending');
    // const [offerPayment, setOfferPayment] = useState<boolean>(false); // REMOVED
    const [paidAmount, setPaidAmount] = useState<number | ''>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('Cash');


    // const paymentStatus = ... (Calculated automatically via buttons now)

    // Auto-fill logic for Traffic Light
    useEffect(() => {
        if (paymentType === 'Paid') {
            setPaidAmount(total);
        } else if (paymentType === 'Pending') {
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
                // Optional: Toast or small indicator
            } else {
                setExistingFarmerId(null);
                // Allow creating new
            }
        } catch (err) {
            // Ignore error (e.g. not found)
            setExistingFarmerId(null);
        }
    };

    // Auto-calculate Total
    useEffect(() => {
        const m = Number(measurement);
        const r = Number(rate);
        if (!isNaN(m) && !isNaN(r)) {
            setTotal(m * r);
        } else {
            setTotal(0);
        }
    }, [measurement, rate]);

    // Fetch User & Recent Jobs on Load
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
            fetchRecentJobs();
        };
        init();
    }, []);

    const fetchRecentJobs = async () => {
        const { data, error } = await supabase
            .from('jobs')
            .select(`
                *,
                farmers (name, place, mobile),
                machines (name),
                payments (*)
            `)
            .order('date', { ascending: false })
            .limit(5);

        if (data) setRecentJobs(data);
        if (error) console.error('Error fetching jobs:', error);
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

        // Load History Chips
        setHistoryPlaces(JSON.parse(localStorage.getItem(`user_${userId}_history_places`) || '[]'));
        setHistoryCrops(JSON.parse(localStorage.getItem(`user_${userId}_history_crops`) || '[]'));
    }, [userId]);

    // Fetch Machines on Load
    useEffect(() => {
        const fetchMachines = async () => {
            const { data } = await supabase.from('machines').select('*').order('name');
            if (data && data.length > 0) {
                setMachines(data);
                // Only default to first machine if we didn't load one from storage
                if (!localStorage.getItem('default_machine')) {
                    setSelectedMachine(data[0].id);
                }
            }
        };
        fetchMachines();
    }, []);

    const handleSave = async () => {
        if (!name || !measurement || !rate) {
            alert('Please fill in Name, Measurement, and Rate');
            return;
        }

        setIsSaving(true);
        try {
            let farmerId = existingFarmerId;

            if (!farmerId) {
                // 1. Create New Farmer
                const { data: farmerData, error: farmerError } = await supabase
                    .from('farmers')
                    .insert([{ name, mobile, place }])
                    .select()
                    .single();

                if (farmerError) throw farmerError;
                farmerId = farmerData.id;
            } else {
                // Update existing farmer details just in case (optional, but good for sync)
                await supabase.from('farmers').update({ name, place }).eq('id', farmerId);
            }

            // 2. Create Job (Initialize as Pending with 0 paid)
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
                    paid_amount: 0, // Will be updated by trigger if payment is added
                    status: 'Pending',
                    date: new Date(jobDate).toISOString()
                }])
                .select()
                .single();

            if (jobError) throw jobError;

            // 3. Add Initial Payment (if applicable)
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

            // Success
            alert('Record Saved Successfully!');

            // Smart Defaults: Save for next time (User Scoped)
            if (userId) {
                localStorage.setItem(`user_${userId}_default_place`, place);
                localStorage.setItem(`user_${userId}_default_rate`, String(rate));
                if (selectedMachine) localStorage.setItem(`user_${userId}_default_machine`, selectedMachine);

                // Update History Chips
                updateHistory(`user_${userId}_history_places`, place);
                updateHistory(`user_${userId}_history_crops`, crop);
                setHistoryPlaces(JSON.parse(localStorage.getItem(`user_${userId}_history_places`) || '[]'));
                setHistoryCrops(JSON.parse(localStorage.getItem(`user_${userId}_history_crops`) || '[]'));
            }


            // Reset Form (Optional: keep some fields or clear all)
            setName('');
            setMobile('');
            // Keep Place & Rate (Smart Defaults for same session)
            // setPlace(''); 
            // setRate('');
            setMeasurement('');
            setPaidAmount('');
            setMeasurement('');
            setPaidAmount('');
            setPaymentType('Pending'); // Reset to default
            setExistingFarmerId(null); // Reset
            // Keep date as is or reset to today? Keep as is often useful for batch entry.

            // Refresh List
            fetchRecentJobs();

        } catch (error: any) {
            console.error('Error saving record:', error);
            alert('Error saving record: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleShare = (job: any) => {
        if (!job.farmers?.mobile) {
            alert('No mobile number found for this farmer.');
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
        if (!mobile) return;
        window.open(`tel:${mobile}`);
    };

    const handleDelete = async (jobId: string) => {
        if (!confirm('Are you sure you want to delete this record? This cannot be undone.')) return;

        const { error } = await supabase.from('jobs').delete().eq('id', jobId);
        if (error) {
            alert('Error deleting: ' + error.message);
        } else {
            // Update UI
            setRecentJobs(prev => prev.filter(j => j.id !== jobId));
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Farmers & Jobs</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Add new work records or manage existing farmers.</p>
                </div>
                <button className="btn btn-secondary">Export List</button>
            </header>

            {/* Daily Summary & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '50px',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    color: '#15803D',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                    <Clock size={16} />
                    <span>Today: {
                        recentJobs
                            .filter(j => new Date(j.date).toDateString() === new Date().toDateString())
                            .reduce((sum, j) => sum + (j.billing_mode === 'acre' ? Number(j.quantity) : 0), 0)
                            .toFixed(1)
                    } Ac</span>
                </div>

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', borderRadius: '50px' }}
                >
                    {showForm ? 'Cancel' : <><User size={18} style={{ marginRight: '6px' }} /> New Entry</>}
                </button>
            </div>

            {/* New Record Card (Collapsible) */}
            {showForm && (
                <div className="card" style={{ marginBottom: '2rem', animation: 'fadeIn 0.2s ease-out' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        New Work Record
                        <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-secondary)' }}><X size={20} /></button>
                    </h2>

                    {successMessage && (
                        <div style={{
                            marginBottom: '1rem',
                            padding: '0.75rem',
                            backgroundColor: '#DCFCE7',
                            color: '#166534',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.9rem',
                            fontWeight: 600
                        }}>
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        {/* Row 1: Basic Info */}
                        <div className="grid-responsive grid-2" style={{ marginBottom: '1rem' }}>
                            <div className="input-group">
                                <label className="label">Mobile Number</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="tel"
                                        className="input"
                                        placeholder="Mobile"
                                        style={{ paddingLeft: '2.5rem', width: '100%' }}
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value)}
                                        onBlur={checkMobile}
                                    />
                                </div>
                                {existingFarmerId && <span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>✓ Found existing</span>}
                            </div>

                            <div className="input-group">
                                <label className="label">Farmer Name</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Name"
                                        style={{ paddingLeft: '2.5rem', width: '100%' }}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Location & Crop & Date */}
                        <div className="grid-responsive grid-3" style={{ marginBottom: '1rem' }}>
                            <div className="input-group">
                                <label className="label">Village / Place</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Village"
                                        style={{ paddingLeft: '2.5rem', width: '100%' }}
                                        value={place}
                                        onChange={(e) => setPlace(e.target.value)}
                                    />
                                </div>
                                {historyPlaces.length > 0 && (
                                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                                        {historyPlaces.map(p => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setPlace(p)}
                                                style={{
                                                    padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600,
                                                    background: '#F3F4F6', borderRadius: '12px',
                                                    border: '1px solid #E5E7EB', color: '#4B5563', whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="input-group">
                                <label className="label">Crop Type</label>
                                <div style={{ position: 'relative' }}>
                                    <Sprout size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Crop"
                                        style={{ paddingLeft: '2.5rem', width: '100%' }}
                                        value={crop}
                                        onChange={(e) => setCrop(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="label">Job Date</label>
                                <div style={{ position: 'relative' }}>
                                    <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="date"
                                        className="input"
                                        style={{ paddingLeft: '2.5rem', width: '100%' }}
                                        value={jobDate}
                                        onChange={(e) => setJobDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Row 2.5: Machine Selection */}
                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label className="label">Select Machine</label>
                            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
                                {machines.map(m => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        className={`btn ${selectedMachine === m.id ? 'btn-primary' : 'btn-white'}`}
                                        style={{
                                            border: selectedMachine === m.id ? 'none' : '1px solid var(--border-light)',
                                            color: selectedMachine === m.id ? 'white' : 'var(--text-main)',
                                            padding: '0.4rem 0.8rem', fontSize: '0.8rem', whiteSpace: 'nowrap'
                                        }}
                                        onClick={() => setSelectedMachine(m.id)}
                                    >
                                        {m.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Row 3: Billing Toggle (Compact) */}
                        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <label className="label" style={{ margin: 0 }}>Billing:</label>
                            <div style={{
                                display: 'inline-flex',
                                background: 'var(--bg-main)',
                                padding: '2px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-light)'
                            }}>
                                <button
                                    type="button"
                                    className={`btn ${billingMode === 'acre' ? 'btn-white shadow' : ''}`}
                                    style={{
                                        backgroundColor: billingMode === 'acre' ? '#FFFFFF' : 'transparent',
                                        color: billingMode === 'acre' ? 'var(--primary)' : 'var(--text-secondary)',
                                        boxShadow: billingMode === 'acre' ? 'var(--shadow-sm)' : 'none',
                                        padding: '0.3rem 0.8rem',
                                        fontSize: '0.8rem',
                                        borderRadius: 'var(--radius-sm)',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => setBillingMode('acre')}
                                >
                                    Per Acre
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${billingMode === 'hour' ? 'btn-white shadow' : ''}`}
                                    style={{
                                        backgroundColor: billingMode === 'hour' ? '#FFFFFF' : 'transparent',
                                        color: billingMode === 'hour' ? 'var(--primary)' : 'var(--text-secondary)',
                                        boxShadow: billingMode === 'hour' ? 'var(--shadow-sm)' : 'none',
                                        padding: '0.3rem 0.8rem',
                                        fontSize: '0.8rem',
                                        borderRadius: 'var(--radius-sm)',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => setBillingMode('hour')}
                                >
                                    Hourly
                                </button>
                            </div>
                        </div>

                        {/* Row 4: Calculation Inputs */}
                        <div className="grid-responsive grid-3" style={{ alignItems: 'end', marginBottom: '1.5rem', gap: '1rem' }}>
                            <div className="input-group">
                                <label className="label">
                                    {billingMode === 'acre' ? 'Total Acres' : 'Total Hours'}
                                </label>
                                <input
                                    type="number"
                                    className="input"
                                    step="0.1"
                                    placeholder="0.0"
                                    style={{ width: '100%' }}
                                    value={measurement}
                                    onChange={(e) => setMeasurement(Number(e.target.value))}
                                />
                            </div>

                            <div className="input-group">
                                <label className="label">
                                    Rate
                                </label>
                                <input
                                    type="number"
                                    className="input"
                                    placeholder="Rate"
                                    style={{ width: '100%' }}
                                    value={rate}
                                    onChange={(e) => setRate(Number(e.target.value))}
                                />
                            </div>

                            {/* Total Display */}
                            <div style={{
                                background: '#FFF0F3',
                                padding: '0.5rem 0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px dashed var(--primary)',
                                textAlign: 'right', marginBottom: '0.8rem'
                            }}>
                                <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase' }}>Total Amount</span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                                    ₹ {total.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Payment Traffic Light - Compact */}
                        <div style={{ marginBottom: '2rem', padding: '1rem', background: '#F9FAFB', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                            <label className="label" style={{ marginBottom: '0.5rem', display: 'block', fontSize: '0.85rem' }}>Payment Status</label>
                            <div className="grid-responsive grid-3" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
                                <button type="button" onClick={() => setPaymentType('Pending')} style={{ padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, border: paymentType === 'Pending' ? '2px solid #EF4444' : '1px solid #E5E7EB', background: paymentType === 'Pending' ? '#FEF2F2' : 'white', color: paymentType === 'Pending' ? '#EF4444' : '#6B7280' }}>Pending</button>
                                <button type="button" onClick={() => setPaymentType('Partial')} style={{ padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, border: paymentType === 'Partial' ? '2px solid #F59E0B' : '1px solid #E5E7EB', background: paymentType === 'Partial' ? '#FFFBEB' : 'white', color: paymentType === 'Partial' ? '#F59E0B' : '#6B7280' }}>Partial</button>
                                <button type="button" onClick={() => setPaymentType('Paid')} style={{ padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, border: paymentType === 'Paid' ? '2px solid #10B981' : '1px solid #E5E7EB', background: paymentType === 'Paid' ? '#ECFDF5' : 'white', color: paymentType === 'Paid' ? '#10B981' : '#6B7280' }}>Full Paid</button>
                            </div>

                            {paymentType !== 'Pending' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="input-group">
                                        <label className="label">Amount Paid</label>
                                        <input type="number" className="input" placeholder="0" value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} readOnly={paymentType === 'Paid'} />
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Method</label>
                                        <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                            <option value="Cash">Cash</option>
                                            <option value="Online">Online</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ paddingLeft: '2rem', paddingRight: '2rem' }}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'Save Record'}
                            </button>
                        </div>
                    </form>
                </div >
            )}


            {/* Placeholder for List */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}> Recent Records</h3>
                <button className="btn btn-secondary" onClick={() => setShowHistory(true)} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                    <History size={16} style={{ marginRight: '6px' }} /> View All History
                </button>
            </div>

            {
                recentJobs.length === 0 ? (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <div style={{ marginBottom: '1rem', display: 'inline-flex', padding: '1rem', background: 'var(--bg-main)', borderRadius: '50%' }}>
                            <Users size={32} />
                        </div>
                        <p>No records yet. Start by adding a farmer above.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {recentJobs.map((job) => (
                            <JobCard
                                key={job.id}
                                job={job}
                                onShare={handleShare}
                                onEdit={setEditJob}
                                onDelete={handleDelete}
                                onPay={setSelectedJob}
                                onCall={handleCall}
                                onReceipt={setSelectedReceiptJob}
                            />
                        ))}
                    </div>
                )
            }

            {/* Payment Modal */}
            {
                selectedJob && (
                    <PaymentModal
                        job={selectedJob}
                        onClose={() => setSelectedJob(null)}
                        onSuccess={(result) => {
                            setSuccessMessage('Payment Updated Successfully!');
                            setTimeout(() => setSuccessMessage(null), 3000);

                            // Optimistic Update with REAL data from modal
                            if (result) {
                                setRecentJobs(prev => prev.map(j => {
                                    if (j.id === selectedJob.id) {
                                        return {
                                            ...j,
                                            status: result.newStatus,
                                            paid_amount: result.newPaidAmount
                                        };
                                    }
                                    return j;
                                }));
                            }

                            // Then fetch from DB to be sure (sync)
                            setTimeout(() => {
                                fetchRecentJobs();
                            }, 1000);
                        }}
                    />
                )
            }
            {/* Edit Job Modal */}
            {
                editJob && (
                    <EditJobModal
                        job={editJob}
                        machines={machines}
                        onClose={() => setEditJob(null)}
                        onSuccess={() => {
                            setSuccessMessage('Record Updated Successfully!');
                            setTimeout(() => setSuccessMessage(null), 3000);
                            fetchRecentJobs();
                        }}
                    />
                )
            }

            {/* History Modal */}
            {showHistory && (
                <JobHistoryModal
                    onClose={() => setShowHistory(false)}
                    onShare={handleShare}
                    onEdit={setEditJob}
                    onDelete={(id) => {
                        // We can delete here, but we should also update the local recent list if it was there
                        handleDelete(id);
                    }}
                    onPay={setSelectedJob}
                    onCall={handleCall}
                    onReceipt={setSelectedReceiptJob}
                />
            )}
            {/* Receipt Modal */}
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
