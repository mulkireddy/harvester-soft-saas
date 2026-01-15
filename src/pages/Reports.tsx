import React, { useEffect, useState } from 'react';
import { Loader2, BarChart2, PieChart as PieChartIcon } from 'lucide-react';
import { supabase } from '../supabase';
import RevenueChart from '../components/analytics/RevenueChart';
import ExpensePieChart from '../components/analytics/ExpensePieChart';

const Reports: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<any[]>([]);
    const [pieData, setPieData] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: jobs } = await supabase.from('jobs').select('total_amount, date');
            const { data: expenses } = await supabase.from('expenses').select('amount, date, category');

            processCharts(jobs || [], expenses || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const processCharts = (jobs: any[], expenses: any[]) => {
        // --- 1. Monthly Revenue vs Expenses ---
        const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return {
                month: d.toLocaleString('default', { month: 'short' }),
                year: d.getFullYear(),
                monthIndex: d.getMonth()
            };
        }).reverse();

        const monthlyData = last6Months.map(({ month, monthIndex, year }) => {
            const monthIncome = jobs.filter(j => {
                const d = new Date(j.date);
                return d.getMonth() === monthIndex && d.getFullYear() === year;
            }).reduce((sum, j) => sum + (j.total_amount || 0), 0);

            const monthExpense = expenses.filter(e => {
                const d = new Date(e.date);
                return d.getMonth() === monthIndex && d.getFullYear() === year;
            }).reduce((sum, e) => sum + (e.amount || 0), 0);

            return {
                name: month,
                income: monthIncome,
                expense: monthExpense
            };
        });
        setChartData(monthlyData);

        // --- 2. Expense Breakdown ---
        const categoryMap: Record<string, string> = {
            'Fuel': 'Diesel / Fuel',
            'Spares & Repairs': 'Spares & Repairs',
            'Driver Salary': 'Driver Salary',
            'Food': 'Food & Allowance',
            'Other': 'Other Expenses'
        };

        const colors: Record<string, string> = {
            'Fuel': '#EF4444',     // Red
            'Spares & Repairs': '#F59E0B',  // Amber
            'Driver Salary': '#3B82F6',     // Blue
            'Food': '#10B981',  // Green
            'Other': '#6B7280'     // Gray
        };

        const pie = Object.keys(categoryMap).map(catKey => {
            const total = expenses.filter(e => e.category === catKey).reduce((sum, e) => sum + (e.amount || 0), 0);
            return {
                name: categoryMap[catKey],
                value: total,
                color: colors[catKey] || '#CBD5E1'
            };
        }).filter(item => item.value > 0);

        setPieData(pie);
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
                <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Reports & Analytics</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Detailed breakdown of your business metrics.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.5rem', background: '#F3F4F6', borderRadius: '8px' }}><BarChart2 size={18} /></div>
                        <h3 style={{ fontSize: '1.1rem' }}>Revenue vs Expenses</h3>
                    </div>
                    <RevenueChart data={chartData} />
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.5rem', background: '#F3F4F6', borderRadius: '8px' }}><PieChartIcon size={18} /></div>
                        <h3 style={{ fontSize: '1.1rem' }}>Expense Breakdown</h3>
                    </div>
                    <ExpensePieChart data={pieData} />
                </div>
            </div>
        </div>
    );
};

export default Reports;
