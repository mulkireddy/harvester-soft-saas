import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, MapPin, Calendar, Sprout, Hash, Clock, DollarSign, Loader2 } from 'lucide-react';
import '../mobile.css';
import { supabase } from '../supabase';

interface EditJobModalProps {
    job: any;
    onClose: () => void;
    onSuccess: () => void;
    machines: any[];
}

const EditJobModal: React.FC<EditJobModalProps> = ({ job, onClose, onSuccess, machines }) => {
    const [isSaving, setIsSaving] = useState(false);

    // Farmer State
    const [farmerName, setFarmerName] = useState(job.farmers?.name || '');
    const [farmerMobile, setFarmerMobile] = useState(job.farmers?.mobile || '');
    const [farmerPlace, setFarmerPlace] = useState(job.farmers?.place || '');

    // Job State
    const [date, setDate] = useState(new Date(job.date).toISOString().split('T')[0]);
    const [machineId, setMachineId] = useState(job.machine_id || '');
    const [crop, setCrop] = useState(job.crop || '');
    const [billingMode, setBillingMode] = useState<'acre' | 'hour'>(job.billing_mode || 'acre');
    const [quantity, setQuantity] = useState<number>(job.quantity || 0);
    const [rate, setRate] = useState<number>(job.rate || 0);

    const [total, setTotal] = useState<number>(job.total_amount || 0);

    // Auto-calculate Total
    useEffect(() => {
        setTotal(quantity * rate);
    }, [quantity, rate]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // 1. Update Farmer
            const { error: farmerError } = await supabase
                .from('farmers')
                .update({
                    name: farmerName,
                    mobile: farmerMobile,
                    place: farmerPlace
                })
                .eq('id', job.farmer_id);

            if (farmerError) throw farmerError;

            // 2. Update Job
            // Calculate new status based on existing paid_amount
            const paid = job.paid_amount || 0;
            const balance = total - paid;
            let newStatus = 'Pending';
            if (balance <= 0 && total > 0) newStatus = 'Paid';
            else if (paid > 0) newStatus = 'Partial';

            const { error: jobError } = await supabase
                .from('jobs')
                .update({
                    date: new Date(date).toISOString(),
                    machine_id: machineId || null,
                    crop,
                    billing_mode: billingMode,
                    quantity,
                    rate,
                    total_amount: total,
                    status: newStatus
                })
                .eq('id', job.id);

            if (jobError) throw jobError;

            onSuccess();
            onClose();

        } catch (error: any) {
            console.error('Error updating record:', error);
            alert('Error updating: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div className="card modal-content" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '0' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Edit Record</h2>
                    <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}><X size={24} /></button>
                </div>

                <div style={{ padding: '1.5rem' }}>

                    {/* Section 1: Farmer Details */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '1rem' }}>Farmer Details</h3>
                        <div className="grid-responsive grid-2" style={{ gap: '1rem' }}>
                            <div className="input-group">
                                <label className="label">Name</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-secondary)' }} />
                                    <input className="input" style={{ paddingLeft: '2.2rem' }} value={farmerName} onChange={e => setFarmerName(e.target.value)} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="label">Mobile</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-secondary)' }} />
                                    <input className="input" style={{ paddingLeft: '2.2rem' }} value={farmerMobile} onChange={e => setFarmerMobile(e.target.value)} />
                                </div>
                            </div>
                            <div className="input-group col-span-2">
                                <label className="label">Place / Village</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-secondary)' }} />
                                    <input className="input" style={{ paddingLeft: '2.2rem' }} value={farmerPlace} onChange={e => setFarmerPlace(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '1.5rem 0' }} />

                    {/* Section 2: Job Details */}
                    <div>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--secondary)', textTransform: 'uppercase', marginBottom: '1rem' }}>Job Details</h3>

                        <div className="grid-responsive grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                            <div className="input-group">
                                <label className="label">Date</label>
                                <div style={{ position: 'relative' }}>
                                    <Calendar size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-secondary)' }} />
                                    <input type="date" className="input" style={{ paddingLeft: '2.2rem' }} value={date} onChange={e => setDate(e.target.value)} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="label">Machine</label>
                                <select className="input" value={machineId} onChange={e => setMachineId(e.target.value)} style={{ width: '100%', background: 'white' }}>
                                    <option value="">Select Machine</option>
                                    {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid-responsive grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                            <div className="input-group">
                                <label className="label">Crop</label>
                                <div style={{ position: 'relative' }}>
                                    <Sprout size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-secondary)' }} />
                                    <input className="input" style={{ paddingLeft: '2.2rem' }} value={crop} onChange={e => setCrop(e.target.value)} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="label">Billing Mode</label>
                                <select className="input" value={billingMode} onChange={e => setBillingMode(e.target.value as 'acre' | 'hour')} style={{ width: '100%', background: 'white' }}>
                                    <option value="acre">Per Acre</option>
                                    <option value="hour">Hourly</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid-responsive grid-3" style={{ gap: '1rem', alignItems: 'end' }}>
                            <div className="input-group">
                                <label className="label">{billingMode === 'acre' ? 'Acres' : 'Hours'}</label>
                                <div style={{ position: 'relative' }}>
                                    {billingMode === 'acre' ?
                                        <Hash size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-secondary)' }} /> :
                                        <Clock size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-secondary)' }} />
                                    }
                                    <input type="number" step="0.1" className="input" style={{ paddingLeft: '2.2rem' }} value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="label">Rate</label>
                                <div style={{ position: 'relative' }}>
                                    <DollarSign size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-secondary)' }} />
                                    <input type="number" className="input" style={{ paddingLeft: '2.2rem' }} value={rate} onChange={e => setRate(Number(e.target.value))} />
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', paddingBottom: '0.5rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>₹{total.toLocaleString()}</div>
                            </div>
                        </div>


                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '1.5rem 0' }} />

                    {/* Section 3: Payment History */}
                    <div>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Payment History</span>
                            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Paid: ₹{job.paid_amount || 0}</span>
                        </h3>

                        {job.payments && job.payments.length > 0 ? (
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                {job.payments.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((p: any) => (
                                    <div key={p.id} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '0.75rem', background: '#F9FAFB', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ background: '#DCFCE7', color: '#166534', padding: '4px', borderRadius: '50%' }}>
                                                <DollarSign size={14} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>₹ {p.amount.toLocaleString()}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.method} • {new Date(p.date).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No payments recorded yet.</p>
                        )}
                    </div>
                </div>

                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#F9FAFB', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
                    <button onClick={onClose} className="btn btn-secondary">Cancel</button>
                    <button onClick={handleSave} className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} style={{ marginRight: '8px' }} /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditJobModal;
