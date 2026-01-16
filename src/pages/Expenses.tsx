
import React, { useState, useEffect } from 'react';
import { Droplet, Wrench, User, Coffee, CreditCard, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

const CATEGORIES = [
    { id: 'Fuel', label: 'Diesel / Fuel', icon: Droplet, color: '#FEE2E2', textColor: '#991B1B' },
    { id: 'Spares & Repairs', label: 'Spares & Repairs', icon: Wrench, color: '#FEF3C7', textColor: '#92400E' },
    { id: 'Driver Salary', label: 'Driver Salary', icon: User, color: '#DBEAFE', textColor: '#1E40AF' },
    { id: 'Food', label: 'Food & Allowance', icon: Coffee, color: '#D1FAE5', textColor: '#065F46' },
    { id: 'Other', label: 'Other Expenses', icon: CreditCard, color: '#F3F4F6', textColor: '#374151' }
];

const ExpensesPage: React.FC = () => {
    const [amount, setAmount] = useState<string>('');
    const [category, setCategory] = useState<string>('Fuel');
    const [description, setDescription] = useState<string>('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Machines
    const [machines, setMachines] = useState<any[]>([]);
    const [selectedMachine, setSelectedMachine] = useState<string>('');

    useEffect(() => {
        fetchExpenses();
    }, []);

    useEffect(() => {
        fetchMachines();
    }, []);

    const fetchMachines = async () => {
        const { data } = await supabase.from('machines').select('*').order('name');
        if (data) setMachines(data);
    };

    const fetchExpenses = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('expenses')
            .select(`
                *,
                machines (name)
            `)
            .order('date', { ascending: false })
            .limit(20);

        if (data) setRecentExpenses(data);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('expenses')
                .insert([{
                    amount: Number(amount),
                    category,
                    description,
                    date,
                    machine_id: selectedMachine || null
                }]);

            if (error) throw error;

            // Reset & Refresh
            setAmount('');
            setDescription('');
            fetchExpenses();

        } catch (err) {
            console.error(err);
            alert('Error saving expense');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;

        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (!error) fetchExpenses();
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Expenses</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Track your daily spending to calculate net profit.</p>
            </header>

            {/* Entry Form */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <form onSubmit={handleSave}>
                    {/* Category Selection (Visual Pills) */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setCategory(cat.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '20px',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    border: category === cat.id ? `2px solid ${cat.textColor}` : '1px solid transparent',
                                    backgroundColor: category === cat.id ? 'white' : cat.color,
                                    color: cat.textColor,
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }}
                            >
                                <cat.icon size={16} />
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Machine Select (Optional) */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="label" style={{ marginBottom: '0.5rem', display: 'block' }}>Which Machine? (Optional)</label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={() => setSelectedMachine('')}
                                style={{
                                    padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.85rem',
                                    border: !selectedMachine ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                                    background: !selectedMachine ? 'var(--bg-main)' : 'white',
                                    color: !selectedMachine ? 'var(--primary)' : 'var(--text-secondary)'
                                }}
                            >
                                General / All
                            </button>
                            {machines.map(m => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setSelectedMachine(m.id)}
                                    style={{
                                        padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.85rem',
                                        border: selectedMachine === m.id ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                                        background: selectedMachine === m.id ? 'var(--bg-main)' : 'white',
                                        color: selectedMachine === m.id ? 'var(--primary)' : 'var(--text-secondary)'
                                    }}
                                >
                                    {m.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="label">Amount</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>₹</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                className="input"
                                style={{ paddingLeft: '3rem', fontSize: '2rem', fontWeight: 700, height: 'auto', padding: '1rem 1rem 1rem 3rem' }}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="grid-responsive grid-2" style={{ gap: '1rem', marginTop: '1.5rem' }}>
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
                            <label className="label">Note (Optional)</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g. 50 Liters @ 92"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', fontSize: '1rem' }}
                        disabled={isSaving || !amount}
                    >
                        {isSaving ? <Loader2 className="animate-spin" /> : 'Add Expense'}
                    </button>
                </form>
            </div>

            {/* Recent Expenses List */}
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                Recent History
                <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-secondary)' }}>Last 20 records</span>
            </h3>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}><Loader2 className="animate-spin" /></div>
            ) : recentExpenses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: '#F9FAFB', borderRadius: '12px' }}>
                    <p>No expenses recorded yet.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {recentExpenses.map(expense => {
                        const CategoryData = CATEGORIES.find(c => c.id === expense.category) || CATEGORIES[4];
                        const Icon = CategoryData.icon;

                        return (
                            <div key={expense.id} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '48px', height: '48px',
                                    borderRadius: '12px',
                                    backgroundColor: CategoryData.color,
                                    color: CategoryData.textColor,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Icon size={24} />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#1F2937' }}>{expense.category}</h4>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {expense.machines?.name && (
                                            <span style={{
                                                background: '#EFF6FF', color: '#1E40AF', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600
                                            }}>
                                                {expense.machines.name}
                                            </span>
                                        )}
                                        <span>{new Date(expense.date).toLocaleDateString()}</span>
                                        {expense.description && (
                                            <>
                                                <span>•</span>
                                                <span>{expense.description}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#DC2626' }}>
                                        - ₹{expense.amount.toLocaleString()}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(expense.id)}
                                        style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}
                                    >
                                        <Trash2 size={12} /> Remove
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ExpensesPage;
