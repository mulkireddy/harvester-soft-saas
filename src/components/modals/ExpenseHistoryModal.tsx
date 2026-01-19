import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, Trash2, Edit } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ExpenseHistoryModalProps {
    onClose: () => void;
    onEdit: (expense: any) => void;
    onDelete: (id: string) => void;
    categories: any[];
}

const ExpenseHistoryModal: React.FC<ExpenseHistoryModalProps> = ({ onClose, onEdit, onDelete, categories }) => {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchExpenses();
    }, [searchQuery]);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const query = supabase
                .from('expenses')
                .select(`
                    *,
                    machines (name)
                `)
                .order('date', { ascending: false });

            const { data, error } = await query;
            if (error) throw error;

            let result = data || [];

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                result = result.filter((e: any) =>
                    e.category.toLowerCase().includes(q) ||
                    e.description?.toLowerCase().includes(q) ||
                    e.machines?.name?.toLowerCase().includes(q)
                );
            }

            setExpenses(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLocal = (id: string) => {
        onDelete(id);
        setExpenses(prev => prev.filter(e => e.id !== id));
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'var(--bg-main)',
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
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>All Expenses</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>View and search expense history</p>
                </div>
            </div>

            {/* Search Bar */}
            <div style={{ padding: '1rem 1.5rem', background: 'white' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                    <input
                        className="input"
                        placeholder="Search Category, Description, or Machine..."
                        style={{ paddingLeft: '2.5rem', width: '100%' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        <Loader2 className="animate-spin" style={{ margin: '0 auto 1rem' }} />
                        Loading...
                    </div>
                ) : expenses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        No expenses found.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '0.75rem', paddingBottom: '2rem' }}>
                        {expenses.map(expense => {
                            // Fallback to 'Other' if accessing index out of bounds is risky, but we pass categories prop.
                            // Actually better to iterate.
                            const safeCat = categories.find(c => c.id === expense.category) || { icon: Search, color: '#eee', textColor: '#333' };
                            const Icon = safeCat.icon;

                            return (
                                <div key={expense.id} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                    <div style={{
                                        width: '40px', height: '40px',
                                        borderRadius: '10px',
                                        backgroundColor: safeCat.color,
                                        color: safeCat.textColor,
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
                                                onClick={() => onEdit(expense)}
                                                style={{ padding: '4px', background: '#EFF6FF', color: '#3B82F6', borderRadius: '4px', border: 'none' }}
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteLocal(expense.id)}
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
            </div>
        </div>
    );
};

export default ExpenseHistoryModal;
