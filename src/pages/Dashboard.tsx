
import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, AlertCircle, ArrowUpRight, ArrowDownRight, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../supabase';
import VillageLeaderboard from '../components/analytics/VillageLeaderboard';

const Dashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalCollected: 0,
        totalExpenses: 0,
        pendingDues: 0,
        netProfit: 0,
        revenueGrowth: 0, // % vs last month
        expenseGrowth: 0,
        profitGrowth: 0,
        forecastRevenue: 0 // Predicted month-end
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [rawJobs, setRawJobs] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch ALL Data (Optimization: In a real app, use date ranges)
            const { data: jobs, error: jobsError } = await supabase
                .from('jobs')
                .select('total_amount, paid_amount, status, date, farmers(name)');

            if (jobsError) throw jobsError;

            const { data: expenses, error: expensesError } = await supabase
                .from('expenses')
                .select('amount, date, category');

            if (expensesError) throw expensesError;

            // 2. Date Filtering Logic for "Pulse" (Comparison)
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

            // Helper to sum
            const sum = (arr: any[], key: string) => arr.reduce((acc, item) => acc + (item[key] || 0), 0);

            // Filter Data
            const thisMonthJobs = jobs?.filter(j => { const d = new Date(j.date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear }) || [];
            const lastMonthJobs = jobs?.filter(j => { const d = new Date(j.date); return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear }) || [];

            const thisMonthExpenses = expenses?.filter(e => { const d = new Date(e.date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear }) || [];
            const lastMonthExpenses = expenses?.filter(e => { const d = new Date(e.date); return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear }) || [];

            // 3. Calculate Totals (Global)
            const totalRevenue = sum(jobs || [], 'total_amount');
            const totalCollected = sum(jobs || [], 'paid_amount');
            const totalExpenses = sum(expenses || [], 'amount');
            const pendingDues = totalRevenue - totalCollected;
            const netProfit = totalCollected - totalExpenses;

            // 4. Calculate Comparisons (Pulse)
            const thisMonthRev = sum(thisMonthJobs, 'total_amount');
            const lastMonthRev = sum(lastMonthJobs, 'total_amount');

            const thisMonthExp = sum(thisMonthExpenses, 'amount');
            const lastMonthExp = sum(lastMonthExpenses, 'amount');

            const thisMonthProfit = (sum(thisMonthJobs, 'paid_amount') - thisMonthExp);
            const lastMonthProfit = (sum(lastMonthJobs, 'paid_amount') - lastMonthExp);

            const calcGrowth = (current: number, previous: number) => {
                if (previous === 0) return current > 0 ? 100 : 0;
                return ((current - previous) / previous) * 100;
            };

            const revenueGrowth = calcGrowth(thisMonthRev, lastMonthRev);
            const expenseGrowth = calcGrowth(thisMonthExp, lastMonthExp);
            const profitGrowth = calcGrowth(thisMonthProfit, lastMonthProfit);

            // 5. Calculate Forecast (Crystal Ball)
            const currentDay = now.getDate();
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            // Simple Run Rate: (Revenue / DaysPassed) * TotalDays
            // Avoid division by zero
            const dailyRunRate = currentDay > 0 ? thisMonthRev / currentDay : 0;
            const forecastRevenue = thisMonthRev + (dailyRunRate * (daysInMonth - currentDay));

            setStats({
                totalRevenue,
                totalCollected,
                totalExpenses,
                pendingDues,
                netProfit,
                revenueGrowth,
                expenseGrowth,
                profitGrowth,
                forecastRevenue
            });

            // 6. Process Lists
            setRawJobs(jobs || []);

            const jobItems = jobs?.map((j: any) => ({
                id: Math.random(),
                type: 'income',
                title: `Harvest - ${j.farmers?.name}`,
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

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };



    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', color: 'var(--text-secondary)' }}>
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    return (
        <div>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Dashboard</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Overview of your business performance.</p>
            </header>

            {/* Forecast Banner (Crystal Ball) */}
            {stats.forecastRevenue > 0 && (
                <div style={{
                    marginBottom: '2rem', padding: '1.25rem 1.5rem',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
                    borderRadius: '12px', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.2)', borderRadius: '8px' }}>
                            <Sparkles size={24} fill="currentColor" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Predictive Forecast</div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Based on your current pace, you are on track to hit a new milestone this month.</div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase' }}>Projected Revenue</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>₹ {stats.forecastRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>

                {/* Total Collected */}
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '12px', background: '#DCFCE7', color: '#166534' }}>
                            <Wallet size={24} />
                        </div>
                        {/* Pulse Badge */}
                        <span style={{
                            fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px',
                            background: stats.revenueGrowth >= 0 ? '#F0FDF4' : '#FEF2F2',
                            color: stats.revenueGrowth >= 0 ? '#166534' : '#991B1B',
                            fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'
                        }}>
                            {stats.revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(stats.revenueGrowth).toFixed(0)}%
                        </span>
                    </div>
                    <div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Revenue</span>
                        <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1F2937' }}>₹ {stats.totalRevenue.toLocaleString()}</h3>
                    </div>
                </div>

                {/* Total Expenses */}
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '12px', background: '#FEE2E2', color: '#991B1B' }}>
                            <TrendingDown size={24} />
                        </div>
                        {/* Pulse Badge (Expense Growth is Bad if positive usually, but let's keep it simple: Up arrow is Up) */}
                        <span style={{
                            fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px',
                            background: stats.expenseGrowth <= 0 ? '#F0FDF4' : '#FEF2F2',
                            color: stats.expenseGrowth <= 0 ? '#166534' : '#991B1B',
                            fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'
                        }}>
                            {stats.expenseGrowth >= 0 ? '↑' : '↓'} {Math.abs(stats.expenseGrowth).toFixed(0)}%
                        </span>
                    </div>
                    <div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Expenses</span>
                        <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1F2937' }}>₹ {stats.totalExpenses.toLocaleString()}</h3>
                    </div>
                </div>

                {/* Net Profit */}
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '12px', background: '#DBEAFE', color: '#1E40AF' }}>
                            <TrendingUp size={24} />
                        </div>
                        {/* Pulse Badge */}
                        <span style={{
                            fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px',
                            background: stats.profitGrowth >= 0 ? '#F0FDF4' : '#FEF2F2',
                            color: stats.profitGrowth >= 0 ? '#166534' : '#991B1B',
                            fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'
                        }}>
                            {stats.profitGrowth >= 0 ? '↑' : '↓'} {Math.abs(stats.profitGrowth).toFixed(0)}%
                        </span>
                    </div>
                    <div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Net Profit</span>
                        <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: stats.netProfit >= 0 ? '#1F2937' : '#DC2626' }}>
                            ₹ {stats.netProfit.toLocaleString()}
                        </h3>
                    </div>
                </div>

                {/* Pending Dues */}
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '12px', background: '#FFEDD5', color: '#9A3412' }}>
                            <AlertCircle size={24} />
                        </div>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: '#FFF7ED', color: '#9A3412', fontWeight: 600 }}>
                            Pending
                        </span>
                    </div>
                    <div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Pending Dues</span>
                        <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#DC2626' }}>₹ {stats.pendingDues.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* Village Leaderboard (Goldmine Map) */}
            <div style={{ marginBottom: '3rem' }}>
                <VillageLeaderboard jobs={rawJobs} />
            </div>

            {/* Recent Activity Section */}
            <div>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Recent Activity</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {recentActivity.map((item, index) => (
                        <div key={index} className="card" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{
                                    padding: '0.5rem',
                                    borderRadius: '50%',
                                    background: item.type === 'income' ? '#F0FDF4' : '#FEF2F2',
                                    color: item.type === 'income' ? '#166534' : '#991B1B'
                                }}>
                                    {item.type === 'income' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#1F2937' }}>{item.title}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{new Date(item.date).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 700, color: item.type === 'income' ? '#166534' : '#991B1B' }}>
                                    {item.type === 'income' ? '+' : '-'} ₹ {item.amount.toLocaleString()}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                    {item.status}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
