
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ExpensePieChartProps {
    data: {
        name: string;
        value: number;
        color: string;
    }[];
}



const ExpensePieChart: React.FC<ExpensePieChartProps> = ({ data }) => {
    // If no data, show empty state
    if (!data || data.length === 0 || data.every(d => d.value === 0)) {
        return (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                No expense data yet
            </div>
        );
    }

    // Airbnb/Stripe Pastel Palette
    const COLORS = ['#00A699', '#FF5A5F', '#FC642D', '#484848', '#FFB400', '#767676'];

    return (
        <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        cornerRadius={6}
                        dataKey="value"
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #E5E7EB',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            padding: '12px',
                            fontFamily: 'Inter, sans-serif'
                        }}
                    />
                    <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '11px', color: '#4B5563' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ExpensePieChart;
