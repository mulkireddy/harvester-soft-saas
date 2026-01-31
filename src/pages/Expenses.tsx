import React, { useState, useEffect } from 'react';
import { Droplet, Wrench, User, Coffee, CreditCard, Trash2, Loader2, Download, Landmark, Edit, X, Plus, ChevronRight, Receipt, Check, Calendar, TrendingDown } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { supabase } from '../lib/supabase';
import { playSuccessHaptic, playErrorHaptic, playClickHaptic } from '../lib/ui-utils';
import EditExpenseModal from '../components/modals/EditExpenseModal';
import ExpenseHistoryModal from '../components/modals/ExpenseHistoryModal';
import toast from 'react-hot-toast';

const CATEGORIES = [
    { id: 'Fuel', label: 'Diesel / Fuel', shortLabel: 'Fuel', icon: Droplet, color: '#FEE2E2', textColor: '#DC2626' },
    { id: 'Spares & Repairs', label: 'Spares & Repairs', shortLabel: 'Repairs', icon: Wrench, color: '#FEF3C7', textColor: '#D97706' },
    { id: 'Driver Salary', label: 'Driver Salary', shortLabel: 'Salary', icon: User, color: '#DBEAFE', textColor: '#2563EB' },
    { id: 'Food', label: 'Food & Allowance', shortLabel: 'Food', icon: Coffee, color: '#D1FAE5', textColor: '#059669' },
    { id: 'EMI', label: 'Machine EMI', shortLabel: 'EMI', icon: Landmark, color: '#E0E7FF', textColor: '#4F46E5' },
    { id: 'Other', label: 'Other Expenses', shortLabel: 'Other', icon: CreditCard, color: '#F3F4F6', textColor: '#6B7280' }
];

// Category Grid Selector Component
const CategoryGridSelector: React.FC<{
    selected: string;
    onSelect: (id: string) => void;
}> = ({ selected, onSelect }) => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.75rem',
        marginBottom: '1.25rem'
    }}>
        {CATEGORIES.map(cat => {
            const isSelected = selected === cat.id;
            const Icon = cat.icon;

            return (
                <button
                    key={cat.id}
                    type="button"
                    onClick={() => { playClickHaptic(); onSelect(cat.id); }}
                    style={{
                        width: '100%',
                        height: '80px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-xl)',
                        border: isSelected
                            ? `2px solid ${cat.textColor}`
                            : '1px solid var(--border-light)',
                        backgroundColor: isSelected ? cat.color : 'var(--bg-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                    }}
                >
                    {/* Checkmark for selected state */}
                    {isSelected && (
                        <div style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: cat.textColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Check size={11} style={{ color: 'white' }} />
                        </div>
                    )}

                    {/* Icon */}
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-lg)',
                        background: isSelected ? 'white' : cat.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: cat.textColor,
                        boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                    }}>
                        <Icon size={18} />
                    </div>

                    {/* Label */}
                    <span style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? cat.textColor : 'var(--text-secondary)',
                        textAlign: 'center',
                        lineHeight: 1.2
                    }}>
                        {cat.shortLabel}
                    </span>
                </button>
            );
        })}
    </div>
);

// Monthly Summary Card Component
const MonthlySummaryCard: React.FC<{
    expenses: any[];
}> = ({ expenses }) => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const thisMonthTotal = expenses
        .filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        })
        .reduce((sum, e) => sum + (e.amount || 0), 0);

    const lastMonthTotal = expenses
        .filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        })
        .reduce((sum, e) => sum + (e.amount || 0), 0);

    const percentChange = lastMonthTotal > 0
        ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
        : 0;

    const isUp = percentChange > 0;

    // Get top category this month
    const categoryTotals: Record<string, number> = {};
    expenses
        .filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        })
        .forEach(e => {
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
        });

    const topCategory = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])[0];

    const topCatData = CATEGORIES.find(c => c.id === topCategory?.[0]);

    return (
        <div style={{
            background: 'linear-gradient(135deg, var(--bg-card), var(--bg-subtle))',
            borderRadius: 'var(--radius-xl)',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-card)'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
            }}>
                <div>
                    <div style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)',
                        fontWeight: 500,
                        marginBottom: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem'
                    }}>
                        <Calendar size={12} />
                        {now.toLocaleString('default', { month: 'long' })} Expenses
                    </div>
                    <div style={{
                        fontSize: 'var(--text-2xl)',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        letterSpacing: '-0.02em'
                    }}>
                        ₹{thisMonthTotal.toLocaleString('en-IN')}
                    </div>
                </div>

                {lastMonthTotal > 0 && (
                    <div style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        background: isUp ? 'var(--error-light)' : 'var(--success-light)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                    }}>
                        <TrendingDown
                            size={14}
                            style={{
                                color: isUp ? 'var(--error)' : 'var(--success)',
                                transform: isUp ? 'rotate(180deg)' : 'none'
                            }}
                        />
                        <span style={{
                            fontSize: 'var(--text-xs)',
                            fontWeight: 600,
                            color: isUp ? 'var(--error)' : 'var(--success)'
                        }}>
                            {Math.abs(percentChange).toFixed(0)}%
                        </span>
                    </div>
                )}
            </div>

            {/* Stats Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem'
            }}>
                {/* Last Month Comparison */}
                <div style={{
                    padding: '0.75rem',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-light)'
                }}>
                    <div style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.25rem'
                    }}>
                        Last Month
                    </div>
                    <div style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 600,
                        color: 'var(--text-secondary)'
                    }}>
                        ₹{lastMonthTotal.toLocaleString('en-IN')}
                    </div>
                </div>

                {/* Top Category */}
                {topCatData && (
                    <div style={{
                        padding: '0.75rem',
                        background: topCatData.color,
                        borderRadius: 'var(--radius-lg)',
                        border: `1px solid ${topCatData.textColor}20`
                    }}>
                        <div style={{
                            fontSize: '0.65rem',
                            color: topCatData.textColor,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '0.25rem',
                            opacity: 0.8
                        }}>
                            Top Category
                        </div>
                        <div style={{
                            fontSize: 'var(--text-sm)',
                            fontWeight: 600,
                            color: topCatData.textColor,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem'
                        }}>
                            <topCatData.icon size={14} />
                            {topCatData.shortLabel}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ExpensesPage: React.FC = () => {
    const [showForm, setShowForm] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [amount, setAmount] = useState<string>('');
    const [category, setCategory] = useState<string>('Fuel');
    const [description, setDescription] = useState<string>('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
    const [allExpenses, setAllExpenses] = useState<any[]>([]);
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

        // Fetch recent for list
        const { data: recent } = await supabase
            .from('expenses')
            .select(`*, machines (name)`)
            .order('date', { ascending: false })
            .limit(20);

        // Fetch all for monthly summary (last 60 days)
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 60);
        const { data: all } = await supabase
            .from('expenses')
            .select('amount, date, category')
            .gte('date', cutoff.toISOString().split('T')[0]);

        if (recent) setRecentExpenses(recent);
        if (all) setAllExpenses(all);
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
            setShowForm(false);

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
        <div className="animate-fade-in" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <header style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{
                            fontSize: 'var(--text-xl)',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            marginBottom: '0.375rem',
                            letterSpacing: '-0.02em'
                        }}>
                            Expenses
                        </h1>
                        <p style={{
                            fontSize: 'var(--text-sm)',
                            color: 'var(--text-muted)'
                        }}>
                            Track spending & costs
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
            </header>

            {/* Monthly Summary Card */}
            {!loading && allExpenses.length > 0 && (
                <MonthlySummaryCard expenses={allExpenses} />
            )}

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

            {/* Entry Form */}
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
                        <h2 style={{
                            fontSize: 'var(--text-base)',
                            fontWeight: 600,
                            color: 'var(--text-main)'
                        }}>
                            New Expense
                        </h2>
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

                    <form onSubmit={handleSave}>
                        {/* 2x3 Category Grid Selection */}
                        <CategoryGridSelector
                            selected={category}
                            onSelect={setCategory}
                        />

                        {/* Amount & Machine */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '0.75rem',
                            marginBottom: '0.75rem'
                        }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: 'var(--text-xs)',
                                    fontWeight: 500,
                                    color: 'var(--text-muted)',
                                    marginBottom: '0.375rem'
                                }}>
                                    Amount
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    autoFocus
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 0.875rem',
                                        fontSize: '1.25rem',
                                        fontWeight: 700,
                                        border: '2px solid var(--border-light)',
                                        borderRadius: 'var(--radius-lg)',
                                        background: 'var(--bg-subtle)',
                                        color: 'var(--text-main)',
                                        transition: 'all var(--transition-fast)'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: 'var(--text-xs)',
                                    fontWeight: 500,
                                    color: 'var(--text-muted)',
                                    marginBottom: '0.375rem'
                                }}>
                                    Machine (Optional)
                                </label>
                                <select
                                    value={selectedMachine}
                                    onChange={(e) => setSelectedMachine(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 0.875rem',
                                        fontSize: 'var(--text-sm)',
                                        border: '1px solid var(--border-light)',
                                        borderRadius: 'var(--radius-lg)',
                                        background: 'var(--bg-subtle)',
                                        color: 'var(--text-main)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">General / All</option>
                                    {machines.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Date & Note */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '0.75rem',
                            marginBottom: '1.25rem'
                        }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: 'var(--text-xs)',
                                    fontWeight: 500,
                                    color: 'var(--text-muted)',
                                    marginBottom: '0.375rem'
                                }}>
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem 0.875rem',
                                        fontSize: 'var(--text-sm)',
                                        border: '1px solid var(--border-light)',
                                        borderRadius: 'var(--radius-lg)',
                                        background: 'var(--bg-subtle)',
                                        color: 'var(--text-main)'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: 'var(--text-xs)',
                                    fontWeight: 500,
                                    color: 'var(--text-muted)',
                                    marginBottom: '0.375rem'
                                }}>
                                    Note
                                </label>
                                <input
                                    type="text"
                                    placeholder="Description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem 0.875rem',
                                        fontSize: 'var(--text-sm)',
                                        border: '1px solid var(--border-light)',
                                        borderRadius: 'var(--radius-lg)',
                                        background: 'var(--bg-subtle)',
                                        color: 'var(--text-main)'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '0.75rem',
                            paddingTop: '0.875rem',
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
                                disabled={isSaving || !amount}
                                style={{
                                    padding: '0.625rem 1.5rem',
                                    fontSize: 'var(--text-sm)',
                                    fontWeight: 600,
                                    background: !amount ? 'var(--bg-subtle)' : 'linear-gradient(135deg, var(--error), #DC2626)',
                                    color: !amount ? 'var(--text-muted)' : 'white',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: !amount ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all var(--transition-fast)',
                                    boxShadow: amount ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none'
                                }}
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Receipt size={16} />}
                                Save Expense
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Expenses List Header */}
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
                    Recent History
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

            {/* Expenses List */}
            {loading ? (
                <div style={{ display: 'grid', gap: '0.75rem', width: '100%' }}>
                    {Array(3).fill(0).map((_, i) => (
                        <div key={i} style={{
                            background: 'var(--bg-card)',
                            borderRadius: 'var(--radius-xl)',
                            padding: '1rem 1.25rem',
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'center',
                            border: '1px solid var(--border-light)'
                        }}>
                            <Skeleton width={48} height={48} borderRadius={12} />
                            <div style={{ flex: 1 }}>
                                <Skeleton width="40%" height={16} style={{ marginBottom: '6px' }} />
                                <Skeleton width="60%" height={12} />
                            </div>
                            <Skeleton width={70} height={20} />
                        </div>
                    ))}
                </div>
            ) : recentExpenses.length === 0 ? (
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
                        background: 'var(--error-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '0.5rem'
                    }}>
                        <Receipt size={32} style={{ color: 'var(--error)' }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                            No expenses yet
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                            Track your spending by adding an expense
                        </p>
                    </div>
                    <button
                        onClick={() => { playClickHaptic(); setShowForm(true); }}
                        className="btn-primary" // Assuming you might want to add a red variant class or inline style if btn-primary is green
                        style={{
                            marginTop: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            borderRadius: 'var(--radius-full)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'var(--error)',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                            color: 'white',
                            border: 'none',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        <Plus size={18} />
                        Add First Expense
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                    {(() => {
                        const groups: Record<string, any[]> = {};
                        recentExpenses.forEach(expense => {
                            const d = new Date(expense.date);
                            const today = new Date();
                            const yesterday = new Date();
                            yesterday.setDate(yesterday.getDate() - 1);

                            let key = 'Older';
                            if (d.toDateString() === today.toDateString()) key = 'Today';
                            else if (d.toDateString() === yesterday.toDateString()) key = 'Yesterday';
                            else if (d > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) key = 'This Week';

                            if (!groups[key]) groups[key] = [];
                            groups[key].push(expense);
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
                                        {groups[group].map(expense => {
                                            const CategoryData = CATEGORIES.find(c => c.id === expense.category) || CATEGORIES[5];
                                            const Icon = CategoryData.icon;

                                            return (
                                                <div key={expense.id} style={{
                                                    background: 'var(--bg-card)',
                                                    borderRadius: 'var(--radius-xl)',
                                                    padding: '1rem',
                                                    display: 'grid',
                                                    gridTemplateColumns: '48px 1fr auto',
                                                    alignItems: 'center',
                                                    gap: '0.875rem',
                                                    boxShadow: 'var(--shadow-xs)',
                                                    border: '1px solid var(--border-light)',
                                                    transition: 'all var(--transition-fast)'
                                                }}>
                                                    {/* Category Icon */}
                                                    <div style={{
                                                        width: '48px',
                                                        height: '48px',
                                                        borderRadius: 'var(--radius-lg)',
                                                        backgroundColor: CategoryData.color,
                                                        color: CategoryData.textColor,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0
                                                    }}>
                                                        <Icon size={22} />
                                                    </div>

                                                    {/* Content */}
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            marginBottom: '0.25rem'
                                                        }}>
                                                            <h4 style={{
                                                                fontSize: 'var(--text-sm)',
                                                                fontWeight: 600,
                                                                color: 'var(--text-main)',
                                                                margin: 0
                                                            }}>
                                                                {CategoryData.shortLabel}
                                                            </h4>
                                                            {expense.machines?.name && (
                                                                <span style={{
                                                                    background: 'var(--secondary-light)',
                                                                    color: 'var(--secondary)',
                                                                    padding: '0.125rem 0.5rem',
                                                                    borderRadius: 'var(--radius-sm)',
                                                                    fontSize: '0.65rem',
                                                                    fontWeight: 600
                                                                }}>
                                                                    {expense.machines.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            fontSize: 'var(--text-xs)',
                                                            color: 'var(--text-muted)'
                                                        }}>
                                                            <span>
                                                                {new Date(expense.date).toLocaleDateString('en-IN', {
                                                                    day: 'numeric',
                                                                    month: 'short'
                                                                })}
                                                            </span>
                                                            {expense.description && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span style={{
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                        maxWidth: '120px'
                                                                    }}>
                                                                        {expense.description}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Amount & Actions */}
                                                    <div style={{
                                                        textAlign: 'right',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'flex-end',
                                                        gap: '0.375rem'
                                                    }}>
                                                        <div className="font-mono-num" style={{
                                                            fontSize: 'var(--text-base)',
                                                            fontWeight: 700,
                                                            color: 'var(--error)'
                                                        }}>
                                                            -₹{expense.amount.toLocaleString('en-IN')}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                                                            <button
                                                                onClick={() => { playClickHaptic(); setEditExpense(expense); }}
                                                                style={{
                                                                    padding: '0.375rem',
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    background: 'var(--info-light)',
                                                                    color: 'var(--info)',
                                                                    borderRadius: 'var(--radius-md)',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    transition: 'all var(--transition-fast)'
                                                                }}
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(expense.id)}
                                                                style={{
                                                                    padding: '0.375rem',
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    background: 'var(--error-light)',
                                                                    color: 'var(--error)',
                                                                    borderRadius: 'var(--radius-md)',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    transition: 'all var(--transition-fast)'
                                                                }}
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    })()}
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
