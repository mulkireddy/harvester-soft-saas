import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Sprout, ChevronRight, Calendar, Wheat, Clock, DollarSign } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { supabase } from '../lib/supabase';
import VillageLeaderboard from '../components/features/analytics/VillageLeaderboard';
import { playClickHaptic } from '../lib/ui-utils';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalExpenses: 0,
        pendingDues: 0,
        netProfit: 0,
    });
    const [trends, setTrends] = useState({
        revenueChange: 0,
        profitChange: 0,
    });
    const [todaySummary, setTodaySummary] = useState({
        acres: 0,
        jobs: 0,
        earnings: 0
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [rawJobs, setRawJobs] = useState<any[]>([]);
    const [cropStats, setCropStats] = useState<any[]>([]);
    const [greeting, setGreeting] = useState('Good morning');
    const [userName, setUserName] = useState('');

    useEffect(() => {
        // Set greeting based on time
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 17) setGreeting('Good afternoon');
        else setGreeting('Good evening');

        fetchUserName();
        fetchDashboardData();
    }, []);

    const fetchUserName = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.name) {
            setUserName(user.user_metadata.name.split(' ')[0]);
        }
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            const today = new Date().toISOString().split('T')[0];

            // 1. Fetch Data
            const { data: jobs, error: jobsError } = await supabase
                .from('jobs')
                .select('total_amount, paid_amount, status, date, quantity, billing_mode, crop, farmers(name, place)');

            if (jobsError) throw jobsError;

            const { data: expenses, error: expensesError } = await supabase
                .from('expenses')
                .select('amount, date, category');

            if (expensesError) throw expensesError;

            // 2. Calculate Totals
            const sum = (arr: any[], key: string) => arr.reduce((acc, item) => acc + (Number(item[key]) || 0), 0);

            const totalRevenue = sum(jobs || [], 'total_amount');
            const totalCollected = sum(jobs || [], 'paid_amount');
            const totalExpenses = sum(expenses || [], 'amount');

            // Pending Dues = Total Deal Value - Total Collected Amount
            const pendingDues = totalRevenue - totalCollected;

            // Net Profit = Total Money In (Collected) - Total Money Out (Expenses)
            // Note: We do NOT count pending dues as profit yet, as it's not "realized" cash.
            const netProfit = totalCollected - totalExpenses;

            setStats({
                totalRevenue,
                totalExpenses,
                pendingDues,
                netProfit,
            });

            // 3. Calculate Trends (This Month vs Last Month)
            // Helper to filter by date range
            const filterByDate = (data: any[], start: Date, end?: Date) => {
                return data?.filter(item => {
                    const d = new Date(item.date);
                    return d >= start && (!end || d <= end);
                }) || [];
            };

            const thisMonthJobs = filterByDate(jobs || [], thisMonthStart);
            const lastMonthJobs = filterByDate(jobs || [], lastMonthStart, lastMonthEnd);

            // Revenue Trend (Based on Total Deal Value)
            const thisMonthRevenue = sum(thisMonthJobs, 'total_amount');
            const lastMonthRevenue = sum(lastMonthJobs, 'total_amount');

            // Profit Trend (Realized Profit: Collected - Expenses)
            const thisMonthCollected = sum(thisMonthJobs, 'paid_amount');
            const lastMonthCollected = sum(lastMonthJobs, 'paid_amount');

            const thisMonthExpenses = sum(filterByDate(expenses || [], thisMonthStart), 'amount');
            const lastMonthExpenses = sum(filterByDate(expenses || [], lastMonthStart, lastMonthEnd), 'amount');

            const thisMonthProfit = thisMonthCollected - thisMonthExpenses;
            const lastMonthProfit = lastMonthCollected - lastMonthExpenses;

            // Avoid division by zero
            const calculateChange = (current: number, previous: number) => {
                if (previous === 0) return current > 0 ? 100 : 0;
                return Math.round(((current - previous) / Math.abs(previous)) * 100);
            };

            const revenueChange = calculateChange(thisMonthRevenue, lastMonthRevenue);
            const profitChange = calculateChange(thisMonthProfit, lastMonthProfit);

            setTrends({ revenueChange, profitChange });

            // 4. Today's Summary
            const todayJobs = jobs?.filter(j => j.date?.startsWith(today)) || [];
            const todayAcres = todayJobs
                .filter(j => j.billing_mode === 'acre')
                .reduce((sum, j) => sum + Number(j.quantity || 0), 0);
            const todayEarnings = sum(todayJobs, 'total_amount');

            setTodaySummary({
                acres: todayAcres,
                jobs: todayJobs.length,
                earnings: todayEarnings
            });

            // 5. Process Lists
            setRawJobs(jobs || []);

            // Recent Activity
            const jobItems = jobs?.map((j: any) => ({
                id: Math.random(),
                type: 'income',
                title: j.farmers?.name || 'Unknown Farmer',
                amount: j.total_amount,
                date: j.date,
                status: j.status
            })) || [];

            const expenseItems = expenses?.map(e => ({
                id: Math.random(),
                type: 'expense',
                title: e.category,
                amount: e.amount,
                date: e.date,
                status: 'Paid'
            })) || [];

            const mixed = [...jobItems, ...expenseItems]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5);

            setRecentActivity(mixed);

            // 6. Crop Stats (Acres Only)
            const crops: Record<string, number> = {};
            jobs?.forEach(job => {
                if (job.billing_mode === 'acre' && job.crop) {
                    const c = job.crop;
                    if (!crops[c]) crops[c] = 0;
                    crops[c] += Number(job.quantity || 0);
                }
            });

            const cropList = Object.entries(crops)
                .map(([name, acres]) => ({ name, acres }))
                .sort((a, b) => b.acres - a.acres)
                .slice(0, 5);

            setCropStats(cropList);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Format currency
    const formatCurrency = (value: number) => {
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
        return `₹${value.toFixed(0)}`;
    };

    // Trend indicator component
    const TrendIndicator: React.FC<{ value: number }> = ({ value }) => {
        if (value === 0) return null;
        const isPositive = value > 0;
        return (
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.125rem',
                padding: '0.125rem 0.375rem',
                borderRadius: 'var(--radius-sm)',
                background: isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: isPositive ? '#059669' : '#DC2626',
                fontSize: '0.65rem',
                fontWeight: 700
            }}>
                {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {isPositive ? '+' : ''}{value}%
            </div>
        );
    };

    return (
        <div className="animate-fade-in">
            {/* Premium Header Background */}
            <div className="premium-header-bg" />

            {/* Header with Greeting */}
            <header style={{ marginBottom: '1.5rem', position: 'relative' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-sm)',
                    marginBottom: '0.25rem',
                    fontWeight: 500
                }}>
                    <Calendar size={14} />
                    {new Date().toLocaleDateString('en-IN', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    })}
                </div>
                <h1 className="font-serif" style={{
                    fontSize: 'var(--text-3xl)',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    letterSpacing: '-0.02em',
                    marginBottom: '0.5rem'
                }}>
                    {greeting}{userName ? `, ${userName}` : ''}
                </h1>
            </header>

            {/* Bento Grid Layout */}
            <div className="bento-grid" style={{ marginBottom: '2rem' }}>

                {/* 1. Today's Progress (Span 12) */}
                <div className="bento-item bento-span-12" style={{
                    background: 'linear-gradient(135deg, var(--bg-card) 0%, #FAFAFA 100%)',
                    padding: '1.25rem'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                padding: '0.4rem',
                                background: 'rgba(5, 150, 105, 0.1)',
                                borderRadius: '8px',
                                color: 'var(--primary)'
                            }}>
                                <Clock size={16} />
                            </div>
                            <span style={{
                                fontSize: 'var(--text-sm)',
                                fontWeight: 700,
                                color: 'var(--text-main)',
                                letterSpacing: '0.01em'
                            }}>
                                TODAY'S PULSE
                            </span>
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1rem'
                    }}>
                        {[
                            { label: 'Acres', value: todaySummary.acres.toFixed(1), icon: Wheat, color: 'var(--primary)' },
                            { label: 'Jobs', value: todaySummary.jobs, icon: ChevronRight, color: 'var(--info)' },
                            { label: 'Earned', value: formatCurrency(todaySummary.earnings), icon: DollarSign, color: 'var(--success)' }
                        ].map((item, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                                <div className="font-mono-num" style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 700,
                                    color: 'var(--text-main)',
                                    lineHeight: 1.1,
                                    marginBottom: '0.125rem'
                                }}>
                                    {loading ? <Skeleton width={40} /> : item.value}
                                </div>
                                <div style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--text-muted)',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {item.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Revenue Card (Span 6) */}
                <div
                    className="bento-item bento-span-6 animate-scale-in"
                    onClick={() => { playClickHaptic(); navigate('/reports'); }}
                    role="button"
                    tabIndex={0}
                    style={{ cursor: 'pointer', background: 'var(--bg-card)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{
                            width: '36px', height: '36px',
                            borderRadius: '10px',
                            background: 'rgba(5, 150, 105, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Wallet size={18} style={{ color: 'var(--primary)' }} />
                        </div>
                        <TrendIndicator value={trends.revenueChange} />
                    </div>
                    <div style={{ marginTop: 'auto' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.125rem' }}>REVENUE</div>
                        <div className="font-mono-num" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {loading ? <Skeleton width={80} /> : formatCurrency(stats.totalRevenue)}
                        </div>
                    </div>
                </div>

                {/* 3. Profit Card (Span 6) */}
                <div
                    className="bento-item bento-span-6 animate-scale-in"
                    onClick={() => { playClickHaptic(); navigate('/reports'); }}
                    role="button"
                    tabIndex={0}
                    style={{ cursor: 'pointer', animationDelay: '50ms' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{
                            width: '36px', height: '36px',
                            borderRadius: '10px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <TrendingUp size={18} style={{ color: 'var(--info)' }} />
                        </div>
                        <TrendIndicator value={trends.profitChange} />
                    </div>
                    <div style={{ marginTop: 'auto' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.125rem' }}>PROFIT</div>
                        <div className="font-mono-num" style={{
                            fontSize: '1.5rem', fontWeight: 700,
                            color: stats.netProfit >= 0 ? 'var(--success)' : 'var(--error)'
                        }}>
                            {loading ? <Skeleton width={80} /> : formatCurrency(stats.netProfit)}
                        </div>
                    </div>
                </div>

                {/* 4. Expenses (Span 6) */}
                <div
                    className="bento-item bento-span-6"
                    onClick={() => { playClickHaptic(); navigate('/expenses'); }}
                    role="button"
                    style={{ cursor: 'pointer', padding: '1rem' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <TrendingDown size={16} style={{ color: 'var(--error)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>EXPENSES</div>
                            <div className="font-mono-num" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--error)' }}>
                                {loading ? <Skeleton width={60} /> : formatCurrency(stats.totalExpenses)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Pending (Span 6) */}
                <div
                    className="bento-item bento-span-6"
                    onClick={() => { playClickHaptic(); navigate('/farmers'); }}
                    role="button"
                    style={{ cursor: 'pointer', padding: '1rem' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'rgba(245, 158, 11, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Clock size={16} style={{ color: 'var(--warning)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>PENDING</div>
                            <div className="font-mono-num" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--warning)' }}>
                                {loading ? <Skeleton width={60} /> : formatCurrency(stats.pendingDues)}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Analytics Section */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{
                    display: 'grid',
                    gap: '1rem',
                    gridTemplateColumns: '1fr'
                }}>
                    {/* Village Leaderboard */}
                    <div>
                        {loading ? (
                            <Skeleton height={280} borderRadius={16} />
                        ) : (
                            <VillageLeaderboard jobs={rawJobs} />
                        )}
                    </div>

                    {/* Top Crops Card - Cleaner Styling */}
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-xl)',
                        padding: '1.25rem',
                        boxShadow: 'var(--shadow-xs)',
                        border: '1px solid var(--border-light)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '1.25rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    padding: '0.5rem',
                                    background: 'rgba(5, 150, 105, 0.1)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--primary)'
                                }}>
                                    <Sprout size={18} />
                                </div>
                                <h3 style={{
                                    fontSize: 'var(--text-base)',
                                    fontWeight: 600,
                                    color: 'var(--text-main)'
                                }}>
                                    Top Crops
                                </h3>
                            </div>
                            <span style={{
                                fontSize: 'var(--text-xs)',
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                by acres
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {loading ? (
                                Array(4).fill(0).map((_, i) => (
                                    <div key={i} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        paddingBottom: '0.75rem',
                                        borderBottom: i < 3 ? '1px solid var(--border-light)' : 'none'
                                    }}>
                                        <Skeleton circle width={28} height={28} />
                                        <Skeleton width={100} height={16} />
                                        <div style={{ marginLeft: 'auto' }}>
                                            <Skeleton width={50} height={16} />
                                        </div>
                                    </div>
                                ))
                            ) : cropStats.length > 0 ? (
                                cropStats.map((item, index) => (
                                    <div
                                        key={item.name}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            paddingBottom: index < cropStats.length - 1 ? '0.75rem' : 0,
                                            borderBottom: index < cropStats.length - 1 ? '1px solid var(--border-light)' : 'none'
                                        }}
                                    >
                                        <div style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: 'var(--radius-full)',
                                            background: index === 0 ? 'var(--primary)' : 'var(--bg-subtle)',
                                            color: index === 0 ? 'white' : 'var(--text-secondary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            fontSize: 'var(--text-xs)'
                                        }}>
                                            {index + 1}
                                        </div>
                                        <span style={{
                                            fontWeight: 500,
                                            color: 'var(--text-main)',
                                            flex: 1
                                        }}>
                                            {item.name}
                                        </span>
                                        <span style={{
                                            fontWeight: 700,
                                            color: 'var(--primary)',
                                            fontSize: 'var(--text-sm)'
                                        }}>
                                            {item.acres.toFixed(1)}
                                            <span style={{
                                                fontWeight: 500,
                                                color: 'var(--text-muted)',
                                                marginLeft: '0.25rem'
                                            }}>
                                                ac
                                            </span>
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    color: 'var(--text-muted)',
                                    fontSize: 'var(--text-sm)',
                                    padding: '1.5rem'
                                }}>
                                    No crop data yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem'
                }}>
                    <h3 style={{
                        fontSize: 'var(--text-base)',
                        fontWeight: 600,
                        color: 'var(--text-main)'
                    }}>
                        Recent Activity
                    </h3>
                    <button
                        onClick={() => { playClickHaptic(); navigate('/reports'); }}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <Skeleton key={i} height={72} borderRadius={14} />
                        ))
                    ) : recentActivity.length > 0 ? (
                        recentActivity.map((item, index) => (
                            <div
                                key={index}
                                style={{
                                    background: 'var(--bg-card)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '1rem 1.25rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    boxShadow: 'var(--shadow-xs)',
                                    border: '1px solid var(--border-light)',
                                    transition: 'all var(--transition-fast)'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
                                    <div style={{
                                        padding: '0.625rem',
                                        borderRadius: 'var(--radius-lg)',
                                        background: item.type === 'income'
                                            ? 'rgba(16, 185, 129, 0.1)'
                                            : 'rgba(239, 68, 68, 0.1)',
                                        color: item.type === 'income' ? 'var(--success)' : 'var(--error)'
                                    }}>
                                        {item.type === 'income' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                                    </div>
                                    <div>
                                        <div style={{
                                            fontWeight: 600,
                                            color: 'var(--text-main)',
                                            fontSize: 'var(--text-sm)',
                                            marginBottom: '0.125rem'
                                        }}>
                                            {item.title}
                                        </div>
                                        <div style={{
                                            fontSize: 'var(--text-xs)',
                                            color: 'var(--text-muted)'
                                        }}>
                                            {new Date(item.date).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short'
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        fontWeight: 700,
                                        fontSize: 'var(--text-base)',
                                        color: item.type === 'income' ? 'var(--success)' : 'var(--error)'
                                    }}>
                                        {item.type === 'income' ? '+' : '-'} ₹{item.amount.toLocaleString('en-IN')}
                                    </div>
                                    <div style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                        fontWeight: 600,
                                        letterSpacing: '0.05em'
                                    }}>
                                        {item.status}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '2.5rem',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-light)'
                        }}>
                            <p>No recent activity</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
