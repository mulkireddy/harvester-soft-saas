
import React, { useState } from 'react';
import { X, DollarSign, Loader2, Calendar, CreditCard } from 'lucide-react';
import { supabase } from '../supabase';

interface PaymentModalProps {
    job: any;
    onClose: () => void;
    onSuccess: (result?: { newPaidAmount: number; newStatus: string }) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ job, onClose, onSuccess }) => {
    const [amount, setAmount] = useState<string>('');
    const [method, setMethod] = useState<string>('Cash');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [calculatedPaid, setCalculatedPaid] = useState<number>(0);

    // Fetch Payment History & Calculate Totals
    React.useEffect(() => {
        const fetchHistory = async () => {
            const { data } = await supabase
                .from('payments')
                .select('*')
                .eq('job_id', job.id)
                .order('date', { ascending: false });
            if (data) {
                setHistory(data);
                // Calculate total paid from history to ensure consistency
                const total = data.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                setCalculatedPaid(total);
            }
        };
        fetchHistory();
    }, [job.id]);

    const pendingAmount = job.total_amount - calculatedPaid;

    const handlePayment = async () => {
        // Allow correcting status if already paid, even if amount is 0
        if (!amount && pendingAmount > 0) return;

        setLoading(true);

        try {
            // Only insert payment if there is an amount
            if (amount && Number(amount) > 0) {
                const { error } = await supabase
                    .from('payments')
                    .insert([{
                        job_id: job.id,
                        amount: Number(amount),
                        method: method,
                        date: new Date().toISOString()
                    }]);

                if (error) throw error;
            } else if (!amount && pendingAmount <= 0) {
                // SYNC FIX: Explicitly update the job status in DB
                const { error: updateError } = await supabase
                    .from('jobs')
                    .update({
                        status: 'Paid',
                        paid_amount: calculatedPaid
                    })
                    .eq('id', job.id);

                if (updateError) throw updateError;
            }

            // Calculate new totals to pass back
            const addedAmount = Number(amount) || 0;
            const newTotalPaid = calculatedPaid + addedAmount;
            const isFull = newTotalPaid >= (job.total_amount - 1); // 1 rupee tolerance

            onSuccess({
                newPaidAmount: newTotalPaid,
                newStatus: isFull ? 'Paid' : 'Partial'
            });
            onClose();
        } catch (err) {
            console.error(err);
            alert('Error updating payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(2px)'
        }}>
            <div className="card modal-content" style={{ width: '100%', maxWidth: '450px', padding: '0', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.25rem' }}>Record Payment</h3>
                    <button onClick={onClose}><X size={20} color="var(--text-secondary)" /></button>
                </div>

                <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                    {/* Summary Card */}
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#F3F4F6', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Bill</span>
                            <span style={{ fontWeight: 600 }}>₹ {job.total_amount.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Already Paid</span>
                            <span style={{ fontWeight: 600 }}>₹ {calculatedPaid.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #D1D5DB', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Pending Balance</span>
                            <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.1rem' }}>₹ {pendingAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* New Payment Form */}
                    <div className="input-group">
                        <label className="label">Amount Received Now</label>
                        <div style={{ position: 'relative' }}>
                            <DollarSign size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                            <input
                                type="number"
                                className="input"
                                placeholder={pendingAmount <= 0 ? "Fully Paid" : "Enter amount"}
                                style={{ paddingLeft: '2.5rem', width: '100%' }}
                                max={pendingAmount}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                disabled={pendingAmount <= 0}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="label">Payment Method</label>
                        <select
                            className="input"
                            style={{ width: '100%', background: 'white' }}
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            disabled={pendingAmount <= 0}
                        >
                            <option value="Cash">Cash</option>
                            <option value="Online">Online / UPI</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem' }}
                        onClick={handlePayment}
                        disabled={loading || (!amount && pendingAmount > 0)}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (pendingAmount <= 0 ? 'Mark as Paid / Sync' : 'Confirm Payment')}
                    </button>

                    {/* Payment History List */}
                    {history.length > 0 && (
                        <div style={{ marginTop: '2rem', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
                            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Payment History
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {history.map((pay) => (
                                    <div key={pay.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', padding: '0.75rem', background: '#F9FAFB', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#111827' }}>₹ {pay.amount.toLocaleString()}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                <CreditCard size={12} /> {pay.method}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Calendar size={12} /> {new Date(pay.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
