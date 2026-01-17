import React, { useEffect, useState } from 'react';
import { Loader2, BarChart2, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import { supabase } from '../supabase';
import RevenueChart from '../components/analytics/RevenueChart';
import ExpensePieChart from '../components/analytics/ExpensePieChart';
import WaterfallChart from '../components/analytics/WaterfallChart';

type FilterType = 'Week' | 'Month' | 'Year';

const Reports: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<any[]>([]);
    const [pieData, setPieData] = useState<any[]>([]);
    const [waterfallData, setWaterfallData] = useState<any[]>([]);
    const [filter, setFilter] = useState<FilterType>('Year');

    const [rawJobs, setRawJobs] = useState<any[]>([]);
    const [rawExpenses, setRawExpenses] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (rawJobs.length > 0 || rawExpenses.length > 0) {
            processCharts(rawJobs, rawExpenses, filter);
        }
    }, [filter, rawJobs, rawExpenses]);

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

    const processCharts = (jobs: any[], expenses: any[], currentFilter: FilterType) => {
        // --- 1. Bar Chart Data (Revenue vs Expenses) ---
        let processedData: any[] = [];
        const now = new Date();

        if (currentFilter === 'Week') {
            // Last 7 Days
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const label = d.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue

                const dayIncome = jobs.filter(j => j.date === dateStr).reduce((sum, j) => sum + (j.total_amount || 0), 0);
                const dayExpense = expenses.filter(e => e.date === dateStr).reduce((sum, e) => sum + (e.amount || 0), 0);
                processedData.push({ name: label, income: dayIncome, expense: dayExpense, fullDate: dateStr });
            }

        } else if (currentFilter === 'Month') {
            // Last 30 Days (Group by roughly 3-day intervals or just daily? Daily is fine for 30 bars usually, but let's do Daily)
            // 30 bars might be tight on mobile. Let's do last 15 days for 'Month' view clarity or stick to daily.
            // Let's do daily but only last 14 days maybe? User asked for "Month".
            // Let's do 30 days but labels only every 5th day. Chart component handles labels usually.
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
            // Year (Last 12 Months)
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

        // --- 2. Expense Breakdown (Pie) ---
        // Pie chart should probably respect the filter range too ideally.
        // Let's apply date filtering to pie data source.
        let filteredExpenses = expenses;
        if (currentFilter === 'Week') {
            const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
            filteredExpenses = expenses.filter(e => new Date(e.date) >= cutoff);
        } else if (currentFilter === 'Month') {
            const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
            filteredExpenses = expenses.filter(e => new Date(e.date) >= cutoff);
        } else {
            const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 12);
            filteredExpenses = expenses.filter(e => new Date(e.date) >= cutoff);
        }

        const categoryMap: Record<string, string> = {
            'Fuel': 'Diesel / Fuel',
            'Spares & Repairs': 'Spares',
            'Driver Salary': 'Salary',
            'Food': 'Food',
            'Other': 'Other',
            'EMI': 'Machine EMI'
        };

        const colors: Record<string, string> = {
            'Fuel': '#EF4444',
            'Spares & Repairs': '#F59E0B',
            'Driver Salary': '#3B82F6',
            'Food': '#10B981',
            'EMI': '#6366F1',
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

        // --- 3. Waterfall Data (Profit Flow) ---
        // Calculate Totals based on current filter
        const totalIncome = jobs.filter(j => {
            const d = new Date(j.date);
            if (currentFilter === 'Week') {
                const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
                return d >= cutoff;
            } else if (currentFilter === 'Month') {
                const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
                return d >= cutoff;
            } else {
                const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 12);
                return d >= cutoff;
            }
        }).reduce((sum, j) => sum + (j.total_amount || 0), 0);

        const expensesByCat: Record<string, number> = {};
        filteredExpenses.forEach(e => {
            if (!expensesByCat[e.category]) expensesByCat[e.category] = 0;
            expensesByCat[e.category] += (e.amount || 0);
        });

        // Construct Waterfall Steps
        // 1. Revenue
        const steps = [{
            name: 'Total Revenue',
            value: totalIncome,
            originalValue: totalIncome,
            fill: '#10B981' // Green
        }];

        // 2. Expenses (Negative)
        let totalExp = 0;
        Object.entries(expensesByCat).sort((a, b) => b[1] - a[1]).forEach(([cat, amount]) => {
            // For a simple 'Step' visual without complex floating bars, we can just show them as negative bars in a bar chart.
            // True waterfall requires complex math for 'floating' bars. Let's stick to Positive/Negative flow which is clear enough for mobile.
            steps.push({
                name: categoryMap[cat] || cat,
                value: -amount, // Negative for visual downside
                originalValue: -amount,
                fill: colors[cat] || '#EF4444'
            });
            totalExp += amount;
        });

        // 3. Net Profit (Final Result)
        const profit = totalIncome - totalExp;
        steps.push({
            name: 'Net Profit',
            value: profit,
            originalValue: profit,
            fill: '#3B82F6' // Blue
        });

        setWaterfallData(steps);

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
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Reports</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Financial insights & breakdown.</p>
                </div>
                {/* Filter Tabs */}
                {/* Desktop/Tablet */}
                <div style={{ background: '#F3F4F6', padding: '4px', borderRadius: '12px', display: 'flex' }}>
                    {(['Week', 'Month', 'Year'] as FilterType[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                border: 'none',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                background: filter === f ? 'white' : 'transparent',
                                color: filter === f ? 'var(--text-main)' : 'var(--text-secondary)',
                                boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid-responsive grid-2" style={{ gap: '2rem', marginBottom: '3rem' }}>
                {/* Bar Chart */}
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '0.5rem', background: '#F0FDF4', borderRadius: '8px', color: '#166534' }}><BarChart2 size={20} /></div>
                            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Income vs Expense</h3>
                        </div>
                    </div>
                    <div style={{ flex: 1, minHeight: '300px' }}>
                        <RevenueChart data={chartData} />
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '0.5rem', background: '#EFF6FF', borderRadius: '8px', color: '#1E40AF' }}><PieChartIcon size={20} /></div>
                            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Expenses Breakdown</h3>
                        </div>
                    </div>
                    <div style={{ flex: 1, minHeight: '300px' }}>
                        <ExpensePieChart data={pieData} />
                    </div>
                </div>
            </div>

            {/* Profit Flow / Waterfall */}
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', background: '#ECFCCB', borderRadius: '8px', color: '#65A30D' }}><TrendingUp size={20} /></div>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Profit Flow</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Where your money came from & where it went.</p>
                        </div>
                    </div>
                </div>
                <div style={{ flex: 1, minHeight: '350px' }}>
                    {/* We use the correct data prop name */}
                    <WaterfallChart data={waterfallData} />
                </div>
            </div>

        </div>
    );
};

export default Reports;
