import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, AlertCircle, ArrowUpRight, ArrowDownRight, Loader2, Sprout } from 'lucide-react';
import { supabase } from '../supabase';
import VillageLeaderboard from '../components/analytics/VillageLeaderboard';

const Dashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalExpenses: 0,
        pendingDues: 0,
        netProfit: 0,
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [rawJobs, setRawJobs] = useState<any[]>([]);
    const [cropStats, setCropStats] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
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
            const sum = (arr: any[], key: string) => arr.reduce((acc, item) => acc + (item[key] || 0), 0);

            const totalRevenue = sum(jobs || [], 'total_amount');
            const totalCollected = sum(jobs || [], 'paid_amount');
            const totalExpenses = sum(expenses || [], 'amount');
            const pendingDues = totalRevenue - totalCollected;
            const netProfit = totalCollected - totalExpenses;

            setStats({
                totalRevenue,
                totalExpenses,
                pendingDues,
                netProfit,
            });

            // 3. Process Lists
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

            // 4. Crop Stats (Acres Only)
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
                <p style={{ color: 'var(--text-secondary)' }}>Business overview & performance.</p>
            </header>

            {/* Premium Stats Grid */}
            <div className="stats-grid" style={{ marginBottom: '3rem' }}>
                {/* Revenue - Blue */}
                <div style={{
                    padding: '1.5rem', borderRadius: '16px',
                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                    color: 'white',
                    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', opacity: 0.9 }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.2)', borderRadius: '10px' }}>
                            <Wallet size={20} />
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Total Revenue</span>
                    </div>
                    <h3 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>₹ {stats.totalRevenue.toLocaleString()}</h3>
                </div>

                {/* Expenses - Red */}
                <div style={{
                    padding: '1.5rem', borderRadius: '16px',
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    color: 'white',
                    boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', opacity: 0.9 }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.2)', borderRadius: '10px' }}>
                            <TrendingDown size={20} />
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Expenses</span>
                    </div>
                    <h3 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>₹ {stats.totalExpenses.toLocaleString()}</h3>
                </div>

                {/* Profit - Green */}
                <div style={{
                    padding: '1.5rem', borderRadius: '16px',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white',
                    boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', opacity: 0.9 }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.2)', borderRadius: '10px' }}>
                            <TrendingUp size={20} />
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Net Profit</span>
                    </div>
                    <h3 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>₹ {stats.netProfit.toLocaleString()}</h3>
                </div>

                {/* Pending - Orange */}
                <div style={{
                    padding: '1.5rem', borderRadius: '16px',
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: 'white',
                    boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', opacity: 0.9 }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.2)', borderRadius: '10px' }}>
                            <AlertCircle size={20} />
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Pending Dues</span>
                    </div>
                    <h3 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>₹ {stats.pendingDues.toLocaleString()}</h3>
                </div>
            </div>

            {/* Analytics Grid */}
            <div className="grid-responsive grid-2" style={{ gap: '2rem', marginBottom: '3rem' }}>
                {/* 1. Village Leaderboard */}
                <div>
                    <VillageLeaderboard jobs={rawJobs} />
                </div>

                {/* 2. Top Crops */}
                <div className="card" style={{ padding: '1.5rem', height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.5rem', background: '#ECFCCB', borderRadius: '8px', color: '#65A30D' }}>
                            <Sprout size={18} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem' }}>Top Crops (by Acres)</h3>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {cropStats.map((item, index) => (
                            <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: index < cropStats.length - 1 ? '1px dashed var(--border-light)' : 'none' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{
                                        width: '24px', height: '24px', borderRadius: '50%',
                                        background: index === 0 ? '#ECFCCB' : '#F3F4F6',
                                        color: index === 0 ? '#65A30D' : 'var(--text-secondary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem'
                                    }}>
                                        {index + 1}
                                    </div>
                                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                                </div>
                                <div style={{ fontWeight: 700, color: '#65A30D' }}>
                                    {item.acres.toFixed(1)} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>ac</span>
                                </div>
                            </div>
                        ))}
                        {cropStats.length === 0 && <div style={{ color: 'var(--text-secondary)', textAlign: 'center', fontStyle: 'italic', fontSize: '0.9rem' }}>No crop data yet.</div>}
                    </div>
                </div>
            </div>

            {/* Recent Activity Section */}
            <div>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Recent Activity</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {recentActivity.map((item, index) => (
                        <div key={index} className="card" style={{ padding: '1rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{
                                    padding: '0.6rem',
                                    borderRadius: '50%',
                                    background: item.type === 'income' ? '#F0FDF4' : '#FEF2F2',
                                    color: item.type === 'income' ? '#166534' : '#991B1B'
                                }}>
                                    {item.type === 'income' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#1F2937' }}>{item.title}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(item.date).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: item.type === 'income' ? '#166534' : '#DC2626' }}>
                                    {item.type === 'income' ? '+' : '-'} ₹ {item.amount.toLocaleString()}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                                    {item.status}
                                </div>
                            </div>
                        </div>
                    ))}
                    {recentActivity.length === 0 && (
                        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No recent activity.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
