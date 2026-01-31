import React, { useEffect, useState, useRef } from 'react';
import { BarChart2, PieChart as PieChartIcon, TrendingUp, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { supabase } from '../lib/supabase';
import { playClickHaptic, playSuccessHaptic } from '../lib/ui-utils';
import RevenueChart from '../components/features/analytics/RevenueChart';
import ExpensePieChart from '../components/features/analytics/ExpensePieChart';
import WaterfallChart from '../components/features/analytics/WaterfallChart';

type FilterType = 'Week' | 'Month' | 'Year' | 'Custom';

// Swipeable Chart Card Component
const SwipeableChartCards: React.FC<{
    children: React.ReactNode[];
    titles: { title: string; subtitle?: string; icon: React.ReactNode; iconBg: string; iconColor: string }[];
}> = ({ children, titles }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const touchStartRef = useRef<number>(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchStartRef.current - touchEnd;

        if (Math.abs(diff) > 50) {
            if (diff > 0 && activeIndex < children.length - 1) {
                playClickHaptic();
                setActiveIndex(activeIndex + 1);
            } else if (diff < 0 && activeIndex > 0) {
                playClickHaptic();
                setActiveIndex(activeIndex - 1);
            }
        }
    };

    const goTo = (index: number) => {
        playClickHaptic();
        setActiveIndex(index);
    };

    return (
        <div style={{ marginBottom: '1.5rem' }}>
            {/* Desktop: Grid view */}
            <div className="desktop-only" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem'
            }}>
                {children.map((child, index) => (
                    <div key={index} style={{
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-xl)',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: 'var(--shadow-card)',
                        border: '1px solid var(--border-light)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginBottom: '1.25rem'
                        }}>
                            <div style={{
                                padding: '0.625rem',
                                background: titles[index].iconBg,
                                borderRadius: 'var(--radius-md)',
                                color: titles[index].iconColor
                            }}>
                                {titles[index].icon}
                            </div>
                            <div>
                                <h3 style={{
                                    fontSize: 'var(--text-base)',
                                    fontWeight: 600,
                                    margin: 0,
                                    color: 'var(--text-main)'
                                }}>
                                    {titles[index].title}
                                </h3>
                                {titles[index].subtitle && (
                                    <p style={{
                                        fontSize: 'var(--text-xs)',
                                        color: 'var(--text-muted)',
                                        margin: 0
                                    }}>
                                        {titles[index].subtitle}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div style={{ flex: 1, minHeight: '280px' }}>
                            {child}
                        </div>
                    </div>
                ))}
            </div>

            {/* Mobile: Swipeable carousel */}
            <div className="mobile-only" style={{ display: 'block' }}>
                <div
                    ref={containerRef}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    style={{
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-xl)',
                        padding: '1.25rem',
                        boxShadow: 'var(--shadow-card)',
                        border: '1px solid var(--border-light)',
                        overflow: 'hidden'
                    }}
                >
                    {/* Header with navigation */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                padding: '0.625rem',
                                background: titles[activeIndex].iconBg,
                                borderRadius: 'var(--radius-md)',
                                color: titles[activeIndex].iconColor
                            }}>
                                {titles[activeIndex].icon}
                            </div>
                            <div>
                                <h3 style={{
                                    fontSize: 'var(--text-base)',
                                    fontWeight: 600,
                                    margin: 0,
                                    color: 'var(--text-main)'
                                }}>
                                    {titles[activeIndex].title}
                                </h3>
                                {titles[activeIndex].subtitle && (
                                    <p style={{
                                        fontSize: 'var(--text-xs)',
                                        color: 'var(--text-muted)',
                                        margin: 0
                                    }}>
                                        {titles[activeIndex].subtitle}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Navigation arrows */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => activeIndex > 0 && goTo(activeIndex - 1)}
                                disabled={activeIndex === 0}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: 'var(--radius-md)',
                                    background: activeIndex === 0 ? 'var(--bg-subtle)' : 'var(--primary-light)',
                                    border: 'none',
                                    cursor: activeIndex === 0 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: activeIndex === 0 ? 'var(--text-muted)' : 'var(--primary)'
                                }}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => activeIndex < children.length - 1 && goTo(activeIndex + 1)}
                                disabled={activeIndex === children.length - 1}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: 'var(--radius-md)',
                                    background: activeIndex === children.length - 1 ? 'var(--bg-subtle)' : 'var(--primary-light)',
                                    border: 'none',
                                    cursor: activeIndex === children.length - 1 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: activeIndex === children.length - 1 ? 'var(--text-muted)' : 'var(--primary)'
                                }}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Chart content */}
                    <div style={{ minHeight: '280px' }}>
                        {children[activeIndex]}
                    </div>

                    {/* Dots indicator */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        marginTop: '1rem'
                    }}>
                        {children.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goTo(index)}
                                style={{
                                    width: index === activeIndex ? '24px' : '8px',
                                    height: '8px',
                                    borderRadius: 'var(--radius-full)',
                                    background: index === activeIndex ? 'var(--primary)' : 'var(--border-light)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all var(--transition-fast)'
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* CSS for responsive display */}
            <style>{`
                .desktop-only { display: grid !important; }
                .mobile-only { display: none !important; }
                @media (max-width: 768px) {
                    .desktop-only { display: none !important; }
                    .mobile-only { display: block !important; }
                }
            `}</style>
        </div>
    );
};

// Date Range Picker Modal
const DateRangePicker: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onApply: (start: string, end: string) => void;
    startDate: string;
    endDate: string;
}> = ({ isOpen, onClose, onApply, startDate, endDate }) => {
    const [start, setStart] = useState(startDate);
    const [end, setEnd] = useState(endDate);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div className="animate-scale-in" style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '360px',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-main)' }}>
                        Select Date Range
                    </h3>
                    <button onClick={onClose} style={{
                        padding: '0.5rem',
                        background: 'var(--bg-subtle)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        display: 'flex'
                    }}>
                        <X size={18} style={{ color: 'var(--text-muted)' }} />
                    </button>
                </div>

                <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 500,
                            color: 'var(--text-muted)',
                            marginBottom: '0.375rem'
                        }}>
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={start}
                            onChange={e => setStart(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                fontSize: 'var(--text-sm)',
                                border: '1px solid var(--border-light)',
                                borderRadius: 'var(--radius-md)',
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
                            End Date
                        </label>
                        <input
                            type="date"
                            value={end}
                            onChange={e => setEnd(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                fontSize: 'var(--text-sm)',
                                border: '1px solid var(--border-light)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-subtle)',
                                color: 'var(--text-main)'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            fontSize: 'var(--text-sm)',
                            fontWeight: 600,
                            background: 'var(--bg-subtle)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { onApply(start, end); onClose(); }}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            fontSize: 'var(--text-sm)',
                            fontWeight: 600,
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Calendar size={16} />
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
};

const Reports: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<any[]>([]);
    const [pieData, setPieData] = useState<any[]>([]);
    const [waterfallData, setWaterfallData] = useState<any[]>([]);
    const [filter, setFilter] = useState<FilterType>('Year');

    // Custom date range
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [customStartDate, setCustomStartDate] = useState(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [customEndDate, setCustomEndDate] = useState(
        new Date().toISOString().split('T')[0]
    );

    const [rawJobs, setRawJobs] = useState<any[]>([]);
    const [rawExpenses, setRawExpenses] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (rawJobs.length > 0 || rawExpenses.length > 0) {
            processCharts(rawJobs, rawExpenses, filter);
        }
    }, [filter, rawJobs, rawExpenses, customStartDate, customEndDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: jobs } = await supabase.from('jobs').select('total_amount, date');
            const { data: expenses } = await supabase.from('expenses').select('amount, date, category');

            setRawJobs(jobs || []);
            setRawExpenses(expenses || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };


    const getDateRange = (currentFilter: FilterType): { cutoff: Date; labels: string[] } => {
        if (currentFilter === 'Custom') {
            return { cutoff: new Date(customStartDate), labels: [] };
        } else if (currentFilter === 'Week') {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 7);
            return { cutoff, labels: [] };
        } else if (currentFilter === 'Month') {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30);
            return { cutoff, labels: [] };
        } else {
            const cutoff = new Date();
            cutoff.setMonth(cutoff.getMonth() - 12);
            return { cutoff, labels: [] };
        }
    };

    const processCharts = (jobs: any[], expenses: any[], currentFilter: FilterType) => {
        const processedData: any[] = [];
        const now = new Date();

        if (currentFilter === 'Custom') {
            // Group by days in custom range
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

            for (let i = 0; i <= daysDiff; i++) {
                const d = new Date(start);
                d.setDate(d.getDate() + i);
                const dateStr = d.toISOString().split('T')[0];
                const label = d.getDate().toString();

                const dayIncome = jobs.filter(j => j.date === dateStr).reduce((sum, j) => sum + (j.total_amount || 0), 0);
                const dayExpense = expenses.filter(e => e.date === dateStr).reduce((sum, e) => sum + (e.amount || 0), 0);
                processedData.push({ name: label, income: dayIncome, expense: dayExpense });
            }
        } else if (currentFilter === 'Week') {
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const label = d.toLocaleDateString('en-US', { weekday: 'short' });

                const dayIncome = jobs.filter(j => j.date === dateStr).reduce((sum, j) => sum + (j.total_amount || 0), 0);
                const dayExpense = expenses.filter(e => e.date === dateStr).reduce((sum, e) => sum + (e.amount || 0), 0);
                processedData.push({ name: label, income: dayIncome, expense: dayExpense, fullDate: dateStr });
            }
        } else if (currentFilter === 'Month') {
            for (let i = 29; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const label = d.getDate().toString();

                const dayIncome = jobs.filter(j => j.date === dateStr).reduce((sum, j) => sum + (j.total_amount || 0), 0);
                const dayExpense = expenses.filter(e => e.date === dateStr).reduce((sum, e) => sum + (e.amount || 0), 0);
                processedData.push({ name: label, income: dayIncome, expense: dayExpense });
            }
        } else {
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthIdx = d.getMonth();
                const year = d.getFullYear();
                const label = d.toLocaleString('default', { month: 'short' });

                const monthIncome = jobs.filter(j => {
                    const jd = new Date(j.date);
                    return jd.getMonth() === monthIdx && jd.getFullYear() === year;
                }).reduce((sum, j) => sum + (j.total_amount || 0), 0);

                const monthExpense = expenses.filter(e => {
                    const ed = new Date(e.date);
                    return ed.getMonth() === monthIdx && ed.getFullYear() === year;
                }).reduce((sum, e) => sum + (e.amount || 0), 0);

                processedData.push({ name: label, income: monthIncome, expense: monthExpense });
            }
        }

        setChartData(processedData);

        // Filter expenses based on date range
        const { cutoff } = getDateRange(currentFilter);
        let filteredExpenses = currentFilter === 'Custom'
            ? expenses.filter(e => {
                const d = new Date(e.date);
                return d >= new Date(customStartDate) && d <= new Date(customEndDate);
            })
            : expenses.filter(e => new Date(e.date) >= cutoff);

        const categoryMap: Record<string, string> = {
            'Fuel': 'Diesel / Fuel',
            'Spares & Repairs': 'Spares',
            'Driver Salary': 'Salary',
            'Food': 'Food',
            'Other': 'Other',
            'EMI': 'Machine EMI'
        };

        const colors: Record<string, string> = {
            'Fuel': '#DC2626',
            'Spares & Repairs': '#D97706',
            'Driver Salary': '#2563EB',
            'Food': '#059669',
            'EMI': '#4F46E5',
            'Other': '#6B7280'
        };

        const pie = Object.keys(categoryMap).map(catKey => {
            const total = filteredExpenses.filter(e => e.category === catKey).reduce((sum, e) => sum + (e.amount || 0), 0);
            return {
                name: categoryMap[catKey],
                value: total,
                color: colors[catKey] || '#CBD5E1'
            };
        }).filter(item => item.value > 0);

        setPieData(pie);

        // Waterfall Data
        const totalIncome = (currentFilter === 'Custom'
            ? jobs.filter(j => {
                const d = new Date(j.date);
                return d >= new Date(customStartDate) && d <= new Date(customEndDate);
            })
            : jobs.filter(j => new Date(j.date) >= cutoff)
        ).reduce((sum, j) => sum + (j.total_amount || 0), 0);

        const expensesByCat: Record<string, number> = {};
        filteredExpenses.forEach(e => {
            if (!expensesByCat[e.category]) expensesByCat[e.category] = 0;
            expensesByCat[e.category] += (e.amount || 0);
        });

        const steps = [{
            name: 'Revenue',
            value: totalIncome,
            originalValue: totalIncome,
            fill: '#059669'
        }];

        let totalExp = 0;
        Object.entries(expensesByCat).sort((a, b) => b[1] - a[1]).forEach(([cat, amount]) => {
            steps.push({
                name: categoryMap[cat] || cat,
                value: -amount,
                originalValue: -amount,
                fill: colors[cat] || '#DC2626'
            });
            totalExp += amount;
        });

        const profit = totalIncome - totalExp;
        steps.push({
            name: 'Profit',
            value: profit,
            originalValue: profit,
            fill: profit >= 0 ? '#1E40AF' : '#DC2626'
        });

        setWaterfallData(steps);
    };

    const handleApplyDateRange = (start: string, end: string) => {
        playSuccessHaptic();
        setCustomStartDate(start);
        setCustomEndDate(end);
        setFilter('Custom');
    };

    const getFilterLabel = () => {
        if (filter === 'Custom') {
            const start = new Date(customStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            const end = new Date(customEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            return `${start} — ${end}`;
        }
        return filter === 'Week' ? 'Last 7 Days' : filter === 'Month' ? 'Last 30 Days' : 'Last 12 Months';
    };

    if (loading) {
        return (
            <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <div>
                        <Skeleton width={150} height={32} style={{ marginBottom: '8px' }} />
                        <Skeleton width={200} height={20} />
                    </div>
                    <Skeleton width={200} height={40} borderRadius={12} />
                </div>

                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    border: '1px solid var(--border-light)'
                }}>
                    <Skeleton height={280} />
                </div>
            </div>
        );
    }

    const chartTitles = [
        {
            title: 'Income vs Expense',
            icon: <BarChart2 size={20} />,
            iconBg: 'var(--primary-light)',
            iconColor: 'var(--primary)'
        },
        {
            title: 'Expenses Breakdown',
            icon: <PieChartIcon size={20} />,
            iconBg: 'var(--secondary-light)',
            iconColor: 'var(--secondary)'
        },
        {
            title: 'Profit Flow',
            subtitle: 'Money in vs money out',
            icon: <TrendingUp size={20} />,
            iconBg: 'var(--success-light)',
            iconColor: 'var(--success)'
        }
    ];

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <header style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{
                            fontSize: 'var(--text-xl)',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            marginBottom: '0.375rem',
                            letterSpacing: '-0.02em'
                        }}>
                            Reports
                        </h1>
                        <p style={{
                            fontSize: 'var(--text-sm)',
                            color: 'var(--text-muted)'
                        }}>
                            Financial insights & breakdown
                        </p>
                    </div>

                    {/* Enhanced Filter Tabs */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <div style={{
                            background: 'var(--bg-card)',
                            padding: '4px',
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex',
                            border: '1px solid var(--border-light)',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            {(['Week', 'Month', 'Year'] as FilterType[]).map(f => (
                                <button
                                    key={f}
                                    onClick={() => { playClickHaptic(); setFilter(f); }}
                                    style={{
                                        padding: '0.5rem 0.875rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: 'none',
                                        fontSize: 'var(--text-xs)',
                                        fontWeight: 600,
                                        background: filter === f ? 'linear-gradient(135deg, var(--primary), #10B981)' : 'transparent',
                                        color: filter === f ? 'white' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                        transition: 'all var(--transition-fast)',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        {/* Custom Date Button */}
                        <button
                            onClick={() => { playClickHaptic(); setShowDatePicker(true); }}
                            style={{
                                padding: '0.5rem 0.875rem',
                                borderRadius: 'var(--radius-lg)',
                                border: filter === 'Custom' ? 'none' : '1px solid var(--border-light)',
                                fontSize: 'var(--text-xs)',
                                fontWeight: 600,
                                background: filter === 'Custom' ? 'linear-gradient(135deg, var(--primary), #10B981)' : 'var(--bg-card)',
                                color: filter === 'Custom' ? 'white' : 'var(--text-muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                        >
                            <Calendar size={14} />
                            Custom
                        </button>
                    </div>
                </div>

                {/* Current Period Indicator */}
                <div style={{
                    marginTop: '1rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.875rem',
                    background: filter === 'Custom' ? 'var(--primary-light)' : 'var(--secondary-light)',
                    borderRadius: 'var(--radius-full)',
                    border: `1px solid ${filter === 'Custom' ? 'rgba(5, 150, 105, 0.15)' : 'rgba(30, 64, 175, 0.15)'}`
                }}>
                    <Calendar size={14} style={{ color: filter === 'Custom' ? 'var(--primary)' : 'var(--secondary)' }} />
                    <span style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        color: filter === 'Custom' ? 'var(--primary)' : 'var(--secondary)'
                    }}>
                        {getFilterLabel()}
                    </span>
                </div>
            </header>

            {/* Swipeable Chart Cards */}
            <SwipeableChartCards titles={chartTitles}>
                <RevenueChart data={chartData} />
                <ExpensePieChart data={pieData} />
                <WaterfallChart data={waterfallData} />
            </SwipeableChartCards>

            {/* Date Range Picker Modal */}
            <DateRangePicker
                isOpen={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onApply={handleApplyDateRange}
                startDate={customStartDate}
                endDate={customEndDate}
            />
        </div>
    );
};

export default Reports;
