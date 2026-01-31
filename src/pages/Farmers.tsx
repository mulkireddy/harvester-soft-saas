import React, { useState, useEffect, useRef } from 'react';
import { Users, Loader2, X, Check, Download, Plus, ChevronRight, Wheat, AlertCircle, Sparkles } from 'lucide-react';
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

// Autocomplete Component for Farmer Name
const FarmerAutocomplete: React.FC<{
    value: string;
    onChange: (value: string) => void;
    onSelect: (farmer: any) => void;
    existingFarmerId: string | null;
}> = ({ value, onChange, onSelect, existingFarmerId }) => {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchFarmers = async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }
        const { data } = await supabase
            .from('farmers')
            .select('id, name, mobile, place')
            .ilike('name', `%${query}%`)
            .limit(5);
        if (data) setSuggestions(data);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val);
        searchFarmers(val);
        setShowSuggestions(true);
    };

    const handleSelect = (farmer: any) => {
        onChange(farmer.name);
        onSelect(farmer);
        setShowSuggestions(false);
        playSuccessHaptic();
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative' }}>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleInputChange}
                onFocus={() => value.length >= 2 && setShowSuggestions(true)}
                placeholder="Start typing farmer name..."
                autoFocus
                style={{
                    width: '100%',
                    padding: '0.75rem 2.5rem 0.75rem 0.875rem',
                    fontSize: 'var(--text-base)',
                    fontWeight: 500,
                    border: existingFarmerId
                        ? '2px solid var(--success)'
                        : '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                    background: existingFarmerId
                        ? 'rgba(16, 185, 129, 0.05)'
                        : 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    transition: 'all var(--transition-fast)'
                }}
            />
            {existingFarmerId && (
                <div style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Check size={14} style={{ color: 'white' }} />
                </div>
            )}

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.25rem',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 10px 30px -5px rgba(0,0,0,0.15)',
                    border: '1px solid var(--border-light)',
                    zIndex: 50,
                    overflow: 'hidden'
                }}>
                    {suggestions.map((farmer, index) => (
                        <button
                            key={farmer.id}
                            type="button"
                            onClick={() => handleSelect(farmer)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: index < suggestions.length - 1
                                    ? '1px solid var(--border-light)'
                                    : 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'background 0.15s'
                            }}
                        >
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--primary-light)',
                                color: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 600,
                                fontSize: 'var(--text-xs)'
                            }}>
                                {farmer.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: 'var(--text-sm)',
                                    fontWeight: 600,
                                    color: 'var(--text-main)'
                                }}>
                                    {farmer.name}
                                </div>
                                <div style={{
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--text-muted)'
                                }}>
                                    {farmer.place || 'No location'} • {farmer.mobile || 'No mobile'}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// Machine Selection Chips Component
const MachineChips: React.FC<{
    machines: any[];
    selected: string;
    onSelect: (id: string) => void;
}> = ({ machines, selected, onSelect }) => (
    <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '4px',
        WebkitOverflowScrolling: 'touch'
    }}>
        {machines.map(m => {
            const isSelected = selected === m.id;
            return (
                <button
                    key={m.id}
                    type="button"
                    onClick={() => { playClickHaptic(); onSelect(m.id); }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.5rem 1rem',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        borderRadius: 'var(--radius-full)',
                        border: isSelected
                            ? 'none'
                            : '1px solid var(--border-light)',
                        background: isSelected
                            ? 'linear-gradient(135deg, var(--primary), #059669)'
                            : 'var(--bg-subtle)',
                        color: isSelected ? 'white' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected
                            ? '0 2px 8px rgba(5, 150, 105, 0.25)'
                            : 'none',
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                    }}
                >
                    {isSelected && <Check size={12} />}
                    {m.name}
                </button>
            );
        })}
    </div>
);

// Form Field with Hint Component
const FormField: React.FC<{
    label: React.ReactNode;
    hint?: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}> = ({ label, hint, error, required, children }) => (
    <div style={{ marginBottom: '0.75rem' }}>
        <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            color: error ? 'var(--error)' : 'var(--text-muted)',
            marginBottom: '0.375rem'
        }}>
            {label}
            {required && <span style={{ color: 'var(--error)' }}>*</span>}
        </label>
        {children}
        {(hint || error) && (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                marginTop: '0.25rem',
                fontSize: '0.65rem',
                color: error ? 'var(--error)' : 'var(--text-muted)'
            }}>
                {error && <AlertCircle size={10} />}
                {error || hint}
            </div>
        )}
    </div>
);



// Success Animation Overlay
const SuccessAnimation: React.FC<{
    show: boolean;
    onComplete: () => void;
}> = ({ show, onComplete }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(onComplete, 1500);
            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    if (!show) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--success), #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: '0 20px 60px rgba(16, 185, 129, 0.4)'
            }}>
                <Check size={60} style={{ color: 'white' }} />
            </div>
        </div>
    );
};

const FarmersPage: React.FC = () => {
    // ... (Keep existing state)
    const [billingMode, setBillingMode] = useState<BillingMode>('acre');
    const [measurement, setMeasurement] = useState<number | ''>(''); // Acres or Hours
    const [rate, setRate] = useState<number | ''>('');
    const [total, setTotal] = useState<number>(0);

    // State for Collapsible Form
    const [showForm, setShowForm] = useState(false);
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

    // Form Fields
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [place, setPlace] = useState('');
    const [crop, setCrop] = useState('');
    const [existingFarmerId, setExistingFarmerId] = useState<string | null>(null);
    const [jobDate, setJobDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today YYYY-MM-DD

    // Form Validation Errors
    const [errors, setErrors] = useState<Record<string, string>>({});

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

    const handleFarmerSelect = (farmer: any) => {
        setExistingFarmerId(farmer.id);
        setName(farmer.name);
        setMobile(farmer.mobile || '');
        setPlace(farmer.place || '');
        setErrors(prev => ({ ...prev, name: '' }));
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

    // Validate Form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!name.trim()) {
            newErrors.name = 'Farmer name is required';
        }
        if (!measurement) {
            newErrors.measurement = 'Enter acres or hours';
        }
        if (!rate) {
            newErrors.rate = 'Enter rate per unit';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            playErrorHaptic();
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

            // Show success animation
            setShowSuccessAnimation(true);

            if (userId) {
                localStorage.setItem(`user_${userId}_default_place`, place);
                localStorage.setItem(`user_${userId}_default_rate`, String(rate));
                if (selectedMachine) localStorage.setItem(`user_${userId}_default_machine`, selectedMachine);
            }

            // Reset form
            setName('');
            setMobile('');
            setMeasurement('');
            setPaidAmount('');
            setPaymentType('Pending');
            setExistingFarmerId(null);
            setErrors({});

            fetchRecentJobs();

        } catch (error: any) {
            playErrorHaptic();
            console.error('Error saving record:', error);
            toast.error('Error saving record: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSuccessComplete = () => {
        setShowSuccessAnimation(false);
        setShowForm(false);
        toast.success('Record Saved Successfully!');
    };

    const handleShare = (job: any) => {
        playClickHaptic();
        if (!job.farmers?.mobile) {
            toast.error('No mobile number found for this farmer.');
            return;
        }

        const balance = job.total_amount - (job.paid_amount || 0);
        const dateStr = new Date(job.date).toLocaleDateString();
        const pl = job.farmers.place ? ` (${job.farmers.place})` : '';

        const message = `*HARVEST BILL*%0A` +
            `*${job.farmers.name}*${pl}%0A` +
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

    // Calculate today's acres
    const todayAcres = recentJobs
        .filter(j => new Date(j.date).toDateString() === new Date().toDateString())
        .reduce((sum, j) => sum + (j.billing_mode === 'acre' ? Number(j.quantity) : 0), 0);

    return (
        <div className="animate-fade-in" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            {/* Success Animation */}
            <SuccessAnimation
                show={showSuccessAnimation}
                onComplete={handleSuccessComplete}
            />

            {/* Header */}
            <header style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{
                            fontSize: 'var(--text-xl)',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            marginBottom: '0.375rem',
                            letterSpacing: '-0.02em'
                        }}>
                            Farmers & Jobs
                        </h1>
                        <p style={{
                            fontSize: 'var(--text-sm)',
                            color: 'var(--text-muted)'
                        }}>
                            Track harvest work & payments
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={handleExport}
                            title="Export CSV"
                            style={{
                                width: '40px',
                                height: '40px',
                                background: 'var(--bg-subtle)',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all var(--transition-fast)'
                            }}
                        >
                            <Download size={18} />
                        </button>
                        <button
                            onClick={() => { playClickHaptic(); setShowForm(!showForm); }}
                            className="hide-on-mobile"
                            style={{
                                padding: '0.5rem 1rem',
                                fontSize: 'var(--text-sm)',
                                fontWeight: 600,
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                transition: 'all var(--transition-fast)'
                            }}
                        >
                            <Plus size={16} />
                            {showForm ? 'Cancel' : 'New Entry'}
                        </button>
                    </div>
                </div>

                {/* Today's Summary Badge */}
                <div style={{
                    marginTop: '1rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.875rem',
                    background: 'var(--primary-light)',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid rgba(5, 150, 105, 0.15)'
                }}>
                    <Wheat size={14} style={{ color: 'var(--primary)' }} />
                    <span style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        color: 'var(--primary)'
                    }}>
                        Today: {todayAcres.toFixed(1)} Acres
                    </span>
                </div>
            </header>

            {/* FAB for Mobile */}
            <div className="fab-container">
                <button
                    className="fab-btn"
                    onClick={() => { playClickHaptic(); setShowForm(!showForm); }}
                    style={{
                        transform: showForm ? 'rotate(45deg)' : 'rotate(0)',
                        transition: 'transform var(--transition-bounce)'
                    }}
                >
                    <Plus size={28} />
                </button>
            </div>

            {/* Form Section with Better Visual Hierarchy */}
            {showForm && (
                <div className="animate-scale-in" style={{
                    marginBottom: '2rem',
                    width: '100%',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '1.25rem',
                    boxShadow: 'var(--shadow-card)',
                    border: '1px solid var(--border-light)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1.25rem',
                        paddingBottom: '0.875rem',
                        borderBottom: '1px solid var(--border-light)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--primary-light)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Sparkles size={16} style={{ color: 'var(--primary)' }} />
                            </div>
                            <h2 style={{
                                fontSize: 'var(--text-base)',
                                fontWeight: 600,
                                color: 'var(--text-main)'
                            }}>
                                New Work Record
                            </h2>
                        </div>
                        <button
                            onClick={() => setShowForm(false)}
                            style={{
                                background: 'var(--bg-subtle)',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                                transition: 'all var(--transition-fast)'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        {/* Section 1: Farmer Info */}
                        <div style={{
                            marginBottom: '1.25rem',
                            paddingBottom: '1rem',
                            borderBottom: '1px dashed var(--border-light)'
                        }}>
                            <div style={{
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: 'var(--text-muted)',
                                marginBottom: '0.75rem'
                            }}>
                                Farmer Details
                            </div>

                            {/* Farmer Name Autocomplete */}
                            <FormField
                                label="Farmer Name"
                                required
                                error={errors.name}
                                hint={existingFarmerId ? 'Existing farmer selected' : 'Start typing to search'}
                            >
                                <FarmerAutocomplete
                                    value={name}
                                    onChange={setName}
                                    onSelect={handleFarmerSelect}
                                    existingFarmerId={existingFarmerId}
                                />
                            </FormField>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '0.75rem'
                            }}>
                                <FormField label="Mobile">
                                    <input
                                        type="tel"
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value)}
                                        placeholder="98765..."
                                        maxLength={10}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 0.875rem',
                                            fontSize: 'var(--text-base)',
                                            border: '1px solid var(--border-light)',
                                            borderRadius: 'var(--radius-lg)',
                                            background: 'var(--bg-subtle)',
                                            color: 'var(--text-main)'
                                        }}
                                    />
                                </FormField>

                                <div>
                                    <FormField label="Village">
                                        <input
                                            type="text"
                                            value={place}
                                            onChange={(e) => setPlace(e.target.value)}
                                            placeholder="Village Name"
                                            list="village-options"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem 0.875rem',
                                                fontSize: 'var(--text-base)',
                                                border: '1px solid var(--border-light)',
                                                borderRadius: 'var(--radius-lg)',
                                                background: 'var(--bg-subtle)',
                                                color: 'var(--text-main)'
                                            }}
                                        />
                                    </FormField>
                                    <datalist id="village-options">
                                        {allVillages.map((v, i) => <option key={i} value={v} />)}
                                    </datalist>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Work Info */}
                        <div style={{
                            marginBottom: '1.25rem',
                            paddingBottom: '1rem',
                            borderBottom: '1px dashed var(--border-light)'
                        }}>
                            <div style={{
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: 'var(--text-muted)',
                                marginBottom: '0.75rem'
                            }}>
                                Work Details
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '0.75rem',
                                marginBottom: '0.75rem'
                            }}>
                                <FormField label="Crop">
                                    <input
                                        type="text"
                                        value={crop}
                                        onChange={(e) => setCrop(e.target.value)}
                                        placeholder="Paddy, Wheat..."
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 0.875rem',
                                            fontSize: 'var(--text-base)',
                                            border: '1px solid var(--border-light)',
                                            borderRadius: 'var(--radius-lg)',
                                            background: 'var(--bg-subtle)',
                                            color: 'var(--text-main)'
                                        }}
                                    />
                                </FormField>

                                <FormField label="Date">
                                    <input
                                        type="date"
                                        value={jobDate}
                                        onChange={(e) => setJobDate(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 0.875rem',
                                            fontSize: 'var(--text-base)',
                                            border: '1px solid var(--border-light)',
                                            borderRadius: 'var(--radius-lg)',
                                            background: 'var(--bg-subtle)',
                                            color: 'var(--text-main)'
                                        }}
                                    />
                                </FormField>
                            </div>

                            {/* Machine Chips */}
                            <FormField label="Machine" hint="Select harvester used">
                                <MachineChips
                                    machines={machines}
                                    selected={selectedMachine}
                                    onSelect={setSelectedMachine}
                                />
                            </FormField>
                        </div>

                        {/* Section 3: Billing */}
                        <div style={{
                            background: 'var(--bg-subtle)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1rem',
                            marginBottom: '1rem',
                            border: '1px solid var(--border-light)'
                        }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1.2fr',
                                gap: '0.75rem',
                                alignItems: 'end'
                            }}>
                                <FormField
                                    label={
                                        <span
                                            onClick={() => setBillingMode(billingMode === 'acre' ? 'hour' : 'acre')}
                                            style={{
                                                borderBottom: '1px dashed var(--text-muted)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {billingMode === 'acre' ? 'Acres' : 'Hours'}
                                        </span>
                                    }
                                    required
                                    error={errors.measurement}
                                >
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="0"
                                        value={measurement}
                                        onChange={(e) => setMeasurement(Number(e.target.value))}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            fontSize: 'var(--text-lg)',
                                            fontWeight: 700,
                                            textAlign: 'center',
                                            border: errors.measurement
                                                ? '2px solid var(--error)'
                                                : '1px solid var(--border-light)',
                                            borderRadius: 'var(--radius-lg)',
                                            background: 'var(--bg-card)',
                                            color: 'var(--text-main)'
                                        }}
                                    />
                                </FormField>

                                <FormField label="Rate (₹)" error={errors.rate}>
                                    <input
                                        type="number"
                                        value={rate}
                                        onChange={(e) => setRate(Number(e.target.value))}
                                        placeholder="0"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 0.875rem',
                                            fontSize: 'var(--text-base)',
                                            border: errors.rate ? '2px solid var(--error)' : '1px solid var(--border-light)',
                                            borderRadius: 'var(--radius-lg)',
                                            background: 'var(--bg-subtle)',
                                            color: 'var(--text-main)'
                                        }}
                                    />
                                </FormField>

                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: '0.75rem',
                                    background: 'linear-gradient(135deg, var(--primary-light), rgba(5, 150, 105, 0.1))',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid rgba(5, 150, 105, 0.2)'
                                }}>
                                    <span style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--primary)',
                                        fontWeight: 500,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        Total
                                    </span>
                                    <span style={{
                                        fontSize: '1.5rem',
                                        fontWeight: 700,
                                        color: 'var(--primary)',
                                        letterSpacing: '-0.02em'
                                    }}>
                                        ₹{total.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Status Toggle */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.5rem',
                            marginBottom: '1rem'
                        }}>
                            <div style={{
                                display: 'flex',
                                background: 'var(--bg-subtle)',
                                padding: '4px',
                                borderRadius: 'var(--radius-lg)',
                                flex: 1,
                                border: '1px solid var(--border-light)'
                            }}>
                                {(['Pending', 'Partial', 'Paid'] as const).map((status) => {
                                    const isActive = paymentType === status;
                                    const colors = {
                                        Pending: { bg: '#FEE2E2', color: '#DC2626' },
                                        Partial: { bg: '#FEF3C7', color: '#D97706' },
                                        Paid: { bg: '#D1FAE5', color: '#059669' }
                                    };
                                    return (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => { playClickHaptic(); setPaymentType(status); }}
                                            style={{
                                                flex: 1,
                                                padding: '0.5rem',
                                                fontSize: 'var(--text-xs)',
                                                fontWeight: 600,
                                                borderRadius: 'var(--radius-md)',
                                                border: 'none',
                                                background: isActive ? colors[status].bg : 'transparent',
                                                color: isActive ? colors[status].color : 'var(--text-muted)',
                                                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                                transition: 'all 0.2s',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {status}
                                        </button>
                                    );
                                })}
                            </div>

                            {paymentType === 'Partial' && (
                                <div style={{ flex: 0.6, animation: 'fadeIn 0.2s' }}>
                                    <input
                                        type="number"
                                        placeholder="Paid ₹"
                                        value={paidAmount}
                                        onChange={e => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem 0.75rem',
                                            fontSize: 'var(--text-sm)',
                                            fontWeight: 600,
                                            border: '1px solid var(--border-light)',
                                            borderRadius: 'var(--radius-md)',
                                            background: 'var(--bg-card)',
                                            color: 'var(--text-main)'
                                        }}
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>

                        {/* Submit Buttons */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '0.75rem',
                            paddingTop: '0.75rem',
                            borderTop: '1px solid var(--border-light)'
                        }}>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                style={{
                                    padding: '0.625rem 1.25rem',
                                    fontSize: 'var(--text-sm)',
                                    fontWeight: 500,
                                    background: 'var(--bg-subtle)',
                                    color: 'var(--text-secondary)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                style={{
                                    padding: '0.625rem 2rem',
                                    fontSize: 'var(--text-sm)',
                                    fontWeight: 600,
                                    background: 'linear-gradient(135deg, var(--primary), #059669)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: isSaving ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                                    opacity: isSaving ? 0.7 : 1,
                                    transition: 'all var(--transition-fast)'
                                }}
                            >
                                {isSaving ? (
                                    <Loader2 className="animate-spin" size={16} />
                                ) : (
                                    <Check size={16} />
                                )}
                                Save Entry
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
            }}>
                <h3 style={{
                    margin: 0,
                    fontSize: 'var(--text-base)',
                    fontWeight: 600,
                    color: 'var(--text-main)'
                }}>
                    Recent Records
                </h3>
                <button
                    onClick={() => { playClickHaptic(); setShowHistory(true); }}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                    }}
                >
                    View all <ChevronRight size={16} />
                </button>
            </div>

            {
                loadingJobs ? (
                    <div style={{ display: 'grid', gap: '1rem', width: '100%' }}>
                        {Array(3).fill(0).map((_, i) => (
                            <div key={i} className="card" style={{ padding: '1rem', width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <Skeleton width={44} height={44} borderRadius={12} />
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <Skeleton width={120} height={18} />
                                            <Skeleton width={80} height={14} />
                                        </div>
                                    </div>
                                    <Skeleton width={60} height={24} borderRadius={20} />
                                </div>
                                <Skeleton width="100%" height={60} borderRadius={8} style={{ marginTop: '0.5rem' }} />
                            </div>
                        ))}
                    </div>
                ) : recentJobs.length === 0 ? (
                    <div style={{
                        padding: '3rem',
                        textAlign: 'center',
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-xl)',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--primary-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '0.5rem'
                        }}>
                            <Users size={32} style={{ color: 'var(--primary)' }} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                                No harvest records yet
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                                Start by adding your first job entry
                            </p>
                        </div>
                        <button
                            onClick={() => { playClickHaptic(); setShowForm(true); }}
                            className="btn-primary"
                            style={{
                                marginTop: '0.5rem',
                                padding: '0.75rem 1.5rem',
                                borderRadius: 'var(--radius-full)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: 'var(--shadow-primary)'
                            }}
                        >
                            <Plus size={18} />
                            Add First Job
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                        {(() => {
                            const groups: Record<string, any[]> = {};
                            recentJobs.forEach(job => {
                                const d = new Date(job.date);
                                const today = new Date();
                                const yesterday = new Date();
                                yesterday.setDate(yesterday.getDate() - 1);

                                let key = 'Older';
                                if (d.toDateString() === today.toDateString()) key = 'Today';
                                else if (d.toDateString() === yesterday.toDateString()) key = 'Yesterday';
                                else if (d > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) key = 'This Week';

                                if (!groups[key]) groups[key] = [];
                                groups[key].push(job);
                            });

                            return ['Today', 'Yesterday', 'This Week', 'Older'].map(group => {
                                if (!groups[group]) return null;
                                return (
                                    <div key={group} className="animate-fade-in">
                                        <h4 style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            color: 'var(--text-muted)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            marginBottom: '0.75rem',
                                            paddingLeft: '0.25rem'
                                        }}>
                                            {group}
                                        </h4>
                                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                                            {groups[group].map(job => (
                                                <div key={job.id} style={{ width: '100%' }}>
                                                    <JobCard
                                                        job={job}
                                                        onShare={(j) => handleShare(j)}
                                                        onEdit={(j) => { playClickHaptic(); setEditJob(j); }}
                                                        onDelete={(id) => handleDelete(id)}
                                                        onPay={(j) => { playClickHaptic(); setSelectedJob(j); }}
                                                        onCall={(m) => handleCall(m)}
                                                        onReceipt={(j) => { playClickHaptic(); setSelectedReceiptJob(j); }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
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
        </div>
    );
};

export default FarmersPage;
