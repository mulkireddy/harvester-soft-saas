
import React, { useState, useEffect } from 'react';
import { Droplet, Wrench, User, Coffee, CreditCard, Trash2, Loader2, Download, Landmark, Edit, X, Plus } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { supabase } from '../lib/supabase';
import { playSuccessHaptic, playErrorHaptic, playClickHaptic } from '../lib/ui-utils';
import EditExpenseModal from '../components/modals/EditExpenseModal';
import ExpenseHistoryModal from '../components/modals/ExpenseHistoryModal';
import toast from 'react-hot-toast';

const CATEGORIES = [
    { id: 'Fuel', label: 'Diesel / Fuel', icon: Droplet, color: '#FEE2E2', textColor: '#991B1B' },
    { id: 'Spares & Repairs', label: 'Spares & Repairs', icon: Wrench, color: '#FEF3C7', textColor: '#92400E' },
    { id: 'Driver Salary', label: 'Driver Salary', icon: User, color: '#DBEAFE', textColor: '#1E40AF' },
    { id: 'Food', label: 'Food & Allowance', icon: Coffee, color: '#D1FAE5', textColor: '#065F46' },
    { id: 'EMI', label: 'Machine EMI', icon: Landmark, color: '#E0E7FF', textColor: '#4338CA' },
    { id: 'Other', label: 'Other Expenses', icon: CreditCard, color: '#F3F4F6', textColor: '#374151' }
];

const ExpensesPage: React.FC = () => {
    const [showForm, setShowForm] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [amount, setAmount] = useState<string>('');
    const [category, setCategory] = useState<string>('Fuel');
    const [description, setDescription] = useState<string>('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editExpense, setEditExpense] = useState<any>(null);

    // Machines
    const [machines, setMachines] = useState<any[]>([]);
    const [selectedMachine, setSelectedMachine] = useState<string>('');

    useEffect(() => {
        fetchExpenses();
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
            .select(`*, machines (name)`)
            .order('date', { ascending: false })
            .limit(20);

        if (data) setRecentExpenses(data);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        playClickHaptic();
        if (!amount) {
            playErrorHaptic();
            return;
        }

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

            playSuccessHaptic();
            toast.success('Expense Saved');

            // Reset & Refresh
            setAmount('');
            setDescription('');
            fetchExpenses();
            setShowForm(false); // Close form after save

        } catch (err) {
            playErrorHaptic();
            console.error(err);
            toast.error('Error saving expense');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        playClickHaptic();

        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (!error) {
            playSuccessHaptic();
            toast.success('Expense Deleted');
            fetchExpenses();
        } else {
            playErrorHaptic();
            toast.error('Error deleting expense');
        }
    };

    const handleExport = () => {
        playClickHaptic();
        if (!recentExpenses.length) return toast.error('No data to export');

        const headers = ['Date', 'Category', 'Description', 'Machine', 'Amount'];
        const csvContent = [
            headers.join(','),
            ...recentExpenses.map(e => [
                new Date(e.date).toLocaleDateString(),
                `"${e.category}"`,
                `"${e.description || ''}"`,
                e.machines?.name || '',
                e.amount
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', fontWeight: 700 }}>Expenses</h1>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Track spending & costs.</p>
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

            {/* Entry Form */}
            {showForm && (
                <div className="card" style={{ marginBottom: '2rem', animation: 'fadeIn 0.2s ease-out' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        New Expense
                        <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-secondary)' }}><X size={20} /></button>
                    </h2>

                    <form onSubmit={handleSave}>
                        {/* Category Selection */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => { playClickHaptic(); setCategory(cat.id); }}
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

                        {/* Amount & Machine */}
                        <div className="grid-responsive grid-2" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="label" style={{ fontSize: '0.75rem' }}>Amount</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    className="input input-compact"
                                    style={{ fontSize: '1.1rem', fontWeight: 700 }}
                                    autoFocus
                                />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="label" style={{ fontSize: '0.75rem' }}>Machine (Optional)</label>
                                <select
                                    className="input input-compact"
                                    value={selectedMachine}
                                    onChange={(e) => setSelectedMachine(e.target.value)}
                                >
                                    <option value="">General / All</option>
                                    {machines.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Date & Note */}
                        <div className="grid-responsive grid-2" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="label" style={{ fontSize: '0.75rem' }}>Date</label>
                                <input
                                    type="date"
                                    className="input input-compact"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="label" style={{ fontSize: '0.75rem' }}>Note</label>
                                <input
                                    type="text"
                                    className="input input-compact"
                                    placeholder="Description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary btn-sm" style={{ border: 'none' }}>Cancel</button>
                            <button
                                type="submit"
                                className="btn btn-primary btn-sm"
                                style={{ padding: '0.5rem 2rem', fontSize: '0.9rem' }}
                                disabled={isSaving || !amount}
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Save Expense'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Expenses List */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', whiteSpace: 'nowrap' }}>Recent History</h3>
                <button
                    className="btn btn-secondary"
                    onClick={() => { playClickHaptic(); setShowHistory(true); }}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', height: 'auto', whiteSpace: 'nowrap' }}
                >
                    View All
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <Skeleton width={40} height={40} borderRadius={10} />
                            <div style={{ flex: 1 }}>
                                <Skeleton width="40%" height={16} style={{ marginBottom: '4px' }} />
                                <Skeleton width="30%" height={12} />
                            </div>
                            <Skeleton width={60} height={20} />
                        </div>
                    ))}
                </div>
            ) : recentExpenses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <p>No expenses recorded yet.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {recentExpenses.map(expense => {
                        const CategoryData = CATEGORIES.find(c => c.id === expense.category) || CATEGORIES[5];
                        const Icon = CategoryData.icon;

                        return (
                            <div key={expense.id} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                <div style={{
                                    width: '40px', height: '40px',
                                    borderRadius: '10px',
                                    backgroundColor: CategoryData.color,
                                    color: CategoryData.textColor,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Icon size={20} />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#1F2937', marginBottom: '2px' }}>{expense.category}</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        <span>{new Date(expense.date).toLocaleDateString()}</span>
                                        {expense.machines?.name && (
                                            <>
                                                <span>•</span>
                                                <span style={{
                                                    background: '#EFF6FF', color: '#1E40AF', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600
                                                }}>
                                                    {expense.machines.name}
                                                </span>
                                            </>
                                        )}
                                        {expense.description && (
                                            <>
                                                <span className="hide-on-mobile">•</span>
                                                <span style={{ fontStyle: 'italic' }}>{expense.description}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#DC2626' }}>
                                        - ₹{expense.amount.toLocaleString()}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => { playClickHaptic(); setEditExpense(expense); }}
                                            style={{ padding: '4px', background: '#EFF6FF', color: '#3B82F6', borderRadius: '4px', border: 'none' }}
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(expense.id)}
                                            style={{ padding: '4px', background: '#FEF2F2', color: '#EF4444', borderRadius: '4px', border: 'none' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {editExpense && (
                <EditExpenseModal
                    expense={editExpense}
                    machines={machines}
                    categories={CATEGORIES}
                    onClose={() => setEditExpense(null)}
                    onSuccess={() => {
                        playSuccessHaptic();
                        toast.success('Expense Updated');
                        fetchExpenses();
                    }}
                />
            )}

            {showHistory && (
                <ExpenseHistoryModal
                    onClose={() => setShowHistory(false)}
                    onEdit={(e) => { playClickHaptic(); setEditExpense(e); setShowHistory(false); }}
                    onDelete={handleDelete}
                    categories={CATEGORIES}
                />
            )}
        </div>
    );
};

export default ExpensesPage;

