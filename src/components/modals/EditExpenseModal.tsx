import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EditExpenseModalProps {
    expense: any;
    machines: any[];
    onClose: () => void;
    onSuccess: () => void;
    categories: any[];
}

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({ expense, machines, onClose, onSuccess, categories }) => {
    const [amount, setAmount] = useState<string>(expense.amount.toString());
    const [category, setCategory] = useState<string>(expense.category);
    const [description, setDescription] = useState<string>(expense.description || '');
    const [date, setDate] = useState<string>(expense.date || new Date().toISOString().split('T')[0]);
    const [selectedMachine, setSelectedMachine] = useState<string>(expense.machine_id || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('expenses')
                .update({
                    amount: Number(amount),
                    category,
                    description,
                    date,
                    machine_id: selectedMachine || null
                })
                .eq('id', expense.id);

            if (error) throw error;
            onSuccess();
            onClose();
        } catch (error: any) {
            alert('Error updating expense: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', position: 'relative' }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                    <X size={24} />
                </button>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Edit Expense</h2>

                <form onSubmit={handleSave}>
                    {/* Categories */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setCategory(cat.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 500,
                                    border: category === cat.id ? `2px solid ${cat.textColor}` : '1px solid var(--border-light)',
                                    backgroundColor: category === cat.id ? 'white' : 'var(--bg-main)',
                                    color: category === cat.id ? cat.textColor : 'var(--text-secondary)',
                                }}
                            >
                                <cat.icon size={14} />
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    <div className="input-group">
                        <label className="label">Amount</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="input"
                            style={{ fontSize: '1.25rem', fontWeight: 700 }}
                            autoFocus
                        />
                    </div>

                    <div className="input-group">
                        <label className="label">Machine</label>
                        <select
                            className="input"
                            value={selectedMachine}
                            onChange={(e) => setSelectedMachine(e.target.value)}
                        >
                            <option value="">General / All</option>
                            {machines.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="label">Date</label>
                        <input
                            type="date"
                            className="input"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label className="label">Note</label>
                        <input
                            type="text"
                            className="input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSaving}>
                            {isSaving ? <Loader2 className="animate-spin" /> : 'Update Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditExpenseModal;
