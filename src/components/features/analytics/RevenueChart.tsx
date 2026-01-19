
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface RevenueChartProps {
    data: {
        name: string;
        income: number;
        expense: number;
    }[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
    return (
        <div style={{ height: '320px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 10,
                        left: -20,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00A699" stopOpacity={0.9} />
                            <stop offset="95%" stopColor="#00A699" stopOpacity={0.6} />
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF5A5F" stopOpacity={0.9} />
                            <stop offset="95%" stopColor="#FF5A5F" stopOpacity={0.6} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'Inter, sans-serif' }}
                        tickFormatter={(value) => `₹${value / 1000}k`}
                    />
                    <Tooltip
                        cursor={{ fill: '#F3F4F6' }}
                        contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #E5E7EB',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            padding: '12px',
                            fontFamily: 'Inter, sans-serif'
                        }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#6B7280' }} />
                    <Bar dataKey="income" name="Revenue" fill="url(#colorIncome)" radius={[6, 6, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="expense" name="Expenses" fill="url(#colorExpense)" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RevenueChart;
